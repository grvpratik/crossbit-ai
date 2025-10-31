export interface TokenCreatorToken {
	name: string | null;
	symbol: string | null;
	mint: string;
	image?: string | null;
	decimals?: number | null;
	hasSocials?: boolean;
	poolAddress?: string | null;
	liquidityUsd?: number;
	marketCapUsd?: number;
	priceUsd?: number;
	lpBurn?: number;
	market?: string | null;
	freezeAuthority?: string | null;
	mintAuthority?: string | null;
	createdAt?: number | null;
	lastUpdated?: number | null;
	buys?: number;
	sells?: number;
	totalTransactions?: number;
}

export interface TokenCreatorResponse {
	total: number;
	tokens: TokenCreatorToken[];
}

export interface TokenCreatorHistory {
	getCreatorHistory(
		wallet: string,
		page?: number,
		limit?: number
	): Promise<TokenCreatorResponse>;
	 type:string;
}
