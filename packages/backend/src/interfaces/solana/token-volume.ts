export interface TokenVolumeParams {
	tokenAddress: string;
	timeframe: "hour" | "day" | "week" | "month" | "year";
}

export interface TokenVolumeResponse {
	symbol: string;
	decimals: number;
	timeframe: string;
	volume: number;
	volumeUsd: number;
	txCount: number;
	timestamp: string;
}

export interface TokenVolumeData {
	data: TokenVolumeResponse[];
	success: boolean;
	message?: string;
}
export interface TokenVolumeInterface {
	getTokenVolume(tokenAddress: string): Promise<any>;
}
