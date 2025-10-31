import {
  assertIsAddress,
  createSolanaRpc,
  type Rpc,
  type SolanaRpcApi,
  address,
  fetchEncodedAccount,
  
} from '@solana/kit';
import { BrainCog, Wallet } from 'lucide-react';
const SYSTEM_PROGRAM_ID = address('11111111111111111111111111111111');
const TOKEN_PROGRAM_ID = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = address(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);

export const createRpcClient = (): Rpc<SolanaRpcApi> => {
  const url = import.meta.env.VITE_RPC_URL;

  return createSolanaRpc(url as string);
};
export const matchAddress = (address: string) => {
  const validSolanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  if (!validSolanaAddressRegex.test(address)) {
    return false;
  }
  try {
    assertIsAddress(address);
    return true;
  } catch (e) {
    return false;
  }
};
export const AccountIdentifiers = {
  SYSTEM: 'SYSTEM',
  TOKEN: 'TOKEN',
  ASSOCIATED_TOKEN: 'ASSOCIATED_TOKEN',
  PROGRAM: 'PROGRAM',
} ;

export type AccountIdentifierEnum =
  (typeof AccountIdentifiers)[keyof typeof AccountIdentifiers];
// implement for more rebust todo
export const fetchAccountType = async (
  client: Rpc<SolanaRpcApi>,
  pub: string,
): Promise<AccountIdentifierEnum | undefined> => {
  const encoded = await fetchEncodedAccount(client, address(pub));
  if (!encoded.exists) {
    console.log('Account does not exist.');
    return;
  }

  const programId = encoded.programAddress?.toString();
  if (!programId) {
    console.log('Program ID not found.');
    return;
  }

  switch (programId) {
    case SYSTEM_PROGRAM_ID.toString():
      return AccountIdentifiers.SYSTEM;
    case TOKEN_PROGRAM_ID.toString():
      return AccountIdentifiers.TOKEN;
    case ASSOCIATED_TOKEN_PROGRAM_ID.toString():
      return AccountIdentifiers.ASSOCIATED_TOKEN;
    default:
      return AccountIdentifiers.PROGRAM;
  }
};
export function uniqueBy(arr, keyFn) {
	const seen = new Set();
	return arr.filter((item) => {
		const key = keyFn(item);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}
export interface ChatMode {
	modeId: string;
	modeName: string;
	description?: string;
	disabled: boolean;
	featured: boolean;
	requiredAddress?: number;
	icon: React.ComponentType<any>;
	requiredTokenTypes?: AccountIdentifierEnum[];
}

export const TOOLS: ChatMode[] = [
	{
		modeId: "token-analyser",
		modeName: "Token Analyser",
		description: "In-depth research on token",
		featured: true,
		disabled: false,
		icon: BrainCog,
		requiredTokenTypes: [AccountIdentifiers.TOKEN],
	},
	{
		modeId: "wallet-research",
		modeName: "Wallet Research",
		description: "Research wallet transactions and data",
		featured: false,
		disabled: false,
		icon: Wallet,
		requiredTokenTypes: [AccountIdentifiers.SYSTEM],
	},

];

export const getTools = () => {
	return TOOLS;
};

export type ModeId = (typeof TOOLS)[number]["modeId"];
// (async () => {
//   const client = createRpcClient();
//   console.log(
//     await fetchAccountType(
//       client,
//       'BZsS3Vz7vgh5EKUDu5KjKjQPd7PH7Tb6GDoZUZg6ZtE2',
//     ),
//   );
  
// })();
