import { generateObject, tool, UIMessageStreamWriter } from "ai";
import z, { success, symbol, unknown } from "zod";
import { TokenMetadata } from "../interfaces/solana/token-metadata";
import { TokenCreatorHistory } from "../interfaces/solana/token-creator";
import { SimilarTokens } from "../interfaces/solana/token-similar-coins";
import { TokenVolumeData } from "../interfaces/solana/token-volume";
import { TokenHolderInfo } from "../interfaces/solana/token-holders";
import { getAddressInfo } from "./rpc";
import {
	MetaplexTokenMetadataProvider,
	TokenHoldersRpcProvider,
} from "../providers/rpc-provider";
import {
	CoinHoldersService,
	CreatorHistoryService,
	MetadataService,
	SimilarCoinsService,
	TokenVolumeService,
} from "../services/onchain.service";
import {
	CreatedTokenBySoltraker,
	MetadataBySoltracker,
	SearchTokenBySoltracker,
	TokenVolumeBySoltraker,
} from "../providers/solanatracker-provider";
import Twitter, {
	analyzeSentiments,
	cleanXresults,
	getAccounts,
	getVoumeMatrix,
	SocialAnalysisResult,
	Tweet,
	TweetAuthor,
} from "../services/x.service";
import { google } from "@ai-sdk/google";
import redisClient from "../config/redis";
import {
	DeployerTokensResponse,
	PoolInfo,
	SearchResponse,
	SearchResult,
	TokenDetailResponse,
} from "@solana-tracker/data-api";
import { token } from "morgan";

interface StepsWrapper<T> {
	status: "loading" | "completed" | "error";
	error?: any;
	score: number;
	max_score: number;
	reason?: string;
	data: T;
}
//  current tool call for visualisation
interface TokenAnalysisAgent {
	ca: string;
	status: "complete" | "partial" | "error";
	error?: any;
	cache: boolean;
	metadata: StepsWrapper<TokenMetadata>;
	creator?: StepsWrapper<TokenCreatorHistory>;
	similar_coins?: StepsWrapper<SimilarTokens>;
	// volume?: StepsWrapper<TokenVolumeData>;
	holders?: StepsWrapper<TokenHolderInfo>;
	// social?: {};
	rating: number;
	category: string;
	summary?: any;
}
interface TokenToolWriterState {}
interface AnalysisStep {
	name: string;
	status: "loading" | "completed" | "success" | "error";
	message: string;
	data?: any;
	error?: string;
}

// Store accumulated steps data
const analysisSteps: Map<string, AnalysisStep[]> = new Map();

const writeStatus = (
	writer: UIMessageStreamWriter,
	toolCallId: string,
	statusName: string,
	status: "loading" | "completed" | "success" | "error",
	statusMessage: string,
	res?: any,
	error?: string
) => {
	// Get or initialize steps for this tool call
	if (!analysisSteps.has(toolCallId)) {
		analysisSteps.set(toolCallId, []);
	}

	const steps = analysisSteps.get(toolCallId)!;

	// Find if this step already exists
	const existingStepIndex = steps.findIndex((s) => s.name === statusName);

	const currentStep: AnalysisStep = {
		name: statusName,
		status,
		message: statusMessage,
		...(res && { data: res }),
		...(error && { error }),
	};

	// Update or add the step
	if (existingStepIndex >= 0) {
		steps[existingStepIndex] = currentStep;
	} else {
		steps.push(currentStep);
	}

	// Write all accumulated data
	writer.write({
		type: "data-token-tool",
		id: toolCallId,
		//transient:true,
		data: {
			current_step: statusName,
			current_status: status,
			current_message: statusMessage,
			all_steps: steps,
			completed_steps: steps.filter(
				(s) => s.status === "completed" || s.status === "success"
			),
			error_steps: steps.filter((s) => s.status === "error"),
			...(res && { current_data: res }),
			...(error && { current_error: error }),
		},
	});
};

