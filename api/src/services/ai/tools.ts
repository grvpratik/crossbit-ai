import {
  AddressLookupTableAccount,
  BPF_LOADER_DEPRECATED_PROGRAM_ID,
  Connection,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, validSolanaAddressRegex } from '../onchain/constant'
import { createMultiProviderConnection, getProgramName } from '../onchain/utils'
import { DataStreamWriter, tool } from 'ai'
import { z } from 'zod'
import { getMetaplexTokenMetadata } from '../onchain/pumpfun/metadata'
import { getBondingCurveInfo } from '../onchain/pumpfun/bondingCurve'
import {
  fetchPumpfunTradesApi,
  fetchSimilarCoins,
  fetchUserCreatedCoins,
  PumpFunTokenDetails,
} from '../onchain/pumpfun/pumpfun.api'
import { analyzePumpfunTradeVolume } from '../onchain/pumpfun/volume'
import { getAddressInfo } from '../../utils/helper'

type ResearchStatus =
  | 'waiting'
  | 'processing'
  | 'completed'
  | 'skipped'
  | 'failed'


export interface ResearchStep {
  id: string
  title: string
  description: string
  status: ResearchStatus
  message?: string
  result?: any
  timestamp?: string
}
export const updateStepStatus = (
  dataStreamWriter: DataStreamWriter,
  steps: ResearchStep[],
  stepId: string,
  status: ResearchStatus,
  message?: string,
  result?: any
) => {
  const stepIndex = steps.findIndex((step) => step.id === stepId)
  if (stepIndex !== -1) {
    steps[stepIndex].status = status
    steps[stepIndex].message = message
    steps[stepIndex].result = result
    steps[stepIndex].timestamp = new Date().toISOString()

    // Calculate overall progress (completed steps / total steps)
    const completedSteps = steps.filter(
      (s) => s.status === 'completed' || s.status === 'skipped'
    ).length
    const overallProgress = Math.round((completedSteps / steps.length) * 100)

    // Update the UI
    dataStreamWriter.writeData({
      type: 'research_progress',
      steps: steps as any,
      currentStep: stepId,
      overallProgress: overallProgress,
    })
  }
}

export const executeStep = async <T>(
  dataStreamWriter: DataStreamWriter,
  steps: ResearchStep[],
  stepId: string,
  operation: () => Promise<T>
): Promise<T> => {
  try {
    updateStepStatus(
      dataStreamWriter,
      steps,
      stepId,
      'processing',
      `Processing ${stepId}...`
    )
    const result = await operation()
    updateStepStatus(
      dataStreamWriter,
      steps,
      stepId,
      'completed',
      `Completed ${stepId}`,
      result
    )
    return result
  } catch (error: any) {
    updateStepStatus(
      dataStreamWriter,
      steps,
      stepId,
      'failed',
      `Failed: ${error.message}`
    )
    throw error
  }
}






