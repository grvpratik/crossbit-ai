import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js'
import { PumpFunParser } from './parser'
import logger from '../../../utils/logger'
import { createMultiProviderConnection } from '../utils'
import { TOKEN_PROGRAM_ID } from '../constant'

/**
 * Gets parsed PumpFun trade transactions for a specific account
 * @param connection - Solana connection
 * @param accountPublicKey - The account to fetch trades for(Bonding curve assoiated account)
 * @returns Array of parsed PumpFun trade transactions
 */
export async function getParsedPumpfunTrades(
  connection: Connection,
  accountPublicKey: PublicKey
) {
  const TRANSACTION_LIMIT = 1000
  let allTrades = []
  let signatures: string[] = []
  let lastSignature = null
  let hasMoreTransactions = true

  try {
    while (hasMoreTransactions) {
      const signaturesResponse = await connection.getSignaturesForAddress(
        accountPublicKey,
        {
          limit: TRANSACTION_LIMIT,
          before: lastSignature!,
        }
      )

      if (signaturesResponse.length === 0) {
        hasMoreTransactions = false
        break
      }

      lastSignature =
        signaturesResponse[signaturesResponse.length - 1].signature

      const validSignatures = signaturesResponse
        .filter((sig) => !sig.err)
        .map((sig) => sig.signature)

      signatures = [...signatures, ...validSignatures]
    }

    const parsedTransactions = await connection.getParsedTransactions(
      signatures,
      {
        maxSupportedTransactionVersion: 0,
      }
    )

    for (let i = 0; i < parsedTransactions.length; i++) {
      const tx = parsedTransactions[i]

      if (!tx) continue

      const parser = new PumpFunParser()
      const parsedPumpfunTx = parser.parse(tx)

      if (
        parsedPumpfunTx &&
        parsedPumpfunTx.platform === 'pumpfun' &&
        parsedPumpfunTx.actions.some((action) => action.type === 'trade')
      ) {
        allTrades.push(parsedPumpfunTx)
      }
    }

    return allTrades
  } catch (error) {
    logger.error('Error fetching PumpFun trades:', error)
    throw error
  }
}
interface TokenHolderInfo {
  wallet: string
  amount: number
  percentage: number
  isWallet?: boolean
  walletName?: string
}

interface TokenDistribution {
  mint: string
  count: number
  data: TokenHolderInfo[]
}

export async function getTokenAccountsByMint(
  mintAddress: string
): Promise<TokenDistribution | null> {
  if (!mintAddress) {
    throw new Error('Mint address is required')
  }

  const connection = await createMultiProviderConnection()

  try {
    const mintPubkey = new PublicKey(mintAddress)
    const supply = await connection.getTokenSupply(mintPubkey)
    const supplyAmount = supply.value.uiAmount

    if (!supplyAmount) {
      throw new Error('Invalid token supply')
    }

    const accounts = await connection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID,
      {
        filters: [
          { dataSize: 165 },
          {
            memcmp: {
              offset: 0,
              bytes: mintPubkey.toBase58(),
            },
          },
        ],
      }
    )

    logger.info(`Found ${accounts.length} accounts for mint ${mintAddress}`)
    const result: TokenHolderInfo[] = []

    for (const account of accounts) {
      // console.log(JSON.stringify(account, null, 2))
      try {
        const parsedData = (account.account.data as ParsedAccountData).parsed
        if (parsedData.type !== 'account') continue

        const amount =
          Number(parsedData.info.tokenAmount.amount) /
          Math.pow(10, parsedData.info.tokenAmount.decimals)

        if (amount > 0) {
          result.push({
            wallet: parsedData.info.owner,
            amount: amount,
            percentage: (amount / supplyAmount) * 100,
            isWallet: PublicKey.isOnCurve(parsedData.info.owner),
          })
        }
      } catch (err) {
        logger.error('Error processing account:', err)
        continue
      }
    }

    return {
      mint: mintAddress,
      count: result.length,
      data: result.sort((a, b) => b.amount - a.amount),
    }
  } catch (error) {
    logger.error('Error fetching token accounts:', error)
    throw error
  }
}

// getTokenAccountsByMint('GTQHYAj9dYyW5shtGZpqEko57qMXEYr4tqahAvAepump').then(
//   (i) => console.log(i)
// )