// Clean up when analysis is complete
const cleanupAnalysisSteps = (toolCallId: string) => {
	analysisSteps.delete(toolCallId);
};

export const tokenAnalyzerTool = (writer: UIMessageStreamWriter) => {
	return tool({
		description: "Comprehensive token analysis with step-by-step evaluation",
		inputSchema: z.object({
			address: z.string().describe("Token contract address to analyze"),
		}),
		async execute({ address }, { toolCallId }) {
			console.log("ADDRESS 👝", address);
			try {
				// Step 1: Address Verification
				let final_creator_history;
				let similar_coins;
				let holders_analysis;
				let volume_analysis: any;
				let social_analysis;
				writeStatus(
					writer,
					toolCallId,
					"address_verify",
					"loading",
					"Verifying address"
				);

				const addressInfo = await getAddressInfo(address);

				console.log(
					JSON.stringify({ step: "addressInfo", data: addressInfo }, null, 2)
				);

				if (!addressInfo.isValid || addressInfo.type !== "tokenMint") {
					writeStatus(
						writer,
						toolCallId,
						"address_verify",
						"error",
						"Invalid address",
						null,
						"Address verification failed"
					);
					// cleanup
					return { success: false, message: "Address verification failed" };
				}

				writeStatus(
					writer,
					toolCallId,
					"address_verify",
					"completed",
					"Address verified",
					addressInfo
				);

				// Step 2: Cache Check
				writeStatus(
					writer,
					toolCallId,
					"checking_cache",
					"loading",
					"Checking cache"
				);

				const cacheKey = `token-analysis:${address}`;

				let cacheResult: any = null;
				try {
					// Ensure redis client is connected
					// if (redisClient && !redisClient.isOpen) {
					// 	await redisClient.connect();
					// }

					const cached = await redisClient.get(cacheKey);
					if (cached) {
						cacheResult = JSON.parse(cached);
					}
				} catch (err: any) {
					console.warn("Redis cache check failed:", err?.message || err);
					cacheResult = null;
				}

				writeStatus(
					writer,
					toolCallId,
					"checking_cache",
					"completed",
					cacheResult ? "Cache hit" : "Cache miss, fetching fresh data",
					{ cacheHit: !!cacheResult }
				);

				// If we have cached data, return it immediately
				if (cacheResult) {
					return cacheResult;
				}

				// Step 3: Metadata
				writeStatus(
					writer,
					toolCallId,
					"metadata",
					"loading",
					"Fetching token metadata"
				);

				const tokenMetadata = new MetadataService();

				tokenMetadata.registerProvider(new MetadataBySoltracker());
				const metadata = (await tokenMetadata.getTokenInfo(
					address
				)) as TokenDetailResponse;
				console.log(
					JSON.stringify({ step: "metadata", data: metadata }, null, 2)
				);
				const tokenInfo = metadata.token;
				const tokenPools = metadata.pools;

				if (!metadata) {
					writeStatus(
						writer,
						toolCallId,
						"metadata",
						"error",
						"Metadata not found",
						null,
						"Failed to fetch metadata"
					);
					return { success: false, message: "Metadata not found" };
				}

				writeStatus(
					writer,
					toolCallId,
					"metadata",
					"completed",
					"Metadata fetched successfully",
					{ tokenInfo, tokenPools }
				);

				writeStatus(
					writer,
					toolCallId,
					"creator_info",
					"loading",
					"Analyzing creator history"
				);

				await new Promise((resolve) => setTimeout(resolve, 3000));
				try {
					const tokenCreator = new CreatorHistoryService();
					tokenCreator.registerProvider(new CreatedTokenBySoltraker());
					const creatorHistory = (await tokenCreator.getTokenHistory(
						address
					)) as DeployerTokensResponse;
					final_creator_history = creatorHistory;
					console.log("final_creator_history", final_creator_history);
					console.log(
						JSON.stringify(
							{ step: "creatorHistory", data: creatorHistory },
							null,
							2
						)
					);
					writeStatus(
						writer,
						toolCallId,
						"creator_info",
						"completed",
						"Creator analysis complete",
						creatorHistory
					);
				} catch (error: any) {
					writeStatus(
						writer,
						toolCallId,
						"creator_info",
						"error",
						"Creator analysis failed",
						null,
						error.message
					);
					return { success: false, message: "unable to fetch crator history" };
				}

				writeStatus(
					writer,
					toolCallId,
					"similar_coins",
					"loading",
					"Finding similar tokens"
				);

				await new Promise((resolve) => setTimeout(resolve, 2000));
				try {
					const similarCoins = new SimilarCoinsService();
					similarCoins.registerProvider(new SearchTokenBySoltracker());
					// need to limit thing as it send lots of data here
					const similarCoinsList = (await similarCoins.getSimilarCoins(
						address,
						metadata.token.name
					)) as SearchResponse;
					similar_coins = similarCoinsList.data;
					console.log("similar_coins", similar_coins);
					console.log(
						JSON.stringify(
							{ step: "similarCoinsList", data: similarCoinsList },
							null,
							2
						)
					);
					writeStatus(
						writer,
						toolCallId,
						"similar_coins",
						"completed",
						"Similar tokens found",
						similarCoinsList
					);
				} catch (error: any) {
					writeStatus(
						writer,
						toolCallId,
						"similar_coins",
						"error",
						"Similar tokens analysis failed",
						null,
						error.message
					);
					return { success: false, message: "Similar tokens analysis failed" };
				}

				writeStatus(
					writer,
					toolCallId,
					"holders_analysis",
					"loading",
					"Analyzing token holders"
				);

				try {
					const holdersService = new CoinHoldersService();
					holdersService.registerProvider(new TokenHoldersRpcProvider());
					const holders = await holdersService.getHoldersInfo(address);
					const top10Holders = holders.top10;
					// need to integrate bubble map !important
					const totalHolders = holders.count;

					holders_analysis = holders;
					console.log("holders_analysis", holders_analysis);
					console.log(
						JSON.stringify({ step: "holders", data: holders_analysis }, null, 2)
					);
					writeStatus(
						writer,
						toolCallId,
						"holders_analysis",
						"completed",
						"Holders analysis complete",
						holders
					);
				} catch (error: any) {
					writeStatus(
						writer,
						toolCallId,
						"holders_analysis",
						"error",
						"Holders analysis failed",
						null,
						error.message
					);
					return { success: false, message: "Holders analysis failed" };
				}
				writeStatus(
					writer,
					toolCallId,
					"volume_analysis",
					"loading",
					"Analyzing token volume"
				);

				await new Promise((resolve) => setTimeout(resolve, 3000));
				try {
					const volumeService = new TokenVolumeService();
					volumeService.registerProvider(new TokenVolumeBySoltraker());
					const volume = await volumeService.getVolumeAnalysis(address);
					volume_analysis = volume;
					console.log("volume_analysis", volume);
					console.log(
						JSON.stringify({ step: "volume", data: volume_analysis }, null, 2)
					);
					writeStatus(
						writer,
						toolCallId,
						"volume_analysis",
						"completed",
						"Volume analysis complete",
						volume_analysis
					);
				} catch (error: any) {
					writeStatus(
						writer,
						toolCallId,
						"volume_analysis",
						"error",
						"Volume analysis failed",
						null,
						error.message
					);
					return { success: false, message: "Volume analysis failed" };
				}

				writeStatus(
					writer,
					toolCallId,
					"Social_analysis",
					"loading",
					"Analyzing token social sentiment"
				);
				// charts
				// overall sentiments
				//

				// ui
				// posts over time
				// with volume state

				// sentments
				// account
				try {
					const socialService = new Twitter(
						process.env.TWITTER_API_KEY as string
					);

					const topPosts = await socialService.getTopTweets(address);
					console.log(
						JSON.stringify(
							{
								step: "topPosts",
								count: topPosts.length,
								sample: topPosts.slice(0, 3),
							},
							null,
							2
						)
					);

					//=> sentiments maybe pie chart

					// =>top posts ++
					// if account with score found then rank based on that or just views and interactions

					// const accounts = getAccounts(topPosts);

					const { posts, accounts } = cleanXresults(topPosts);
					console.log(
						JSON.stringify(
							{
								step: "cleanedSocial",
								postsCount: posts.length,
								accountsCount: accounts.length,
							},
							null,
							2
						)
					);
					console.log(
						`Found ${accounts.length} important accounts from ${topPosts.length} tweets`
					);
					const topPostSentiments = await analyzeSentiments(posts);
					console.log(
						JSON.stringify(
							{
								step: "topPostSentiments",
								data: topPostSentiments.slice(0, 10),
							},
							null,
							2
						)
					);

					// const latestPosts = await socialService.getTweetsByQuery(
					// 	address,
					// 	100
					// );

					// // Calculate volume metrics
					const volumeMetrics = getVoumeMatrix(topPosts);

					const sentimentCounts = topPostSentiments.reduce(
						(acc, result) => {
							const weight = result.engagement_score * result.confidence;
							acc.total_weight += weight;

							if (result.sentiment === "positive") {
								acc.positive += weight;
							} else if (result.sentiment === "negative") {
								acc.negative += weight;
							} else {
								acc.neutral += weight;
							}
							return acc;
						},
						{ positive: 0, negative: 0, neutral: 0, total_weight: 0 }
					);

					// Normalize percentages
					const totalWeight = sentimentCounts.total_weight || 1;
					const overall_sentiment = {
						positive: (sentimentCounts.positive / totalWeight) * 100,
						negative: (sentimentCounts.negative / totalWeight) * 100,
						neutral: (sentimentCounts.neutral / totalWeight) * 100,
						weighted_score:
							(sentimentCounts.positive - sentimentCounts.negative) /
							totalWeight,
					};

					// Calculate key metrics
					const totalReach = accounts.reduce(
						(sum, account) => sum + account.followersCount,
						0
					);
					const totalEngagement = topPosts.reduce(
						(sum, tweet) =>
							sum + tweet.likeCount + tweet.retweetCount + tweet.replyCount,
						0
					);
					const engagementRate =
						totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
					const viralPotential = Math.min(
						(volumeMetrics.trending_score *
							overall_sentiment.weighted_score *
							engagementRate) /
							10,
						100
					);

					const analysisResult: SocialAnalysisResult = {
						overall_sentiment,
						volume_metrics: volumeMetrics,
						// top_influencers: accounts.slice(0, 10), // Top 10 influencers
						sentiment_breakdown: topPostSentiments,
						key_metrics: {
							total_reach: totalReach,
							engagement_rate: engagementRate,
							viral_potential: Math.max(viralPotential, 0),
						},
					};
					social_analysis = analysisResult;
					console.log(
						"social_analysis",
						JSON.stringify(social_analysis, null, 2)
					);
					writeStatus(
						writer,
						toolCallId,
						"Social_analysis",
						"completed",
						"Social analysis complete",
						social_analysis
					);
				} catch (error: any) {
					writeStatus(
						writer,
						toolCallId,
						"social_analysis",
						"error",
						"Social analysis failed",
						null,
						error.message
					);
				}

				//onchain-> brief metadata {name,ticker,desc,img }also creatory token count

				// social->human understandable summary for total volume and

				// const [onChainReview, soicalReview] = await Promise.all([
				// 	// metadata,holder,similartokens,volume
				// 	// metdata->category maybe websearch,
				// 	// creator->not much weight but if it has lots of coin and low mcap slighty risky maybe in near future user profile wallet history
				// 	// simiar coins->is it derivative gimic it will give name,desc,ticker iwth image !imp mcap larger than this(with no freeze aur mint authority with volume)
				// 	// holders ->its just hardcoded good if we can fer yser pnl
				// 	// volume ->just to get activity
				// 	//  MAIN FOCUS IS TO GIVE SCORE

				// 	generateObject({
				// 		model: "",
				// 		system: "",
				// 		schema: z.object({}),
				// 		// CATEOGRY,SOCRE,STATUS->GOOD,UNCERTAIN,DEAD,RUG,REASON FOR STATUS
				// 		prompt: "",
				// 	}),

				// 	// volume ->show chart
				// 	// accounts->nothing new

				// 	generateObject({
				// 		model: "",
				// 		system: "",
				// 		schema: z.object({}),
				// 		prompt: "",
				// 	}),
				// ]);
				const complied = {
					matadata: {
						name: metadata.token.image,
						createdOn: metadata.token.createdOn,
						symbol: metadata.token.symbol,
						description: metadata.token.description,
						image: metadata.token.image,
						social: metadata.token.strictSocials,
					},
					holders: metadata.holders,

					market: {
						pools: metadata.pools.map((pool) => pool),
					},
					creator: creatorSummary(final_creator_history),
					similarToken: simiarTokensSummary(similar_coins, metadata.pools),
					volume: {
						txn: metadata.txns,
						buys: metadata.buys,
						sells: metadata.sells,
						volume_analysis,
					},
					social: social_analysis,
				};
				// function socialSummary() {
				// const topPosts=	social_analysis
				// 	totalPosts, semtiments, topPosts, volumeSlope;
				// }

				function volumeSummary() {}
				function creatorSummary(creatorTokens: DeployerTokensResponse) {
					if (!creatorTokens.tokens) {
						return {
							totalTokens: 0,
							deadTokens: 0,
						};
					}
					let tokens = creatorTokens.tokens.filter(
						(token) => token.liquidityUsd < 10000
					);
					console.log(tokens, "tokens");
					return {
						totalTokens: creatorTokens.total,
						deadTokens: tokens,
					};
				}
				function simiarTokensSummary(
					similarCoins: SearchResult[] = [],
					currPool: PoolInfo[] = []
				) {
					// Defensive defaults
					if (!Array.isArray(similarCoins) || similarCoins.length === 0) {
						return {
							totalTokens: 0,
							sameNameCount: 0,
							sameTickerCount: 0,
							sameDescription: 0,
							largerMcapCount: 0,
							details: {},
						};
					}

					const totalTokens = similarCoins.length;

					// Frequency maps for name and symbol
					const nameFreq = new Map<string, number>();
					const symbolFreq = new Map<string, number>();

					// Helper to safely extract numeric market cap / liquidity
					const toNumber = (v: any) => {
						if (v == null) return NaN;
						if (typeof v === "number") return v;
						const n = parseFloat(String(v).replace(/[^0-9.\-eE]/g, ""));
						return Number.isFinite(n) ? n : NaN;
					};

					// Determine current pool reference liquidity (use max liquidity if available)
					let currMaxPoolLiquidity = 0;
					for (const p of currPool || []) {
						const maybe = toNumber(
							(p as any).liquidityUsd ??
								(p as any).liquidity ??
								(p as any).liquidity_usd
						);
						if (!Number.isNaN(maybe) && maybe > currMaxPoolLiquidity)
							currMaxPoolLiquidity = maybe;
					}

					// Build maps and normalized description tokens
					const descTokens: string[][] = [];
					for (const coin of similarCoins) {
						const name = (coin.name || "").trim().toLowerCase();
						const sym = (coin.symbol || "").trim().toLowerCase();
						nameFreq.set(name, (nameFreq.get(name) || 0) + 1);
						symbolFreq.set(sym, (symbolFreq.get(sym) || 0) + 1);
					}

					// Count same name / ticker occurrences (count tokens that are in groups >1)
					let sameNameCount = 0;
					for (const [n, c] of nameFreq.entries()) {
						if (!n) continue;
						if (c > 1) sameNameCount += c;
					}

					let sameTickerCount = 0;
					for (const [s, c] of symbolFreq.entries()) {
						if (!s) continue;
						if (c > 1) sameTickerCount += c;
					}

					// Description similarity: simple pairwise Jaccard on token sets
					const jaccard = (a: string[], b: string[]) => {
						if (!a.length || !b.length) return 0;
						const sa = new Set(a);
						const sb = new Set(b);
						let inter = 0;
						for (const v of sa) if (sb.has(v)) inter++;
						const uni = new Set([...sa, ...sb]).size;
						return uni === 0 ? 0 : inter / uni;
					};

					let sameDescription = 0;
					// Count number of coins that have at least one other coin with high description overlap
					for (let i = 0; i < descTokens.length; i++) {
						const a = descTokens[i];
						for (let j = i + 1; j < descTokens.length; j++) {
							const b = descTokens[j];
							const score = jaccard(a, b);
							// threshold: 0.5 to consider descriptions similar
							if (score >= 0.5) {
								sameDescription += 2; // count both coins
							}
						}
					}

					// Count tokens with market cap larger than current pool liquidity
					let largerMcapCount = 0;
					const largerMcapList: Array<{
						address?: string;
						name?: string;
						marketCap?: number;
					}> = [];

					for (const coin of similarCoins) {
						// Attempt to read common market cap fields
						const marketCap = toNumber(
							(coin as any).marketCapUsd ??
								(coin as any).market_cap_usd ??
								(coin as any).market_cap ??
								(coin as any).mcap ??
								(coin as any).marketCap
						);
						if (
							!Number.isNaN(marketCap) &&
							currMaxPoolLiquidity > 0 &&
							marketCap > currMaxPoolLiquidity
						) {
							largerMcapCount++;
							largerMcapList.push({
								address: (coin as any).address,
								name: coin.name,
								marketCap,
							});
						}
					}

					// sort larger list descending by marketCap
					largerMcapList.sort(
						(a, b) => (b.marketCap || 0) - (a.marketCap || 0)
					);

					return {
						totalTokens,
						sameNameCount,
						sameTickerCount,
						sameDescription,
						// for larger mcap than currpoll
						largerMcapCount,
						details: {
							currMaxPoolLiquidity,
							topLargerMcap: largerMcapList.slice(0, 5),
							nameFrequency: Array.from(nameFreq.entries()).filter(
								([_, c]) => c > 1
							),
							tickerFrequency: Array.from(symbolFreq.entries()).filter(
								([_, c]) => c > 1
							),
						},
					};
				}
				console.log("complied", JSON.stringify(complied, null, 2));
				// Build a structured schema and prompt for the model to analyze the compiled object
				const normalSchema = z.object({
					// category examples: meme, ai, tool, derivative, trend, celebrity, stable, unknown
					category: z.string(),
					// score 0-100 (percentage like)
					score: z.number().min(0).max(100),
					// status: good, dead, rug, uncertain, unknown
					status: z.enum(["good", "dead", "rug", "uncertain", "unknown"]),
					// short reason for the decision
					reason: z.string().optional(),
					// confidence between 0 and 1
					confidence: z.number().min(0).max(1).optional(),
					// optional tags for UI
					tags: z.array(z.string()).optional(),
				});

				const prompt = `You are given a compiled token analysis object (JSON) containing metadata, market pools, creator info, similarToken summary, volume, social sentiment, and holder statistics. Analyze this object and return a JSON matching the schema: { category, score, status, reason, confidence, tags }.

Rules to follow when deciding values:
- category: best single label from (meme, ai, tool, derivative, trend, celebrity, stable, unknown). Choose the category that matches the token's name, description, image, or other cues in the compiled object.
- score: number from 0 to 100 (higher is better). Weight positive signals (increasing recent volume, positive weighted social sentiment, active buys vs sells, healthy liquidity, diverse holders) positively. Penalize signs of risk (very concentrated top holders, low or falling volume, negative sentiment, weak liquidity).
- status: one of:
	* good — increasing volume, positive social sentiment, active buys, and reasonable liquidity/holders distribution.
	* dead — near-zero volume and near-zero social activity.
	* rug — indicators of risk: similar tokens with high liquidity but little social activity, extremely concentrated top holders (top10 > ~50%), or other strong red flags.
	* uncertain — mixed signals (for example, high social volume but high top-holder concentration or conflicting sentiment/volume signals).
	* unknown — insufficient data.

Specific heuristics to apply (use them as guidance, but state your evidence in the 'reason' field):
- If total recent volume (from compiled.volume or volume_analysis) is near zero and social posts/tweets ~0, mark as 'dead' (score < 10).
- If similarToken summary shows multiple tokens with significantly larger market caps than current pool liquidity AND social activity is low, or top holder concentration is very high (top10 holders share >50%), mark as 'rug' (score low, e.g., 0-30).
- If social weighted sentiment is strongly positive and volume metrics show sustained or increasing buys/volume, mark as 'good' with higher score (60-100).
- If social volume is high but holders concentration is high or liquidity is low, mark as 'uncertain'.

Return a concise 'reason' detailing the main signals used and an optional numeric 'confidence' (0-1).

Now analyze the following compiled object (JSON):\n\n${JSON.stringify(
					complied,
					null,
					2
				)}\n\nRespond only with the JSON object that matches the schema.`;

				const normal = await generateObject({
					model: google("gemini-2.5-flash-lite"),
					system: "",
					schema: normalSchema,
					prompt,
				});

				console.log(
					JSON.stringify({ step: "normalGenerated", data: normal }, null, 2)
				);

				// if not in cache then save if
				const responseToCache = {
					success: true,
					result: {
						address,
						addressInfo,
						tokenInfo,
						tokenPools,
						final_creator_history,
						similar_coins,
						holders_analysis,
						volume_analysis,
						social_analysis,
						normal: normal.object, // correct
					},
				};

				// // Attempt to cache the result (best-effort)
				// try {
				// 	const ttl = parseInt(
				// 		process.env.TOKEN_ANALYSIS_CACHE_TTL || "3600",
				// 		10
				// 	);
				// 	if (redisClient && !(redisClient as any).isOpen) {
				// 		await redisClient.connect();
				// 	}
				// 	await redisClient.set(cacheKey, JSON.stringify(responseToCache), {
				// 		EX: ttl,
				// 	});
				// } catch (err: any) {
				// 	console.warn("Redis cache set failed:", err?.message || err);
				// }
				// assume redisClient.connect() done at startup
				try {
					if (redisClient.isOpen) {
						// serialize in a microtask to avoid blocking main flow if huge (or offload)
						const payload = JSON.stringify(responseToCache);
						await redisClient.setEx(cacheKey, 3600, payload);
					} else {
						console.log("Redis not open, skipping cache set");
					}
				} catch (err: any) {
					console.warn("Redis cache set failed:", err?.message || err);
				}

				return {
					success: true,
					result: {
						address: responseToCache.result.address,
						info: {
							metadata: responseToCache.result.tokenInfo,
						},
						analysed: normal.object,
					},
				};
			} catch (error: any) {
				writeStatus(
					writer,
					toolCallId,
					"global_error",
					"error",
					"Analysis failed",
					null,
					error.message
				);
				console.log(error);
				cleanupAnalysisSteps(toolCallId);

				return {
					success: false,
					message: `Analysis failed: ${error.message}`,
				};
			}
		},
	});
};