export const checkSolanaAddressTool = tool({
  description:
    'Analyzes a Solana address to determine its type (wallet, program, token mint, or token account) and returns relevant details. Can validate addresses and fetch basic on-chain information.',
  parameters: z.object({
    address: z
      .string()
      .describe(
        'A Solana public key/address in base58 format (e.g., "2BtL3croUvjdPZGZNfqwpcCrUCSknZQeJCP2tBNDTA1D"). Will be checked for validity and analyzed for its type and properties.'
      ),
  }),
  execute: async ({ address }) => {
    return getAddressInfo(address)
  },
})
export const getTokenMetadataTool = tool({
  description:
    'Fetches metadata and detailed information for a Solana token mint, including name, symbol, decimals, and other associated metadata if available. Only works for valid token mint addresses.',
  parameters: z.object({
    mint: z
      .string()
      .regex(validSolanaAddressRegex, 'Must be a valid Solana address')
      .describe(
        'A Solana token mint address in base58 format. Must be a valid token mint address as verified by checkSolanaAddress (type: tokenMint).'
      ),
  }),
  execute: async ({ mint }) => {
    const connection = await createMultiProviderConnection()
    return await getMetaplexTokenMetadata(mint, connection)
  },
})
export const getPumpfunBondingCurveTool = tool({
  description:
    "Retrieves detailed bonding curve information for a Pumpfun token, including current price, supply, and curve parameters. Only works for active tokens in the Pumpfun protocol that haven't graduated.",
  parameters: z.object({
    mint: z
      .string()
      .regex(
        validSolanaAddressRegex,
        'Must be a valid Solana pumpfun token address'
      )
      .describe(
        'The Solana token mint address to check bonding curve status. Only works for tokens verified as Pumpfun tokens (isPumpfun=true in token metadata). Returns current price, supply metrics, and graduation progress.'
      ),
  }),
  execute: async ({ mint }) => {
    const connection = await createMultiProviderConnection()
    return await getBondingCurveInfo(connection, new PublicKey(mint))
  },
})
export const similarPumpfunTokensTool = tool({
  description:
    'Finds similar Pumpfun tokens based on name, symbol, and other attributes. Helps identify potential impersonators by comparing metadata, completion status, and market caps. Returns a list of tokens with their key details sorted by similarity and marketcap.',
  parameters: z.object({
    mint: z
      .string()
      .regex(
        validSolanaAddressRegex,
        'Must be a valid Solana pumpfun token address'
      )
      .describe(
        'The token mint address to find similar tokens for. Compares against other Pumpfun tokens to detect similar names, symbols or potential impersonators. Returns metadata, market caps and completion status to help identify legitimate vs copycat tokens.'
      ),
  }),
  execute: async ({ mint }) => {
    try {
      const res = await fetchSimilarCoins(mint, 15)
      if (res && res.length > 0) {
        const list = res.map((coin: PumpFunTokenDetails) => {
          return {
            mint: coin.mint,
            name: coin.name,
            desc: coin.description,
            symbol: coin.symbol,
            image: coin.image_uri,
            metadata_uri: coin.metadata_uri,
            created_at: coin.created_timestamp,
            marketcap: coin.usd_market_cap,
            completed: coin.complete,
          }
        })
        return list
      } else {
        return { error: 'no similar mint found..' }
      }
    } catch (error) {
      return { error: 'failed to fetch data' }
    }
  },
})
/**
 * Analyzes a Solana wallet address to retrieve information about tokens created by that address,
 * helping assess creator history and potential legitimacy.
 *
 * This tool is designed to:
 * - Fetch all tokens created by a specific wallet address
 * - Track the number of "dead" tokens (those with market cap > $5000)
 * - Provide detailed information about each token including mint, name, symbol, and market metrics
 *
 * The analysis helps evaluate:
 * - Creator's track record in token launches
 * - Percentage of failed/dead projects
 * - Historical pattern of token creation
 *
 * @param {Object} params - The parameters object
 * @param {string} params.address - The Solana wallet address to analyze for token creation history.
 *                                 Used to identify patterns of legitimate creators vs potential rugpulls
 * @returns {Promise<Object>} Returns an object containing:
 *          - count: total number of tokens created
 *          - deadCoins: number of tokens with market cap > $5000
 *          - list: detailed array of token information
 *          - message: "no item found" if no tokens exist
 *          - error: error message if fetch fails
 */
export const pumfunCreatorCheckTool = tool({
  description:
    'Analyzes a Solana wallet address to retrieve and evaluate tokens created by that address, helping assess creator history and legitimacy. Returns detailed information about token creation patterns, success rates, and market metrics.',
  parameters: z.object({
    address: z
      .string()
      .regex(validSolanaAddressRegex, 'Must be a valid Solana wallet address')
      .describe(
        'A Solana wallet address to analyze for token creation history. Used to identify patterns of legitimate creators vs potential suspicious activity by examining their past token launches.'
      ),
  }),
  execute: async ({ address }) => {
    try {
      const res = (await fetchUserCreatedCoins(address, { limit: 500 })).coins
      if (res && res.length > 0) {
        const count = res.length || 0

        let deadCoins = 0
        const list = res.map((coin: PumpFunTokenDetails) => {
          if (coin.usd_market_cap > 6000) deadCoins++
          // return {
          //   mint: coin.mint,
          //   name: coin.name,
          //   symbol: coin.symbol,
          //   image: coin.image_uri,
          //   metadata_uri: coin.metadata_uri,
          //   created_at: coin.created_timestamp,
          //   marketcap: coin.usd_market_cap,
          //   completed: coin.complete,
          //   dead: coin.usd_market_cap > 5000 ? true : false,
          // }
        })
        return {
          count,
          deadCoins,
        }
      } else {
        return { message: 'no item found' }
      }
    } catch (error) {
      return { error: 'unable to fetch token of creator' }
    }
  },
})

export const pumfunVolumeCheckTool = tool({
  description: '',
  parameters: z.object({
    mint: z
      .string()
      .regex(
        validSolanaAddressRegex,
        'Must be a valid Solana pumpfun token address'
      )
      .describe(''),
  }),
  execute: async ({ mint }) => {
    try {
      const trades = await fetchPumpfunTradesApi(mint)
      const latestTrade = trades && trades.length ? trades[0] : null
      const res = analyzePumpfunTradeVolume(trades)
      return { vol: res, lastTrade: latestTrade }
    } catch (error) {
      return { error: 'error fetching volume' }
    }
  },
})
// export const getTokenMarketTool=tool({

// })

//socials
 

export const analyzeTwitterTool= tool({
description:'',
parameters:z.string().describe(''),
execute:async(query:string)=>{

}
})

const tools = {
  checkSolanaAddressTool,
  getTokenMetadataTool,
  getPumpfunBondingCurveTool,
  similarPumpfunTokensTool,
  pumfunCreatorCheckTool,

}

export default tools
//bundled

// export async function webSearachTool=tool({})
