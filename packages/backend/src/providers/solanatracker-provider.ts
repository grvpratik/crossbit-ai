import {
	Client,
	SearchResponse,
	TokenDetailResponse,
	Trade,
} from "@solana-tracker/data-api";
import {
	TokenCreatorHistory,
	TokenCreatorResponse,
} from "../interfaces/solana/token-creator";
import { SimilarTokens } from "../interfaces/solana/token-similar-coins";
import { TokenVolumeInterface } from "../interfaces/solana/token-volume";
import { Connection } from "@solana/web3.js";
import { TokenMetadataProvider } from "../interfaces/solana/token-metadata";

export class MetadataBySoltracker implements TokenMetadataProvider {
	private client: Client;
	public type = "soltracker";
	constructor() {
		this.client = new Client({
			apiKey: process.env.SOLANA_TRACKER_API as string,
		});
	}

	async getTokenInfo(mintAddress: string): Promise<TokenDetailResponse> {
		const info = await this.client.getTokenInfo(mintAddress);
		return info;
	}
}

export class CreatedTokenBySoltraker implements TokenCreatorHistory {
	private client: Client;
	public type = "soltracker";
	constructor() {
		this.client = new Client({
			apiKey: process.env.SOLANA_TRACKER_API as string,
		});
	}

	async getCreatorHistory(
		wallet: string,
		page?: number,
		limit: number = 20
	): Promise<TokenCreatorResponse> {
		const res = await this.client.getTokensByDeployer(wallet, page, limit);
		return res;
	}
}
export class SearchTokenBySoltracker implements SimilarTokens {
	private client: Client;
	public type: string = "soltracker";
	constructor() {
		this.client = new Client({
			apiKey: process.env.SOLANA_TRACKER_API as string,
		});
	}

	async getSimilarTokens(
		tokenAddress: string,
		name?: string,
		symbol?: string,
		limit: number = 10
	) {
		const res = await this.client.searchTokens({
			query: name || symbol || tokenAddress,
			page: 1,
			limit,
			sortBy: "volume",
			sortOrder: "desc",
		});
		return res;
	}
}
export class TokenVolumeBySoltraker implements TokenVolumeInterface {
	private client: Client;

	constructor() {
		this.client = new Client({
			apiKey: process.env.SOLANA_TRACKER_API as string,
		});
	}

	async getTokenVolume(tokenAddress: string): Promise<any> {
		const info = await this.client.getTokenInfo(tokenAddress);

		const pools = info.pools;

		await new Promise((resolve) => setTimeout(resolve, 3000));
		const txs = await this.client.getTokenTrades(
			tokenAddress,
			undefined,
			false,
			true,
			true
		);

		const now = Date.now();
		const aggregates = computeTimeframeVolumes(
			txs.trades || [],
			now,
			[1, 5, 15]
		);

		return { pools, aggregates };
	}
}