// Individual analysis tools
export const basicInfoTool = (writer: UIMessageStreamWriter) => {
	return tool({
		description: "Get basic token information (PF/Metaplex detection)",
		inputSchema: z.object({ address: z.string() }),
		async execute({ address }, { toolCallId }) {
			const { result, score } = await getBasicInfo(address);
			writer.write({
				type: "data-tool",
				id: toolCallId,
				data: { step: "basicInfo", status: "complete", data: result, score },
			});
			return result;
		},
	});
};

export const socialAnalysisTool = (writer: UIMessageStreamWriter) => {
	return tool({
		description: "Analyze token social presence only",
		inputSchema: z.object({ address: z.string() }),
		async execute({ address }, { toolCallId }) {
			const { result, score } = await getSocialAnalysis(address);
			writer.write({
				type: "data-tool",
				id: toolCallId,
				data: { step: "social", status: "complete", data: result, score },
			});
			return result;
		},
	});
};

// Types
interface AnalysisState {
	score: number;
	maxScore: number;
	steps: Array<{ step: string; score: number; maxScore: number }>;
	stopReason: string | null;
	tokenInfo: any;
	riskLevel: string;
	category: string;
}

// Implementation functions
async function getBasicInfo(address: string) {
	// Simulate API call delay
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// Mock detection logic
	const isPumpFun = Math.random() > 0.5;
	const hasMetaplex = Math.random() > 0.3;

	const result = {
		address,
		name: `Token ${address.slice(0, 6)}`,
		symbol: `TKN${address.slice(-3).toUpperCase()}`,
		isPumpFun,
		hasMetaplex,
		creator: isPumpFun
			? `creator_${Math.random().toString(36).slice(2, 8)}`
			: null,
		mintAuthority: hasMetaplex ? address : null,
		freezeAuthority: hasMetaplex
			? Math.random() > 0.5
				? address
				: null
			: null,
		imageUrl:
			Math.random() > 0.3
				? `https://example.com/token-${address.slice(-4)}.png`
				: null,
		supply: Math.floor(Math.random() * 1000000000),
		decimals: 6,
	};

	const score = isPumpFun ? 2 : hasMetaplex ? 1.5 : 1;

	return { result, score };
}

