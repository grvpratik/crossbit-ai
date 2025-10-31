import { ParsedAccountData, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "../utils/constant";
import {
	TokenDistribution,
	TokenHolderInfo,
	TokenHoldersProvider,
} from "../interfaces/solana/token-holders";

import { Connection } from "@solana/web3.js";
import { createBaseUmi, publicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createMultiProviderConnection } from "../utils/rpc";
import { PUMPFUN_UPDATE_AUTHORITY } from "../utils/constant";
import {
	TokenMetadata,
	TokenMetadataProvider,
} from "../interfaces/solana/token-metadata";
import {
	fetchDigitalAsset,
	mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

export class MetaplexTokenMetadataProvider implements TokenMetadataProvider {
	private web3: Connection;
	public type = "metaplex";
	constructor() {
		this.web3 = createMultiProviderConnection();
	}

	async getTokenInfo(mintAddress: string): Promise<TokenMetadata> {
		const umi = createUmi(this.web3 as Connection).use(mplTokenMetadata());

		const mintPublicKey = publicKey(mintAddress);

		const asset = await fetchDigitalAsset(umi, mintPublicKey);
		console.log("asset", { asset });
		const mintInfo = asset.mint;
		const metadataInfo = asset.metadata;

		const uri = metadataInfo.uri || "";
		let externalMetadata: any = undefined;

		if (uri) {
			try {
				const response = await fetch(uri);
				externalMetadata = await response.json();
			} catch (error) {
				console.warn("Failed to fetch external metadata:", error);
			}
		}

		return {
			mint: mintInfo.publicKey.toString(),
			name: metadataInfo.name,
			symbol: metadataInfo.symbol,
			decimals: mintInfo.decimals,
			supply: mintInfo.supply.toString(),
			isPumpfun:
				metadataInfo.updateAuthority &&
				metadataInfo.updateAuthority.toString() === PUMPFUN_UPDATE_AUTHORITY,
			mintAuthority:
				mintInfo.mintAuthority.__option === "Some"
					? mintInfo.mintAuthority.value
					: null,
			freezeAuthority:
				mintInfo.freezeAuthority.__option === "Some"
					? mintInfo.freezeAuthority.value
					: null,
			updateAuthority: metadataInfo.updateAuthority,
			creator:
				metadataInfo.creators.__option === "Some"
					? metadataInfo.creators.value[0].address
					: null,
			metadataUri: uri,
			externalMetadata,
		};
	}
}

export class TokenHoldersRpcProvider implements TokenHoldersProvider {
	private web3: Connection;
	public type = "rpc";
	constructor() {
		this.web3 = createMultiProviderConnection();
	}
	async getHoldersInfo(
		tokenAddress: string
	): Promise<TokenDistribution> {
		if (!tokenAddress) {
			throw new Error("Mint address is required");
		}

		const connection = createMultiProviderConnection();

		try {
			const mintPubkey = new PublicKey(tokenAddress);
			const supply = await connection.getTokenSupply(mintPubkey);
			const supplyAmount = supply.value.uiAmount;

			if (!supplyAmount) {
				throw new Error("Invalid token supply");
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
			);

			console.info(
				`Found ${accounts.length} accounts for mint ${tokenAddress}`
			);
			const result: TokenHolderInfo[] = [];

			for (const account of accounts) {
				// console.log(JSON.stringify(account, null, 2))
				try {
					const parsedData = (account.account.data as ParsedAccountData).parsed;
					if (parsedData.type !== "account") continue;

					const amount =
						Number(parsedData.info.tokenAmount.amount) /
						Math.pow(10, parsedData.info.tokenAmount.decimals);

					if (amount > 0) {
						result.push({
							wallet: parsedData.info.owner,
							amount: amount,
							percentage: (amount / supplyAmount) * 100,
							isWallet: PublicKey.isOnCurve(parsedData.info.owner),
						});
					}
				} catch (err) {
					console.error("Error processing account:", err);
					continue;
				}
			}

			const sorted = result.sort((a, b) => b.amount - a.amount);
			const data = sorted.slice(0, 20);
			const top10Percentage = sorted
				.filter((h) => h.isWallet)
				.slice(0, 10)
				.reduce((sum, h) => sum + (h.percentage || 0), 0);

			return {
				mint: tokenAddress,
				count: result.length,
				data,
				top10: top10Percentage,
			};
		} catch (error) {
			console.error("Error fetching token accounts:", error);
			throw error;
		}
	}
}

// (async () => {
// 	const m = new MetaplexTokenMetadataProvider();
// 	console.log(
// 		await m.getTokenInfo("3N2ETvNpPNAxhcaXgkhKoY1yDnQfs41Wnxsx5qNJpump")
// 	);
// })();
