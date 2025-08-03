import axios from 'axios'
import { Connection, PublicKey } from '@solana/web3.js'
import { PumpFunParser } from './parser'
import logger from '../../../utils/logger'
export interface PumpFunTokenDetails {
  mint: string
  name: string
  symbol: string
  description: string
  image_uri: string
  metadata_uri: string
  twitter: string | null
  telegram: string | null
  bonding_curve: string
  associated_bonding_curve: string
  creator: string
  created_timestamp: number
  raydium_pool: string | null
  complete: boolean
  virtual_sol_reserves: number
  virtual_token_reserves: number
  hidden: boolean | null
  total_supply: number
  website: string | null
  show_name: boolean
  last_trade_timestamp: number
  king_of_the_hill_timestamp: number | null
  market_cap: number
  nsfw: boolean
  market_id: string | null
  inverted: boolean | null
  real_sol_reserves: number
  real_token_reserves: number
  livestream_ban_expiry: number
  last_reply: number
  reply_count: number
  is_banned: boolean
  is_currently_live: boolean
  initialized: boolean
  video_uri: string | null
  updated_at: number
  pump_swap_pool: string | null
  ath_market_cap: number
  ath_market_cap_timestamp: number
  usd_market_cap: number
}

export async function getPumpFunTokenMetadata(
	mintAddress: string
): Promise<PumpFunTokenDetails> {
	const url = `https://frontend-api-v3.pump.fun/coins/${mintAddress}`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch data from Pump.fun for mint ${mintAddress}`
		);
	}

	const data: PumpFunTokenDetails = await response.json()

	return data;
}
/**
 * Fetches user-created coins from Pump.fun using Axios.
 *
 * @param address - The Solana wallet address (public key).
 * @param options - Optional settings:  limit (default: 10).
 * @returns A Promise resolving to the list of user-created coins.
 */
export async function fetchUserCreatedCoins(
  address: string,
  options?: { limit: number }
): Promise<any> {
  const { limit = 10 } = options || {}
  const baseUrl = 'https://frontend-api-v3.pump.fun/coins/user-created-coins'
  const url = `${baseUrl}/${address}?offset=0&limit=${limit}&includeNsfw=false`

  try {
    const response = await axios.get(url)
    return response.data
  } catch (error: any) {
    logger.error('Error fetching user-created coins:', error)
    throw error
  }
}

/**
 * Fetches similar coins from Pump.fun using the provided mint.
 *
 * @param mint - The token mint address.
 * @returns A Promise resolving to the list of similar coins.
 */
export async function fetchSimilarCoins(mint: string,limit:number=15): Promise<PumpFunTokenDetails[]> {
  const url = `https://frontend-api-v3.pump.fun/coins/similar?mint=${mint}&limit=${limit}`

  try {
    const response = await axios.get(url, {
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.6',
        'if-none-match': 'W/"171d9-48fgNQ1lMEANgvzdWV2Nm7IJ9/A"',
        priority: 'u=1, i',
        'sec-ch-ua': '"Brave";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'sec-gpc': '1',
        Referer: 'https://pump.fun/',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    })

    return response.data
  } catch (error: any) {
    logger.error('Error fetching similar coins:', error)
    throw error
  }
}



export async function fetchPumpfunTradesApi(
  mintAddress: string,
  options: any = {}
) {
  const limit = options.limit || 200
  const minSize = options.minSize || 10000
  const delayMs = options.delayMs || 300
  const onProgress = options.onProgress || null

  if (!mintAddress) {
    throw new Error('Mint address is required')
  }

  let allTrades: any = []
  let offset = 0
  let hasMoreTrades = true

  try {
    while (hasMoreTrades) {
      const apiUrl = `https://frontend-api-v3.pump.fun/trades/all/${mintAddress}?limit=${limit}&offset=${offset}&minimumSize=${minSize}`

      // if (onProgress) {
      //   onProgress({
      //     fetched: allTrades.length,
      //     offset,
      //     inProgress: true,
      //   })
      // }

      const response = await fetch(apiUrl, {
        headers: {
          accept: '*/*',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'sec-ch-ua':
            '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          Referer: 'https://pump.fun/',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(
          `API request failed with status ${response.status}: ${response.statusText}`
        )
      }

      const trades = await response.json()

      if (!trades || trades.length === 0) {
        hasMoreTrades = false
        break
      }

      allTrades = [...allTrades, ...trades]

      offset += limit

      if (trades.length < limit) {
        hasMoreTrades = false
        break
      }

      if (hasMoreTrades && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    // if (onProgress) {
    //   onProgress({
    //     fetched: allTrades.length,
    //     offset,
    //     inProgress: false,
    //     completed: true,
    //   })
   // }

    return allTrades.map((trade: any) => ({
      signature: trade.signature,
      mint: trade.mint,
      sol_amount: trade.sol_amount,
      token_amount: trade.token_amount,
      is_buy: trade.is_buy,
      user: trade.user,
      timestamp: trade.timestamp,

      slot: trade.slot || null,
    }))
  } catch (error) {
    logger.error('Error fetching PumpFun trades from API:', error)
    throw error
  }
}



// fetchPumpfunTradesApi('7esezYBWmGdkBW8dgdVNb5vrjcocULzq5YASZE6bpump',{limit:10}).then(i=>console.log(i))