function computeTimeframeVolumes(
	trades: Trade[],
	nowMs: number,
	minutes: number[] = [1, 5, 15]
) {
	// prepare result structure
	const res: Record<string, any> = {};

	// helper to collect top N by key
	const topN = (map: Map<string, number>, n = 5) =>
		Array.from(map.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, n)
			.map(([k, v]) => ({ key: k, volume: v }));

	// Precompute per-trade useful derived values (in case fields vary)
	const normalized: Trade[] = trades.map((t) => ({
		tx: t.tx,
		amount: Number(t.amount || 0),
		priceUsd: Number(t.priceUsd || 0),
		volume: Number(t.volume || Number(t.amount || 0) * Number(t.priceUsd || 0)),
		volumeSol: Number(t.volumeSol || 0),
		type: t.type || "unknown",
		wallet: t.wallet || "unknown",
		time: Number(t.time || 0),
		program: t.program,
		pools: t.pools || [],
	}));

	for (const m of minutes) {
		const windowMs = m * 60 * 1000;
		const from = nowMs - windowMs;

		const bucketTrades = normalized.filter(
			(t) => t.time >= from && t.time <= nowMs
		);

		const totalUsd = bucketTrades.reduce((s, t) => s + (t.volume || 0), 0);
		const totalSol = bucketTrades.reduce((s, t) => s + (t.volumeSol || 0), 0);
		const count = bucketTrades.length;

		const buys = bucketTrades.filter(
			(t) => String(t.type).toLowerCase() === "buy"
		);
		const sells = bucketTrades.filter(
			(t) => String(t.type).toLowerCase() === "sell"
		);

		const buysUsd = buys.reduce((s, t) => s + (t.volume || 0), 0);
		const sellsUsd = sells.reduce((s, t) => s + (t.volume || 0), 0);

		// VWAP (volume-weighted average price in USD) across trades
		const vwap =
			bucketTrades.reduce(
				(acc, t) => acc + (t.priceUsd || 0) * (t.volume || 0),
				0
			) / Math.max(totalUsd, 1);

		// top wallets by USD volume
		const walletMap = new Map<string, number>();
		const poolMap = new Map<string, number>();

		for (const t of bucketTrades) {
			const w = t.wallet || "unknown";
			walletMap.set(w, (walletMap.get(w) || 0) + (t.volume || 0));

			for (const p of t.pools || []) {
				poolMap.set(p, (poolMap.get(p) || 0) + (t.volume || 0));
			}
		}

		// simple per-minute time-series for the window (useful for charts)
		const minutesSeries: {
			minuteStart: number;
			usd: number;
			sol: number;
			count: number;
		}[] = [];
		for (let i = 0; i < m; i++) {
			const start = nowMs - (i + 1) * 60 * 1000;
			const end = nowMs - i * 60 * 1000;
			const items = bucketTrades.filter((t) => t.time >= start && t.time < end);
			minutesSeries.unshift({
				minuteStart: start,
				usd: items.reduce((s, t) => s + (t.volume || 0), 0),
				sol: items.reduce((s, t) => s + (t.volumeSol || 0), 0),
				count: items.length,
			});
		}

		res[`${m}m`] = {
			minutes: m,
			windowStart: from,
			windowEnd: nowMs,
			totalUsd,
			totalSol,
			count,
			buys: { count: buys.length, usd: buysUsd },
			sells: { count: sells.length, usd: sellsUsd },
			// vwap: Number.isFinite(vwap) ? vwap : 0,
			// topWallets: topN(walletMap, 10),
			// topPools: topN(poolMap, 10),
			minutesSeries,
		};
	}

	// also provide some overall derived metrics across all provided trades
	const overallTotalUsd = normalized.reduce((s, t) => s + (t.volume || 0), 0);
	const overallCount = normalized.length;

	res.overall = { totalUsd: overallTotalUsd, count: overallCount };

	return res;
}

// // ...existing code...
// export class TokenVolumeBySoltraker implements TokenVolumeInterface {
//     private client: Client;

//     constructor() {
//         this.client = new Client({
//             apiKey: process.env.SOLANA_TRACKER_API as string,
//         });
//     }

//     async getTokenVolume(tokenAddress: string): Promise<any> {
//         const info = await this.client.getTokenInfo(tokenAddress);

//         const pools = info.pools;

//         // small delay to avoid rate limits (keeps previous behavior)
//         await new Promise((resolve) => setTimeout(resolve, 3000));

//         // use a small retry wrapper to handle transient rate limits
//         const txs = await fetchWithRetries(() =>
//             this.client.getTokenTrades(tokenAddress)
//         );

//         // compute aggregated volumes for recent timeframes
//         const now = Date.now();
//         const aggregates = computeTimeframeVolumes(
//             txs.trades || [],
//             now,
//             [1, 5, 15]
//         );

//         return { pools, txs: txs.trades || [], aggregates };
//     }
// }
// // ...existing code...

