import { PublicKey, SystemProgram } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "../services/onchain/constant"
import { createMultiProviderConnection, getProgramName } from "../services/onchain/utils"
import { unknown } from "zod"

// Type definitions for consistent output
type AddressVerificationResult = {
  isValid: boolean
  error?: string
}

type AddressInfo = {
  type:
    | 'program'
    | 'wallet'
    | 'tokenMint'
    | 'tokenAccount'
    | 'unknown'
    | 'invalid'
  address: string
  isValid: boolean
  error?: string
  details?: {
    owner?: string
    program?: string
    token?: string
    amount?: string
    [key: string]: any
  }
}

/**
 * Validates a Solana address string
 * @param address The address to validate
 * @returns A standardized verification result
 */
export const verifyAddress = (address: string): AddressVerificationResult => {
  
  const validSolanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

  if (!validSolanaAddressRegex.test(address)) {
    return { isValid: false, error: 'Invalid address format' }
  }

  
  try {
    new PublicKey(address)
    return { isValid: true }
  } catch (err) {
    return { isValid: false, error: 'Invalid public key construction' }
  }
}

/**
 * Inspects a Solana address to determine its type and properties
 * @param address The address to inspect
 * @returns Detailed information about the address
 */
export const getAddressInfo = async (address: string): Promise<AddressInfo> => {
  // First verify the address format
  const verification = verifyAddress(address)

  if (!verification.isValid) {
    return {
      type: 'invalid',
      address,
      isValid: false,
      error: verification.error,
    }
  }

  // Establish connection and get account info
  try {
    const conn = await createMultiProviderConnection()
    const pubkey = new PublicKey(address)
    const info = await conn.getParsedAccountInfo(pubkey)
    const acc = info.value

    // Account doesn't exist on-chain
    if (!acc) {
      return {
        type: 'invalid',
        address,
        isValid: false,
        error: 'Account not found on-chain',
      }
    }

    const owner = acc.owner.toString()
    const executable = acc.executable
    const data = acc.data

    // Program account
    if (executable) {
      return {
        type: 'program',
        address,
        isValid: true,
        details: {
          program: getProgramName(address),
          owner: getProgramName(owner),
        },
      }
    }

    // Regular wallet account
    if (owner === SystemProgram.programId.toString()) {
      return {
        type: 'wallet',
        address,
        isValid: true,
        details: {
          owner: 'System Program',
        },
      }
    }

    // Token program accounts
    if (owner === TOKEN_PROGRAM_ID.toString()) {
      if (data && typeof data === 'object' && 'parsed' in data) {
        const parsedData = data.parsed

        // Token mint
        if (parsedData.type === 'mint') {
          return {
            type: 'tokenMint',
            address,
            isValid: true,
            details: {
              decimals: parsedData.info?.decimals,
              freezeAuthority: parsedData.info?.freezeAuthority,
              mintAuthority: parsedData.info?.mintAuthority,
            },
          }
        }
        // Token account
        else if (parsedData.type === 'account') {
          const tokenInfo = parsedData.info
          return {
            type: 'tokenAccount',
            address,
            isValid: true,
            details: {
              token: tokenInfo.mint,
              owner: tokenInfo.owner,
              amount: tokenInfo.uiAmountString,
              delegate: tokenInfo.delegate,
              state: tokenInfo.state,
            },
          }
        }
      }
    }


    return {
      type: 'unknown',
      address,
      isValid: true,
      details: {
        owner,
      },
    }
  } catch (err: any) {
    return {
      type: 'invalid',
      address,
      isValid: false,
      error: `Error retrieving account info: ${err.message}`,
    }
  }
}

// // Example usage
// const checkAddress = async (address: string) => {
//   // Quick format validation
//   const quickCheck = verifyAddress(address)
//   if (!quickCheck.isValid) {
//     console.log(`Address validation failed: ${quickCheck.error}`)
//     return
//   }

//   // Full account info retrieval
//   const addressInfo = await getAddressInfo(address)
//   console.log(`Address type: ${addressInfo.type}`)

//   if (addressInfo.error) {
//     console.log(`Error: ${addressInfo.error}`)
//   } else {
//     console.log(`Details:`, addressInfo.details)
//   }
// }
