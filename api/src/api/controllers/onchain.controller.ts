import { Request, Response } from 'express'
import {
  createMultiProviderConnection,
  executeWithStrategies,
  getSolPriceGecko,
  getSolPriceJUP,
  isValidSolanaAddress,
} from '../../services/onchain/utils'
import { ApiError, ValidationError } from '../../middleware/error.middleware'
import { Connection, PublicKey } from '@solana/web3.js'

import {
  getMetaplexTokenMetadata,
  TokenMetadata,
} from '../../services/onchain/pumpfun/metadata'
import {
  fetchPumpfunTradesApi,
  fetchSimilarCoins,
  fetchUserCreatedCoins,
  getPumpFunTokenMetadata,
  PumpFunTokenDetails,
} from '../../services/onchain/pumpfun/pumpfun.api'
import { analyzeTokens } from '../../services/onchain/onchain.services'
import {
  getBondingCurveAddress,
  getBondingCurveInfo,
  getBondingCurveState,
} from '../../services/onchain/pumpfun/bondingCurve'
import { PUMPFUN_UPDATE_AUTHORITY } from '../../services/onchain/constant'
import { getTokenAccountsByMint } from '../../services/onchain/pumpfun/rpc'

import { analyzePumpfunTradeVolume } from '../../services/onchain/pumpfun/volume'

function mapPumpFunToMetaplexMetadata(pf: PumpFunTokenDetails): TokenMetadata {
  return {
    mint: pf.mint,
    name: pf.name,
    symbol: pf.symbol,
    decimals: 6,
    supply: pf.total_supply.toString(),
    mintAuthority: null,
    freezeAuthority: null,
    updateAuthority: PUMPFUN_UPDATE_AUTHORITY,
    creator: pf.creator,
    metadataUri: pf.metadata_uri,
    isPumpfun: true,
    externalMetadata: {
      name: pf.name,
      symbol: pf.symbol,
      description: pf.description,
      image: pf.image_uri,
      showName: pf.show_name,
      createdOn: 'https://pump.fun',
      twitter: pf.twitter ?? '',
      website: pf.website ?? '',
    },
  }
}

