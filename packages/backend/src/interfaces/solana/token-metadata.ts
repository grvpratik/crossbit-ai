import { TokenDetailResponse } from "@solana-tracker/data-api";

export interface TokenMetadata {
	mint: string;
	name: string;
	symbol: string;
	decimals: number;
	supply: string;
	isPumpfun?: boolean;
	mintAuthority: string | null;
	freezeAuthority: string | null;
	updateAuthority: string;
	creator: string | null;
	metadataUri: string;
	externalMetadata?: any;
}

export interface TokenMetadataProvider {
	getTokenInfo(
		tokenAddress: string
	): Promise<TokenMetadata | TokenDetailResponse>;
	type: string;
}
