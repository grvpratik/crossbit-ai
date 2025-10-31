import { TokenCreatorHistory } from "../interfaces/solana/token-creator";
import { TokenHoldersProvider } from "../interfaces/solana/token-holders";
import { TokenMetadataProvider } from "../interfaces/solana/token-metadata";
import { SimilarTokens } from "../interfaces/solana/token-similar-coins";
import { TokenVolumeInterface } from "../interfaces/solana/token-volume";

export class MetadataService {
	private providers: TokenMetadataProvider[] = [];

	registerProvider(provider: TokenMetadataProvider) {
		this.providers.push(provider);
	}

	async getTokenInfo(address: string) {
		const errors: Error[] = [];

		for (const provider of this.providers) {
			try {
				const result = await provider.getTokenInfo(address);
				console.log("gettokeninfo", result);
				return { ...result, used: provider.type };
			} catch (err) {
				errors.push(err as Error);
			}
		}

		throw new Error(
			`All providers failed. Errors: \n${errors
				.map((e) => e.message)
				.join("\n")}`
		);
	}
}
export class CreatorHistoryService {
	private providers: TokenCreatorHistory[] = [];

	registerProvider(provider: TokenCreatorHistory) {
		this.providers.push(provider);
	}

	async getTokenHistory(address: string): Promise<any> {
		const errors: Error[] = [];

		for (const provider of this.providers) {
			try {
				const result = await provider.getCreatorHistory(address);
				return { ...result, used: provider.type };
			} catch (err) {
				errors.push(err as Error);
			}
		}

		throw new Error(
			`All providers failed. Errors: \n${errors
				.map((e) => e.message)
				.join("\n")}`
		);
	}
}

export class SimilarCoinsService {
	private providers: SimilarTokens[] = [];

	registerProvider(provider: SimilarTokens) {
		this.providers.push(provider);
	}

	async getSimilarCoins(
		address: string,
		name?: string,
		symbol?: string
	): Promise<any> {
		const errors: Error[] = [];

		for (const provider of this.providers) {
			try {
				const result = await provider.getSimilarTokens(address, name, symbol);
				return { ...result, used: provider.type };
			} catch (err) {
				errors.push(err as Error);
			}
		}

		throw new Error(
			`All providers failed. Errors: \n${errors
				.map((e) => e.message)
				.join("\n")}`
		);
	}
}
export class TokenVolumeService {
	private providers: TokenVolumeInterface[] = [];

	registerProvider(provider: TokenVolumeInterface) {
		this.providers.push(provider);
	}

	async getVolumeAnalysis(address: string): Promise<any> {
		const errors: Error[] = [];

		for (const provider of this.providers) {
			try {
				const result = await provider.getTokenVolume(address);
				return { ...result, used: provider.type };
			} catch (err) {
				errors.push(err as Error);
			}
		}

		throw new Error(
			`All providers failed. Errors: \n${errors
				.map((e) => e.message)
				.join("\n")}`
		);
	}
}
export class CoinHoldersService implements TokenHoldersProvider {
	private providers: TokenHoldersProvider[] = [];
	public type = "rpc";
	registerProvider(provider: TokenHoldersProvider) {
		this.providers.push(provider);
	}

	async getHoldersInfo(address: string) {
		const errors: Error[] = [];

		for (const provider of this.providers) {
			try {
				const result = await provider.getHoldersInfo(address);
				return { ...result, used: provider.type };
			} catch (err) {
				errors.push(err as Error);
			}
		}

		throw new Error(
			`All providers failed. Errors: \n${errors
				.map((e) => e.message)
				.join("\n")}`
		);
	}
}
