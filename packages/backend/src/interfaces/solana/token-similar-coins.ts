import { SearchResponse, SearchResult } from "@solana-tracker/data-api";

export interface PumpToken {
	coinMint: string;
	dev: string;
	name: string;
	ticker: string;
	imageUrl: string;
	creationTime: number;
	numHolders: number;
	marketCap: number;
	volume: number;
	currentMarketPrice: number;
	bondingCurveProgress: number;
	sniperCount: number;
	graduationDate: number | null;

	allTimeHighMarketCap: number;
	poolAddress: string | null;
	twitter: string | null;
	telegram: string | null;
	website: string | null;
	hasTwitter: boolean;
	hasTelegram: boolean;
	hasWebsite: boolean;
	hasSocial: boolean;

	buyTransactions: number;
	sellTransactions: number;
	transactions: number;
}

export interface SimilarTokens {
	getSimilarTokens(
		tokenAddress: string,
		name?: string,
		symbol?: string,
		limit?: number
	): Promise<PumpToken[] | SearchResponse>;
	type: string;
}