async function analyzeImage(imageUrl: string) {
	await new Promise((resolve) => setTimeout(resolve, 800));

	const qualities = ["high", "medium", "low"];
	const quality = qualities[Math.floor(Math.random() * qualities.length)];

	const result = {
		imageUrl,
		quality,
		hasText: Math.random() > 0.5,
		isOriginal: Math.random() > 0.3,
		appropriateContent: Math.random() > 0.1,
	};

	const score =
		quality === "high" && result.isOriginal && result.appropriateContent
			? 1
			: 0.5;

	return { result, score };
}

async function getSocialAnalysis(address: string) {
	await new Promise((resolve) => setTimeout(resolve, 1800));

	const platforms = ["twitter", "telegram", "discord"].filter(
		() => Math.random() > 0.3
	);
	const totalMentions = Math.floor(Math.random() * 1000);

	const result = {
		platforms,
		totalMentions,
		sentiment: ["positive", "neutral", "negative"][
			Math.floor(Math.random() * 3)
		],
		influencerMentions: Math.floor(totalMentions * 0.1),
		trendingScore: Math.floor(Math.random() * 100),
	};

	const score =
		totalMentions > 100 && result.sentiment === "positive"
			? 2
			: totalMentions > 20
			? 1
			: 0.5;

	return { result, score };
}

async function getFinalAnalysis(
	tokenInfo: any,
	score: number,
	maxScore: number
) {
	await new Promise((resolve) => setTimeout(resolve, 800));

	const percentage = (score / maxScore) * 100;

	let category = "unknown";
	let riskLevel = "high";

	if (percentage >= 80) {
		category = "blue-chip";
		riskLevel = "low";
	} else if (percentage >= 60) {
		category = "established";
		riskLevel = "medium";
	} else if (percentage >= 40) {
		category = "emerging";
		riskLevel = "medium-high";
	} else {
		category = "speculative";
		riskLevel = "high";
	}

	return {
		category,
		riskLevel,
		percentage: Math.round(percentage),
		summary: `Token analysis complete. Scored ${score}/${maxScore} points (${Math.round(
			percentage
		)}%). Classified as ${category} with ${riskLevel} risk level.`,
		recommendations: [
			percentage > 70
				? "Consider for portfolio allocation"
				: "Requires careful consideration",
			tokenInfo.volume?.isActive
				? "Good liquidity available"
				: "Limited liquidity",
			tokenInfo.social?.sentiment === "positive"
				? "Positive community sentiment"
				: "Monitor social sentiment",
		],
	};
}
