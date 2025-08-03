import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  mplTokenMetadata,
  fetchDigitalAsset,
} from '@metaplex-foundation/mpl-token-metadata'
import { Connection, PublicKey } from '@solana/web3.js'
import { publicKey } from '@metaplex-foundation/umi'
import logger from '../../../utils/logger'
import { PUMPFUN_UPDATE_AUTHORITY } from '../constant'

export interface TokenMetadata {
  mint: string
  name: string
  symbol: string
  decimals: number
  supply: string
  isPumpfun:boolean,
  mintAuthority: string | null
  freezeAuthority: string | null
  updateAuthority: string
  creator: string | null
  metadataUri: string
  externalMetadata?: any
}

export async function getMetaplexTokenMetadata(
  mintAddress: string,
  connection: Connection
): Promise<TokenMetadata> {
  const umi = createUmi(connection).use(mplTokenMetadata())
  const mintPublicKey = publicKey(mintAddress)

  const asset = await fetchDigitalAsset(umi, mintPublicKey)

  const mintInfo = asset.mint
  const metadataInfo = asset.metadata

  const uri = metadataInfo.uri || ''
  let externalMetadata: any = undefined

  if (uri) {
    try {
      const response = await fetch(uri)
      externalMetadata = await response.json()
    } catch (error) {
      logger.warn('Failed to fetch external metadata:', error)
    }
  }

  return {
    mint: mintInfo.publicKey.toString(),
    name: metadataInfo.name,
    symbol: metadataInfo.symbol,
    decimals: mintInfo.decimals,
    supply: mintInfo.supply.toString(),
    isPumpfun:
      metadataInfo.updateAuthority &&
      metadataInfo.updateAuthority.toString() === PUMPFUN_UPDATE_AUTHORITY,
    mintAuthority:
      mintInfo.mintAuthority.__option === 'Some'
        ? mintInfo.mintAuthority.value
        : null,
    freezeAuthority:
      mintInfo.freezeAuthority.__option === 'Some'
        ? mintInfo.freezeAuthority.value
        : null,
    updateAuthority: metadataInfo.updateAuthority,
    creator:
      metadataInfo.creators.__option === 'Some'
        ? metadataInfo.creators.value[0].address
        : null,
    metadataUri: uri,
    externalMetadata,
  }
}
