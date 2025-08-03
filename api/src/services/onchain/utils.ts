import { PublicKey } from '@solana/web3.js'

import { Connection, ConnectionConfig, clusterApiUrl } from '@solana/web3.js'
import logger from '../../utils/logger'
import { PROGRAM, WSOL } from './constant'
import axios from 'axios'



interface FallbackStrategy<T> {
  name: string
  execute(): Promise<T>
}
/**
 * Validates whether a string represents a valid Solana address
 * @param {string} address - The string to validate as a Solana address
 * @returns {boolean} - Returns true if the string is a valid Solana address, false otherwise
 */

export function isValidSolanaAddress(address: string) {
  try {
    const publicKey = new PublicKey(address)
    return PublicKey.isOnCurve(publicKey.toBuffer())
  } catch (error) {
    return false
  }
}
/**
 * Creates a Solana connection with fallback to multiple RPC providers
 * @param {string[]} rpcUrls - Array of RPC provider URLs to try
 * @param {ConnectionConfig} config - Optional connection configuration
 * @returns {Promise<Connection>} - A connected Solana connection object
 */
export async function createMultiProviderConnection(
  rpcUrls?: string[],
  config?: ConnectionConfig
): Promise<Connection> {
  const defaultRpcUrls = [
    'https://lingering-clean-moon.solana-mainnet.quiknode.pro/0fc10334694bec351cf6480732a6690bff9e0ba9/',
    clusterApiUrl('mainnet-beta'),
  ]

  const providersToTry = rpcUrls?.length ? rpcUrls : defaultRpcUrls

  for (const rpcUrl of providersToTry) {
    try {
      const connection = new Connection(rpcUrl, config || 'confirmed')

      const blockHeight = await connection.getBlockHeight()
      logger.info(
        `Connected to Solana via ${rpcUrl} (block height: ${blockHeight})`
      )

      return connection
    } catch (error) {
      logger.warn(`Failed to connect to RPC endpoint ${rpcUrl}:`, error)
    }
  }

  throw new Error('Failed to connect to any Solana RPC provider')
}
/**
 * Fetches the current SOL/USD price from Jupiter's Price API.
 * @returns {Promise<number|null>} The current price of SOL in USD, or null if an error occurs.
 */
export async function getSolPriceJUP() {
  try {
    const response = await axios.get(
      `https://price.jup.ag/v4/price?ids=${WSOL}`
    )
    const priceData = response.data.data[WSOL]
    return priceData.price ? Number(priceData.price) : null
  } catch (error) {
    logger.error('Error fetching SOL(JUP) price:', error)
    return null
  }
}
/**
 * Fetches the current SOL/USD price from Gecko's Price API.
 * @returns {Promise<number|null>} The current price of SOL in USD, or null if an error occurs.
 */
export async function getSolPriceGecko(): Promise<number | null> {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
    )

    const data = await response.data

    const solanaPrice = data.solana.usd

    return solanaPrice ? Number(solanaPrice) : null
  } catch (error) {
    logger.error('Error fetching SOL price(GECKO)')
    return null
  }
}


export async function executeWithStrategies<T>(
  strategies: FallbackStrategy<T>[],
  maxRetries = 3
): Promise<{
  success: boolean
  result?: T
  strategyUsed?: string
  error?: Error
  message?: string
}> {
  const allStrategies = [...strategies]
  let strategyQueue = [...strategies]
  let lastError: Error | null = null
  let retryCount = 0

  while (strategyQueue.length > 0 && retryCount < maxRetries) {
    const currentStrategy = strategyQueue.shift()
    if (!currentStrategy) continue

    try {
      const result = await currentStrategy.execute()
      return {
        success: true,
        result,
        strategyUsed: currentStrategy.name,
      }
    } catch (error) {
      console.error(`Strategy ${currentStrategy.name} failed:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))

      if (strategyQueue.length === 0) {
        strategyQueue = [...allStrategies]
        retryCount++
      }
    }
  }

  return {
    success: false,
    error: lastError || new Error('Unknown error'),
    message: `All strategies failed after ${maxRetries} retry cycles`,
  }
}

export function getProgramName(programId: string): string {
  for (const [key, value] of Object.entries(PROGRAM)) {
    if (value === programId) {
      return key
    }
  }
  return 'unknown'
}