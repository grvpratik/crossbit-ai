import { Router, Request, Response } from "express";
import redisClient from "../config/redis";
import { NotFoundError } from "../middleware/errorHandler";
import { asyncHandler } from "../middleware/auth";

const router: Router = Router();

// Helper: try common keys for token data
const getTokenFromRedis = async (address: string) => {
	const keysToTry = [
		`token-analysis:${address}`,
		`token:${address}`,
		`token-meta:${address}`,
	];
	for (const k of keysToTry) {
		try {
			const raw = await redisClient.get(k);
			if (raw) {
				try {
					return JSON.parse(raw);
				} catch (_e) {
					// Return raw string if not JSON
					return raw as any;
				}
			}
		} catch (err) {
			// ignore and try next
			console.warn(
				`Redis get failed for key ${k}:`,
				(err as any)?.message || err
			);
		}
	}
	return null;
};

router.post("/token/:ca", async (req: Request, res: Response) => {
	try {
		const { ca: address } = req.params;

		if (!address) {
			return res.status(400).json({ error: "Missing token address" });
		}

		// ensure redis connected
		if (!redisClient.isOpen) {
			try {
				await redisClient.connect();
			} catch (err) {
				console.warn("Redis connect failed:", (err as any)?.message || err);
			}
		}

		// primary token payload (tries several keys)
		const data = await getTokenFromRedis(address);

		// extra optional keys
		// let price: any = null;
		// let chart: any = null;
		// try {
		// 	const rawPrice = await redisClient.get(`price:${address}`);
		// 	if (rawPrice) {
		// 		try {
		// 			price = JSON.parse(rawPrice);
		// 		} catch {
		// 			price = rawPrice;
		// 		}
		// 	}
		// } catch (err) {
		// 	console.warn("Redis get price failed:", (err as any)?.message || err);
		// }

		// try {
		// 	const rawChart = await redisClient.get(`chart:${address}`);
		// 	if (rawChart) {
		// 		try {
		// 			chart = JSON.parse(rawChart);
		// 		} catch {
		// 			chart = rawChart;
		// 		}
		// 	}
		// } catch (err) {
		// 	console.warn("Redis get chart failed:", (err as any)?.message || err);
		// }

		// if (!data && !price && !chart) {
		// 	return res.status(404).json({ error: "Token not found in cache" });
		// }
if(!data){
	return res.status(404).json({
		success: false,
		error: { message: "report not found", code: "NOT_FOUND" },
	});
}
		return res.status(200).json({ success: true, result: data });
	} catch (error) {
		console.error("Error in /token/:ca route:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/tokens", async (req: Request, res: Response) => {
	try {
		// Supported filters: views, latest, marketcap, volume
		const { filter = "latest", sort = "desc", limit = 50 } = req.body || {};
		const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

		const indexMap: Record<string, string> = {
			views: "tokens:by:views",
			latest: "tokens:by:created",
			marketcap: "tokens:by:marketcap",
			volume: "tokens:by:volume",
		};

		const indexKey = indexMap[filter] || indexMap.latest;

		if (!redisClient.isOpen) {
			try {
				await redisClient.connect();
			} catch (err) {
				console.warn("Redis connect failed:", (err as any)?.message || err);
			}
		}

		// If there is a sorted set for this filter, use it (returns members with scores).
		const exists = await redisClient.exists(indexKey);
		const tokens: any[] = [];

		if (exists && exists > 0) {
			// zRangeWithScores / zRevRangeWithScores provide { value, score }
			let items: Array<{ value: string; score: number } | string> = [] as any;
			try {
				if (sort === "desc" && (redisClient as any).zRevRangeWithScores) {
					items = await (redisClient as any).zRevRangeWithScores(
						indexKey,
						0,
						safeLimit - 1
					);
				} else if ((redisClient as any).zRangeWithScores) {
					items = await (redisClient as any).zRangeWithScores(
						indexKey,
						0,
						safeLimit - 1
					);
					if (sort === "desc") items = items.reverse();
				} else if ((redisClient as any).zRange) {
					// use zRange / zRevRange if available
					items =
						sort === "desc"
							? await (redisClient as any).zRevRange(indexKey, 0, safeLimit - 1)
							: await (redisClient as any).zRange(indexKey, 0, safeLimit - 1);
				} else {
					// last resort: get members by scanning keys
					items = [] as any;
				}
			} catch (err) {
				console.warn("Redis zrange failed:", (err as any)?.message || err);
				items = [] as any;
			}

			for (const it of items as any[]) {
				let address: string;
				let score: number | null = null;
				if (typeof it === "string") {
					address = it;
				} else {
					address = it.value ?? it[0] ?? "";
					score = Number(it.score ?? it[1] ?? null) || null;
				}

				if (!address) continue;
				const data = await getTokenFromRedis(address);
				tokens.push({ address, score, data });
			}
		} else {
			// fallback: scan token-analysis:* keys
			const pattern = "token-analysis:*";
			let count = 0;
			for await (const key of redisClient.scanIterator({ MATCH: pattern })) {
				if (count >= safeLimit) break;
				const address = String(key).replace("token-analysis:", "");
				const data = await getTokenFromRedis(address);
				tokens.push({ address, data });
				count += 1;
			}
			// If sort requested but we only have unsorted data, try to sort by created / name if present
			if (sort && tokens.length > 1) {
				tokens.sort((a, b) => {
					// try numeric score first
					const aScore = a.score ?? a.data?.views ?? 0;
					const bScore = b.score ?? b.data?.views ?? 0;
					if (aScore !== bScore)
						return sort === "asc" ? aScore - bScore : bScore - aScore;
					const aName = (a.data?.metadata?.name || a.data?.name || "")
						.toString()
						.toLowerCase();
					const bName = (b.data?.metadata?.name || b.data?.name || "")
						.toString()
						.toLowerCase();
					return aName.localeCompare(bName) * (sort === "asc" ? 1 : -1);
				});
			}
		}

		return res
			.status(200)
			.json({ filter, sort, limit: safeLimit, results: tokens });
	} catch (error) {
		console.error("Error in /tokens route:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