// /**
//  * Small retry helper for transient provider errors (rate limits etc).
//  * Keeps retry attempts low to avoid hammering provider.
//  */
// async function fetchWithRetries<T>(
//     fn: () => Promise<T>,
//     attempts = 3,
//     initialDelayMs = 300
// ): Promise<T> {
//     let err: any;
//     let delay = initialDelayMs;
//     for (let i = 0; i < attempts; i++) {
//         try {
//             return await fn();
//         } catch (e) {
//             err = e;
//             // simple exponential backoff
//             await new Promise((res) => setTimeout(res, delay));
//             delay *= 2;
//         }
//     }
//     throw err;
// }

// /**
//  * Detect if trade timestamps are in seconds and convert to ms.
//  * Also returns adjusted nowMs if needed.
//  */
// function normalizeTimestamps(trades: Trade[], nowMs: number) {
//     // find max timestamp reported
//     const maxTime = trades.reduce((m, t) => Math.max(m, Number(t.time || 0)), 0);
//     // heuristics: if maxTime < 1e12 it's likely in seconds (ms ~ 1e12+)
//     if (maxTime > 0 && maxTime < 1e12) {
//         for (const t of trades) {
//             if (t.time) t.time = Number(t.time) * 1000;
//         }
//         // no need to change nowMs (it's already ms)
//     }
// }

// /**
//  * computeTimeframeVolumes - extended with:
//  * - timestamp normalization (seconds -> ms)
//  * - guards for empty windows
//  * - extra metrics: avg trade size, median price, percentiles, tps, buy/sell pressure, topPrograms, largest trade share
//  */
// function computeTimeframeVolumes(
//     trades: Trade[],
//     nowMs: number,
//     minutes: number[] = [1, 5, 15]
// ) {
//     // prepare result structure
//     const res: Record<string, any> = {};

//     // helper to collect top N by key
//     const topN = (map: Map<string, number>, n = 5) =>
//         Array.from(map.entries())
//             .sort((a, b) => b[1] - a[1])
//             .slice(0, n)
//             .map(([k, v]) => ({ key: k, volume: v }));

//     // Precompute per-trade useful derived values (in case fields vary)
//     const normalized: Trade[] = trades.map((t) => ({
//         tx: t.tx,
//         amount: Number(t.amount || 0),
//         priceUsd: Number(t.priceUsd || 0),
//         volume: Number(
//             t.volume ?? (Number(t.amount || 0) * Number(t.priceUsd || 0))
//         ),
//         volumeSol: Number(t.volumeSol || 0),
//         type: t.type || "unknown",
//         wallet: t.wallet || "unknown",
//         time: Number(t.time || 0),
//         program: t.program,
//         pools: t.pools || [],
//     }));

//     // normalize timestamps if provider returned seconds
//     normalizeTimestamps(normalized, nowMs);

//     // utility for percentiles
//     const percentile = (arr: number[], p: number) => {
//         if (!arr.length) return 0;
//         const sorted = arr.slice().sort((a, b) => a - b);
//         const idx = (sorted.length - 1) * p;
//         const lo = Math.floor(idx);
//         const hi = Math.ceil(idx);
//         if (lo === hi) return sorted[lo];
//         return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
//     };

//     for (const m of minutes) {
//         const windowMs = m * 60 * 1000;
//         const from = nowMs - windowMs;

//         const bucketTrades = normalized.filter(
//             (t) => t.time >= from && t.time <= nowMs
//         );

//         const totalUsd = bucketTrades.reduce((s, t) => s + (t.volume || 0), 0);
//         const totalSol = bucketTrades.reduce((s, t) => s + (t.volumeSol || 0), 0);
//         const count = bucketTrades.length;

//         const buys = bucketTrades.filter(
//             (t) => String(t.type).toLowerCase() === "buy"
//         );
//         const sells = bucketTrades.filter(
//             (t) => String(t.type).toLowerCase() === "sell"
//         );

//         const buysUsd = buys.reduce((s, t) => s + (t.volume || 0), 0);
//         const sellsUsd = sells.reduce((s, t) => s + (t.volume || 0), 0);

