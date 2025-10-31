import { clusterApiUrl, Connection, ConnectionConfig, PublicKey, SystemProgram } from "@solana/web3.js";
import { PROGRAM, TOKEN_PROGRAM_ID } from "./constant";


type AddressVerificationResult = {
	isValid: boolean;
	error?: string;
};

type AddressInfo = {
	type:
		| "program"
		| "wallet"
		| "tokenMint"
		| "tokenAccount"
		| "unknown"
		| "invalid";
	address: string;
	isValid: boolean;
	error?: string;
	details?: {
		owner?: string;
		program?: string;
		token?: string;
		amount?: string;
		[key: string]: any;
	};
};
export function getProgramName(programId: string): string {
	for (const [key, value] of Object.entries(PROGRAM)) {
		if (value === programId) {
			return key;
		}
	}
	return "unknown";
}

/**
 * Creates a Solana connection with fallback to multiple RPC providers
 * @param {string[]} rpcUrls - Array of RPC provider URLs to try
 * @param {ConnectionConfig} config - Optional connection configuration
 * @returns {Connection} - A connected Solana connection object
 */
export  function createMultiProviderConnection(
	rpcUrls?: string[],
	config?: ConnectionConfig
): Connection {
	const defaultRpcUrls = [
		"https://lingering-clean-moon.solana-mainnet.quiknode.pro/0fc10334694bec351cf6480732a6690bff9e0ba9/",
		clusterApiUrl("mainnet-beta"),
	];

	const providersToTry = rpcUrls?.length ? rpcUrls : defaultRpcUrls;

	for (const rpcUrl of providersToTry) {
		try {
			const connection = new Connection(rpcUrl, config || "confirmed");

			return connection;
		} catch (error) {
			console.warn(`Failed to connect to RPC endpoint ${rpcUrl}:`, error);
		}
	}

	throw new Error("Failed to connect to any Solana RPC provider");
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
    const conn =  createMultiProviderConnection()
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
