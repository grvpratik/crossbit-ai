// fetch(
// 	"https://advanced-api-v2.pump.fun/search?mint=HQDTzNa4nQVetoG6aCbSLX9kcH7tSv2j2sTV67Etpump",
// 	{
// 		headers: {
// 			accept: "*/*",
// 			"accept-language": "en-US,en;q=0.7",
// 			priority: "u=1, i",
// 			"sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"',
// 			"sec-ch-ua-mobile": "?0",
// 			"sec-ch-ua-platform": '"Windows"',
// 			"sec-fetch-dest": "empty",
// 			"sec-fetch-mode": "cors",
// 			"sec-fetch-site": "same-site",
// 			"sec-gpc": "1",
// 		},
// 		body: null,
// 		method: "GET",

import axios from "axios";
import {
	PumpToken,
	SimilarTokens,
} from "../interfaces/solana/token-similar-coins";

export class PumpFunSimilarTokens implements SimilarTokens {
	private baseUrl = "https://advanced-api-v2.pump.fun";

	async getSimilarTokens(mintAddress: string): Promise<PumpToken[]> {
		try {
			const response = await axios.get(
				`${this.baseUrl}/search?mint=${mintAddress}`,
				{
					headers: {
						accept: "*/*",
						"accept-language": "en-US,en;q=0.7",
						priority: "u=1, i",
						"sec-ch-ua":
							'"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"',
						"sec-ch-ua-mobile": "?0",
						"sec-ch-ua-platform": '"Windows"',
						"sec-fetch-dest": "empty",
						"sec-fetch-mode": "cors",
						"sec-fetch-site": "same-site",
						"sec-gpc": "1",
					},
				}
			);

			const data = response.data;
			return data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				throw new Error(`Failed to fetch token info: ${error.message}`);
			}
			throw error;
		}
	}
}
export async function fetchUserCreatedCoins(
	address: string,
	options?: { limit: number }
): Promise<any> {
	const { limit = 10 } = options || {};
	const baseUrl = "https://frontend-api-v3.pump.fun/coins/user-created-coins";
	const url = `${baseUrl}/${address}?offset=0&limit=${limit}&includeNsfw=false`;

	try {
		const response = await axios.get(url);
		return response.data;
	} catch (error: any) {
		console.error("Error fetching user-created coins:", error);
		throw error;
	}
}

(async () => {
	const res = await fetchUserCreatedCoins(
		"CpF1shsoxZXKFaWybi74QLQmwkvQr4p95cv7hVbJXiQ8"
	);
	console.log(res);
})();