//         // VWAP (volume-weighted average price in USD) across trades
//         const numerator = bucketTrades.reduce(
//             (acc, t) => acc + (t.priceUsd || 0) * (t.volume || 0),
//             0
//         );
//         const vwap = totalUsd > 0 ? numerator / totalUsd : 0;

//         // top wallets by USD volume
//         const walletMap = new Map<string, number>();
//         const poolMap = new Map<string, number>();
//         const programMap = new Map<string, number>();

//         let maxTradeUsd = 0;
//         const prices: number[] = [];
//         const sizesUsd: number[] = [];

//         for (const t of bucketTrades) {
//             const w = t.wallet || "unknown";
//             walletMap.set(w, (walletMap.get(w) || 0) + (t.volume || 0));

//             for (const p of t.pools || []) {
//                 poolMap.set(p, (poolMap.get(p) || 0) + (t.volume || 0));
//             }

//             if (t.program) {
//                 programMap.set(
//                     t.program,
//                     (programMap.get(t.program) || 0) + (t.volume || 0)
//                 );
//             }

//             if (t.volume && t.volume > maxTradeUsd) maxTradeUsd = t.volume;
//             if (t.priceUsd) prices.push(t.priceUsd);
//             if (t.volume) sizesUsd.push(t.volume);
//         }

//         // simple per-minute time-series for the window (useful for charts)
//         const minutesSeries: {
//             minuteStart: number;
//             usd: number;
//             sol: number;
//             count: number;
//         }[] = [];
//         for (let i = 0; i < m; i++) {
//             const start = nowMs - (i + 1) * 60 * 1000;
//             const end = nowMs - i * 60 * 1000;
//             const items = bucketTrades.filter((t) => t.time >= start && t.time < end);
//             minutesSeries.unshift({
//                 minuteStart: start,
//                 usd: items.reduce((s, t) => s + (t.volume || 0), 0),
//                 sol: items.reduce((s, t) => s + (t.volumeSol || 0), 0),
//                 count: items.length,
//             });
//         }

//         const avgTradeUsd = count > 0 ? totalUsd / count : 0;
//         const medianPrice = percentile(prices, 0.5);
//         const priceP10 = percentile(prices, 0.1);
//         const priceP25 = percentile(prices, 0.25);
//         const priceP75 = percentile(prices, 0.75);
//         const priceP90 = percentile(prices, 0.9);

//         const tps = windowMs > 0 ? count / (windowMs / 1000) : 0;
//         const buySellRatio =
//             sellsUsd > 0 ? buysUsd / sellsUsd : sellsUsd === 0 && buysUsd === 0 ? 0 : Infinity;
//         const buyMinusSell = buysUsd - sellsUsd;
//         const largestTradeShare = totalUsd > 0 ? maxTradeUsd / totalUsd : 0;

//         res[`${m}m`] = {
//             minutes: m,
//             windowStart: from,
//             windowEnd: nowMs,
//             totalUsd,
//             totalSol,
//             count,
//             buys: { count: buys.length, usd: buysUsd },
//             sells: { count: sells.length, usd: sellsUsd },
//             vwap: Number.isFinite(vwap) ? vwap : 0,
//             avgTradeUsd,
//             medianPrice,
//             pricePercentiles: { p10: priceP10, p25: priceP25, p50: medianPrice, p75: priceP75, p90: priceP90 },
//             tps,
//             buySellRatio,
//             buyMinusSell,
//             largestTradeUsd: maxTradeUsd,
//             largestTradeShare,
//             topWallets: topN(walletMap, 10),
//             topPools: topN(poolMap, 10),
//             topPrograms: topN(programMap, 10),
//             minutesSeries,
//         };
//     }

//     // also provide some overall derived metrics across all provided trades
//     const overallTotalUsd = normalized.reduce((s, t) => s + (t.volume || 0), 0);
//     const overallCount = normalized.length;

//     res.overall = { totalUsd: overallTotalUsd, count: overallCount };

//     return res;
// }
// ...existing code...