export async function getStaticTokenMetaDataEndpoint(req: Request, res: Response) {
  const tokenAddress = req.params.ca

  if (!tokenAddress) throw new ValidationError('Token CA is required')
  if (!isValidSolanaAddress(tokenAddress))
    throw new ValidationError('Invalid Solana address')

  const connection = await createMultiProviderConnection()

  const tokenStrategies = [
    {
      name: 'MetaplexStrategy',
      execute: () => getMetaplexTokenMetadata(tokenAddress, connection),
    },
    {
      name: 'PumpFunStrategy',
      execute: () => getPumpFunTokenMetadata(tokenAddress),
    },
  ]

  const metadataResult = await executeWithStrategies<
    PumpFunTokenDetails | TokenMetadata
  >(tokenStrategies)

  if (!metadataResult.success) {
    throw new ApiError('Unable to fetch token metadata')
  }

  const staticToken: TokenMetadata =
    metadataResult.strategyUsed === 'PumpFunStrategy'
      ? mapPumpFunToMetaplexMetadata(
          metadataResult.result as PumpFunTokenDetails
        )
      : (metadataResult.result as TokenMetadata)

  const creator =
    staticToken.creator ?? (await getPumpFunTokenMetadata(tokenAddress)).creator

  // Fetch creator tokens and analyze them
  const { coins: creatorTokens } = await fetchUserCreatedCoins(creator, {
    limit: 50,
  })
  const creatorAnalysis = analyzeTokens(creatorTokens)

  // Fetch similar tokens
  const similarCoins = await fetchSimilarCoins(tokenAddress, 10)

  const similarCoinsBrief = similarCoins.map((coin: PumpFunTokenDetails) => ({
    mint: coin.mint,
    name: coin.name,
    symbol: coin.symbol,
    desc: coin.description,
    image: coin.image_uri,
    twitter: coin.twitter,
    telegram: coin.telegram,
    website: coin.website,
    marketcap: coin.usd_market_cap,
    complete: coin.complete,
    king_of_hill: coin.king_of_the_hill_timestamp,
    created: coin.created_timestamp,
  }))

  res.json({
    staticToken,
    creatorAnalysis,
    similarCoins: similarCoinsBrief,
  })
}
export async function getTokenPriceEndpoint(req: Request, res: Response) {
  const tokenAddress = req.params.ca

  if (!tokenAddress) throw new ValidationError('Token CA is required')
  if (!isValidSolanaAddress(tokenAddress))
    throw new ValidationError('Invalid Solana address')
  const conn = await createMultiProviderConnection()
  const mint = new PublicKey(tokenAddress)
  const curveState = await getBondingCurveInfo(conn, mint)
  const tokenPriceSOL = curveState.tokenPrice.toFixed(12)
  const solPriceProvider = [
    {
      name: 'GECKO',
      execute: () => getSolPriceGecko(),
    },
    { name: 'JUP', execute: () => getSolPriceJUP() },
  ]
  const price = await (await executeWithStrategies(solPriceProvider)).result
      // console.log(price)
  const validSolPrice = isNaN(price!) ? 0 : price

  const priceInUSD = (Number(tokenPriceSOL) * Number(validSolPrice)).toFixed(12)
      // console.log(priceInUSD)

  //bonding curve progrss(marketcap,progress percent,price,) {edge cases:not pf coin(check amm liqidity pools),curve completed}
  // holders(dynamic){edgecases:idk till know )}
  // volume(dynamic)(currently using trades from bonding curve accounts or pf for pf){edge cases:not pf then idk where to get volume,and graduated }

  const tokenMarketCap = Number(1e9) * Number(priceInUSD)

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.json({
    tokenPriceSOL,
    tokenMarketCap,
    priceInUSD,
  
  })
}
export async function getTokenHoldersEndpoint(req: Request, res: Response) {
  const tokenAddress = req.params.ca

  if (!tokenAddress) throw new ValidationError('Token CA is required')
  if (!isValidSolanaAddress(tokenAddress))
    throw new ValidationError('Invalid Solana address')

  try {
    const holders = await getTokenAccountsByMint(tokenAddress)
    // console.log(holders)
    return res.json({
      success: true,
      result: holders,
    })
  } catch (error) {
    throw new ApiError('Error fetching holders')
  }
}
export async function getTokenVolumeEndpoint(req: Request, res: Response) {
  const tokenAddress = req.params.ca

  if (!tokenAddress) throw new ValidationError('Token CA is required')
  if (!isValidSolanaAddress(tokenAddress))
    throw new ValidationError('Invalid Solana address')
  //redis implemetation
  // implementation for graduated and non pf coins
  const connection = await createMultiProviderConnection()
  const tokenInfo = await getMetaplexTokenMetadata(tokenAddress, connection)
  if (tokenInfo.updateAuthority !== PUMPFUN_UPDATE_AUTHORITY) {
    throw new ApiError('currently only available for pumfun tokens')
  }
  const { complete } = await getBondingCurveState(
    connection,
    new PublicKey(tokenAddress)
  )
  if (complete) {
    throw new ApiError('bonding curve completed !!')
  }

  const trades = await fetchPumpfunTradesApi(tokenAddress)
  const latestTrade = trades && trades.length ? trades[0] : null
  const volumeRes = analyzePumpfunTradeVolume(trades)

  return {
    success: true,
    result: {
      latestTrade,
      volumeRes,
    },
  }
}
export async function getBondingCurveStateEndpoint(
  req: Request,
  res: Response
) {
  const tokenAddress = req.params.ca

  if (!tokenAddress) throw new ValidationError('Token CA is required')
  if (!isValidSolanaAddress(tokenAddress))
    throw new ValidationError('Invalid Solana address')
  const connection = await createMultiProviderConnection()
  const bondingCurve = await getBondingCurveInfo(
    connection,
    new PublicKey(tokenAddress)
  )
  res.json({
    success:true,
    result:bondingCurve
  })
}

