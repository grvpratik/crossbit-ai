export interface TokenHolderInfo {
	wallet: string;
	amount: number;
	percentage: number;
	isWallet?: boolean;
	walletName?: string;
}

export interface TokenDistribution {
	mint: string;
	count: number;
	data: TokenHolderInfo[];
	top10: number;
}
export interface TokenHoldersProvider {
	getHoldersInfo(tokenAddress: string): Promise<TokenDistribution>;
	type:string;
}
