import { z } from "zod";
import { generateObject } from "ai";

import axios, { AxiosError } from "axios";
import { google } from "@ai-sdk/google";

export interface Tweet {
	type: "tweet";
	id: string;
	url: string;
	text: string;
	source: string;
	retweetCount: number;
	replyCount: number;
	likeCount: number;
	quoteCount: number;
	viewCount: number;
	createdAt: string; // e.g., "Tue Dec 10 07:00:30 +0000 2024"
	lang?: string; // may be empty
	bookmarkCount: number;
	isReply: boolean;
	inReplyToId?: string;
	conversationId?: string;
	inReplyToUserId?: string;
	inReplyToUsername?: string;
	author: TweetAuthor;
	entities: TweetEntities;
	quoted_tweet?: Tweet | null;
	retweeted_tweet?: Tweet | null;
}

export interface TweetAuthor {
	id: string;
	name: string;
	username: string;
	profileImageUrl?: string;
	verified?: boolean;
	followersCount?: number;
	followingCount?: number;
	tweetCount?: number;
	listedCount?: number;
}

export interface TweetEntities {
	hashtags?: { text: string; indices: number[] }[];
	urls?: {
		url: string;
		expanded_url: string;
		display_url: string;
		indices: number[];
	}[];
	mentions?: {
		screen_name: string;
		name: string;
		id: string;
		indices: number[];
	}[];
	media?: {
		id: string;
		media_url: string;
		type: string;
		indices: number[];
	}[];
}

export interface TwitterApiResponse {
	tweets: Tweet[];
	has_next_page: boolean;
	next_cursor: string;
}
// Helper functions and types
export interface AccountMetrics {
	id: string;
	username: string;
	name: string;
	followersCount: number;
	verified: boolean;
	influence_score: number;
	isImportant: boolean;
}

export interface SentimentResult {
	tweet_id: string;
	author_id: string;
	sentiment: "positive" | "negative" | "neutral";
	confidence: number;
	text: string;
	engagement_score: number;
}

export interface VolumeMetrics {
	total_posts: number;
	posts_last_hour: number;
	posts_last_24h: number;
	average_engagement: number;
	trending_score: number;
	// breakdown useful for charting
	frames?: FrameMetrics[];
	// totals across the selected window for each engagement type
	totals?: {
		likes: number;
		retweets: number;
		replies: number;
		quotes: number;
		views: number;
	};
	// meta about the computed window
	window_minutes?: number;
	frame_minutes?: number;
}

export interface FrameMetrics {
	start: string; // ISO timestamp
	end: string; // ISO timestamp
	total_posts: number;
	verified_count: number;
	non_verified_count: number;
	likes: number;
	retweets: number;
	replies: number;
	quotes: number;
	views: number;
	engagement_sum: number; // sum of likes+retweets+replies+quotes
	average_engagement: number;
}

export interface SocialAnalysisResult {
	overall_sentiment: {
		positive: number;
		negative: number;
		neutral: number;
		weighted_score: number; // -1 to 1
	};
	volume_metrics: VolumeMetrics;
	top_influencers: AccountMetrics[];
	sentiment_breakdown: SentimentResult[];
	key_metrics: {
		total_reach: number;
		engagement_rate: number;
		viral_potential: number;
	};
}

// Filter important accounts based on followers, verification, and influence

export function getAccounts(tweets: Tweet[]): AccountMetrics[] {
	const uniqueAuthors = new Map<string, TweetAuthor>();

	// Get unique authors
	tweets.forEach((tweet) => {
		if (!uniqueAuthors.has(tweet.author.id)) {
			uniqueAuthors.set(tweet.author.id, tweet.author);
		}
	});

	// remove bot and news acccounts
	// tweets.filter((acc)=>acc.author.id)

	return Array.from(uniqueAuthors.values())
		.map((author) => {
			// Calculate influence score based on multiple factors
			const followersScore =
				Math.log10(Math.max(author.followersCount || 1, 1)) / 8; // Normalize to 0-1
			const verificationBonus = author.verified ? 0.3 : 0;
			const activityScore = Math.min((author.tweetCount || 0) / 10000, 0.2); // Cap at 0.2

			const influence_score = Math.min(
				followersScore + verificationBonus + activityScore,
				1
			);

			// Determine if account is important (you can adjust these thresholds)
			const isImportant =
				author.verified ||
				(author.followersCount || 0) > 1000 ||
				influence_score > 0.4;

			return {
				id: author.id,
				username: author.username,
				name: author.name,
				followersCount: author.followersCount || 0,
				verified: author.verified || false,
				influence_score,
				isImportant,
			};
		})
		.filter((account) => account.isImportant)
		.sort((a, b) => b.influence_score - a.influence_score);
}

// Calculate sentiment using AI model
export async function analyzeSentiments(
	tweets: Tweet[],
	importantAccountIds?: string[]
): Promise<SentimentResult[]> {
	const sentimentPromises = tweets
		// .filter((tweet) => importantAccountIds.includes(tweet.author.id))
		.map(async (tweet) => {
			try {
				// Calculate engagement score
				const engagement_score =
					(tweet.likeCount +
						tweet.retweetCount * 2 +
						tweet.replyCount * 1.5 +
						tweet.quoteCount * 1.8) /
					Math.max(tweet.author.followersCount || 1, 100);

				// Use AI to analyze sentiment
				const sentimentAnalysis = await generateObject({
					model: google("gemini-1.5-flash"),
					prompt: `Analyze the sentiment of this tweet about a cryptocurrency/token: "${tweet.text}". 
          Consider context, sarcasm, and crypto-specific language. 
          Rate sentiment as positive, negative, or neutral with confidence 0-1.`,
					schema: z.object({
						sentiment: z.enum(["positive", "negative", "neutral"]),
						confidence: z.number().min(0).max(1),
					}),
				});

				return {
					tweet_id: tweet.id,
					author_id: tweet.author.id,
					sentiment: sentimentAnalysis.object.sentiment,
					confidence: sentimentAnalysis.object.confidence,
					text: tweet.text,
					engagement_score,
				};
			} catch (error) {
				console.error(
					`Error analyzing sentiment for tweet ${tweet.id}:`,
					error
				);
				return {
					tweet_id: tweet.id,
					author_id: tweet.author.id,
					sentiment: "neutral" as const,
					confidence: 0.5,
					text: tweet.text,
					engagement_score: 0,
				};
			}
		});

	return Promise.all(sentimentPromises);
}

export function cleanXresults(posts: Tweet[], spamIds?: string[]) {
	// spamIds may be provided by caller; if not, default to empty list.
	// keep signature simple and non-throwing if getSpamIds isn't implemented yet.
	const spamSet = new Set<string>(spamIds ?? []);

	// Filter out posts whose author is in the spam list (defensive checks)
	const filtered = posts.filter((p) => {
		const aid = p?.author?.id;
		return !!aid && !spamSet.has(aid);
	});

	// Deduplicate posts per author: keep the newest tweet per author.
	const perAuthor = new Map<string, Tweet>();
	for (const t of filtered) {
		const aid = t.author?.id;
		if (!aid) continue;

		const existing = perAuthor.get(aid);
		if (!existing) {
			perAuthor.set(aid, t);
			continue;
		}

		const td = Date.parse(t.createdAt);
		const ed = Date.parse(existing.createdAt);

		// If parsing failed for either date, prefer the one with a valid date, else keep existing
		if (isNaN(td) && !isNaN(ed)) continue;
		if (!isNaN(td) && isNaN(ed)) {
			perAuthor.set(aid, t);
			continue;
		}

		// If both valid, keep the newest
		if (!isNaN(td) && td > ed) {
			perAuthor.set(aid, t);
		}
		// If same timestamp, prefer the one with longer text (heuristic) to avoid trimming
		else if (!isNaN(td) && td === ed) {
			if ((t.text || "").length > (existing.text || "").length) {
				perAuthor.set(aid, t);
			}
		}
	}

	// Convert to array and sort desc by createdAt for convenience
	const cleanedPosts = Array.from(perAuthor.values()).sort((a, b) => {
		const ad = Date.parse(a.createdAt) || 0;
		const bd = Date.parse(b.createdAt) || 0;
		return bd - ad;
	});

	// Build unique accounts list from remaining posts
	const accountsMap = new Map<string, TweetAuthor>();
	for (const p of cleanedPosts) {
		const author = p.author;
		if (author && author.id && !accountsMap.has(author.id)) {
			accountsMap.set(author.id, author);
		}
	}

	const accounts = Array.from(accountsMap.values())
		.map((author) => {
			// Calculate influence score based on multiple factors
			const followersScore =
				Math.log10(Math.max(author.followersCount || 1, 1)) / 8; // Normalize to 0-1
			const verificationBonus = author.verified ? 0.3 : 0;
			const activityScore = Math.min((author.tweetCount || 0) / 10000, 0.2); // Cap at 0.2

			const influence_score = Math.min(
				followersScore + verificationBonus + activityScore,
				1
			);

			// Determine if account is important (you can adjust these thresholds)
			const isImportant =
				author.verified ||
				(author.followersCount || 0) > 1000 ||
				influence_score > 0.4;

			return {
				id: author.id,
				username: author.username,
				name: author.name,
				followersCount: author.followersCount || 0,
				verified: author.verified || false,
				influence_score,
				isImportant,
			};
		})
		.filter((account) => account.isImportant)
		.sort((a, b) => b.influence_score - a.influence_score);

	return { posts: cleanedPosts, accounts };
}

// Calculate recent volume and engagement metrics
export function getVoumeMatrix(
	tweets: Tweet[],
	frameMinutes: number = 5,
	windowMinutes: number = 60
): VolumeMetrics {
	const now = new Date();
	const windowMs = windowMinutes * 60 * 1000;
	const frameMs = Math.max(1, frameMinutes) * 60 * 1000;
	const windowStart = new Date(now.getTime() - windowMs);

	// Filter tweets inside the full window (robust when less data available)
	const windowTweets = tweets.filter((t) => {
		const d = new Date(t.createdAt);
		return d >= windowStart && d <= now;
	});

	// Defensive cap: don't create an excessive number of frames
	const framesCount = Math.max(1, Math.min(200, Math.ceil(windowMs / frameMs)));

	const frames: FrameMetrics[] = Array.from({ length: framesCount }).map(
		(_, i) => {
			const start = new Date(windowStart.getTime() + i * frameMs);
			const end = new Date(Math.min(start.getTime() + frameMs, now.getTime()));
			return {
				start: start.toISOString(),
				end: end.toISOString(),
				total_posts: 0,
				verified_count: 0,
				non_verified_count: 0,
				likes: 0,
				retweets: 0,
				replies: 0,
				quotes: 0,
				views: 0,
				engagement_sum: 0,
				average_engagement: 0,
			};
		}
	);

	// Assign tweets to frames and accumulate metrics
	for (const tweet of windowTweets) {
		const td = new Date(tweet.createdAt).getTime();
		if (isNaN(td)) continue;

		const idx = Math.floor((td - windowStart.getTime()) / frameMs);
		if (idx < 0 || idx >= framesCount) continue;

		const frame = frames[idx];
		frame.total_posts += 1;

		const isVerified = !!tweet.author?.verified;
		if (isVerified) frame.verified_count += 1;
		else frame.non_verified_count += 1;

		const likes = tweet.likeCount || 0;
		const retweets = tweet.retweetCount || 0;
		const replies = tweet.replyCount || 0;
		const quotes = tweet.quoteCount || 0;
		const views = tweet.viewCount || 0;

		frame.likes += likes;
		frame.retweets += retweets;
		frame.replies += replies;
		frame.quotes += quotes;
		frame.views += views;

		// engagement sum (can be customized)
		const engagement = likes + retweets + replies + quotes;
		frame.engagement_sum += engagement;
	}

	// Finalize per-frame averages
	for (const frame of frames) {
		frame.average_engagement =
			frame.total_posts > 0 ? frame.engagement_sum / frame.total_posts : 0;
	}

	// Totals across the window
	const totals = frames.reduce(
		(acc, f) => {
			acc.likes += f.likes;
			acc.retweets += f.retweets;
			acc.replies += f.replies;
			acc.quotes += f.quotes;
			acc.views += f.views;
			return acc;
		},
		{ likes: 0, retweets: 0, replies: 0, quotes: 0, views: 0 }
	);

	// Compute legacy/overall metrics for compatibility
	const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const recent24 = tweets.filter(
		(t) => new Date(t.createdAt) >= twentyFourHoursAgo
	);
	const lastHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
	const recentLastHour = tweets.filter(
		(t) => new Date(t.createdAt) >= lastHourAgo
	);

	const totalEngagementWindow =
		totals.likes + totals.retweets + totals.replies + totals.quotes;
	const averageEngagement =
		windowTweets.length > 0 ? totalEngagementWindow / windowTweets.length : 0;

	// Trending: compare most recent frame to a robust center (median) to avoid spikes dominating
	const postsPerFrame = frames.map((f) => f.total_posts).sort((a, b) => a - b);
	const medianPostsPerFrame = (() => {
		if (postsPerFrame.length === 0) return 0;
		const mid = Math.floor(postsPerFrame.length / 2);
		if (postsPerFrame.length % 2 === 1) return postsPerFrame[mid];
		return (postsPerFrame[mid - 1] + postsPerFrame[mid]) / 2;
	})();

	const mostRecentFrame = frames[frames.length - 1];
	let trendingScore = 0;
	if (medianPostsPerFrame > 0)
		trendingScore = Math.min(
			mostRecentFrame.total_posts / medianPostsPerFrame,
			10
		);
	else trendingScore = Math.min(mostRecentFrame.total_posts, 10); // if no baseline, use raw value capped

	return {
		total_posts: tweets.length,
		posts_last_hour: recentLastHour.length,
		posts_last_24h: recent24.length,
		average_engagement: averageEngagement,
		trending_score: trendingScore,
		frames,
		totals,
		window_minutes: windowMinutes,
		frame_minutes: frameMinutes,
	};
}

export class Twitter {
	private apiKey: string;
	private searchUrl: string =
		"https://api.twitterapi.io/twitter/tweet/advanced_search";
	private fetchTweetUrl: string = "https://api.twitterapi.io/twitter/tweets";
	private query: string = "";
	private limit: number = 20;
	private delay: number = 500;
	private maxRetries: number = 1;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	/**
	 * Sleep function to implement delay between requests
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Extract tweet ID from a Twitter/X URL
	 */
	public extractTweetId(url: string): string | null {
		const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
		return match ? match[1] : null;
	}

	/**
	 * Make API request with retry mechanism
	 */
	private async makeRequest(
		url: string,
		type: { [key: string]: string },
		cursor?: string
	): Promise<TwitterApiResponse> {
		let retries = 0;

		while (retries <= this.maxRetries) {
			try {
				const params = new URLSearchParams({
					...type,
					query: this.query,
				});

				if (cursor) {
					params.append("cursor", cursor);
				}

				const response = await axios.get(`${url}?${params.toString()}`, {
					headers: {
						"X-API-Key": this.apiKey,
					},
				});

				return response.data as TwitterApiResponse;
			} catch (error) {
				retries++;
				const axiosError = error as AxiosError;

				if (retries > this.maxRetries) {
					throw new Error(
						`Failed after ${this.maxRetries} retries: ${axiosError.message}`
					);
				}

				const delayTime = this.delay * Math.pow(2, retries - 1);
				console.warn(
					`Request failed, retrying in ${delayTime}ms. Error: ${axiosError.message}`
				);
				await this.sleep(delayTime);
			}
		}

		throw new Error("Request failed");
	}
	/**
	 * Get a tweet by its ID
	 */
	async getTweetById(tweetId: string): Promise<Tweet | null> {
		try {
			const result = await this.makeRequest(this.fetchTweetUrl, {
				tweet_ids: tweetId,
			});

			if (result && result.tweets && result.tweets.length > 0) {
				return result.tweets[0];
			}

			return null;
		} catch (error) {
			console.error(`Error fetching tweet with ID ${tweetId}:`, error);
			return null;
		}
	}

	/**
	 * Get tweets based on current query, with pagination
	 */
	async getTweetsByQuery(
		queryToUse?: string,
		limitToUse?: number
	): Promise<Tweet[]> {
		this.query = queryToUse || this.query;
		const limit = limitToUse || this.limit;

		if (!this.query) {
			throw new Error("Query is required");
		}

		let count = 0;
		let allTweets: Tweet[] = [];
		let nextCursor: string | undefined = undefined;
		let hasNextPage = true;

		while (hasNextPage && count < limit) {
			await this.sleep(this.delay);

			const result = await this.makeRequest(
				this.searchUrl,
				{ queryType: "Latest" },
				nextCursor
			);

			if (!result || !result.tweets) {
				break;
			}

			allTweets = [...allTweets, ...result.tweets];
			count += result.tweets.length;

			// Check if we need to continue pagination
			hasNextPage = result.has_next_page && count < limit;
			nextCursor = result.next_cursor;
		}

		// Truncate to the requested limit if we went over
		return allTweets.slice(0, limit);
	}

	/**
	 * Get top tweets for a query
	 */
	async getTopTweets(
		query: string,
		limit: number = this.limit
	): Promise<Tweet[]> {
		this.query = query;
		this.limit = limit;

		let count = 0;
		let allTweets: Tweet[] = [];
		let nextCursor: string | undefined = undefined;
		let hasNextPage = true;

		while (hasNextPage && count < limit) {
			await this.sleep(this.delay);

			const result = await this.makeRequest(
				this.searchUrl,
				{ queryType: "Top" },
				nextCursor
			);

			if (!result || !result.tweets) {
				break;
			}

			allTweets = [...allTweets, ...result.tweets];
			count += result.tweets.length;

			// Check if we need to continue pagination
			hasNextPage = result.has_next_page && count < limit;
			nextCursor = result.next_cursor;
		}

		return allTweets.slice(0, limit);
	}

	/**
	 * Get the latest tweet for a query
	 */
	async getLatestTweet(query: string): Promise<Tweet | null> {
		this.query = query;
		this.limit = 1;

		try {
			const result = await this.makeRequest(this.searchUrl, {
				queryType: "Latest",
			});

			if (result && result.tweets && result.tweets.length > 0) {
				return result.tweets[0];
			}

			return null;
		} catch (error) {
			console.error("Error fetching latest tweet:", error);
			return null;
		}
	}
}

interface SentimentAnalysis {
	summary: {
		total: number;
		counts: {
			positive: number;
			negative: number;
			neutral: number;
		};
		tokenUsage: any;
	};
	tweets: {
		tweetId: string;
		created: string;
		url: string;
		sentiment: { score: number } | null;
	}[];
}

export async function analyzeSentiment(
	tweets: Tweet[]
): Promise<SentimentAnalysis> {
	if (!Array.isArray(tweets) || tweets.length === 0) {
		throw new Error("Input must be a non-empty array of tweets");
	}

	const tweetSentimentSchema = z.object({
		score: z
			.number()
			.min(-10)
			.max(10)
			.describe(
				"Sentiment score from -10 (most negative) to 10 (most positive), with 0 being neutral"
			),
	});

	const prompt = `
Analyze the sentiment of each tweet about Solana-based meme coins in the following array. 
For each tweet:
1. Assign a sentiment score from -10 (extremely negative) to 10 (extremely positive), with 0 being neutral.
2. Consider the following factors to determine the score:
   - **Bullish Indicators**: Positive mentions of price increases, upcoming token launches, endorsements by influencers or celebrities, and community excitement.
   - **Bearish Indicators**: Mentions of price declines, rug pulls, scams, or negative news about the token or its ecosystem.
   - **Neutral Indicators**: General discussions without strong positive or negative sentiments including promotions of exchange,telegram group for signals.
3. Provide a brief explanation for the assigned score, highlighting key phrases or elements influencing the sentiment.

Tweets: ${JSON.stringify(tweets.map((tw) => tw.text))}
`;

	const sentimentCounts = {
		positive: 0,
		negative: 0,
		neutral: 0,
	};

	try {
		// Generate sentiment analysis with improved options
		const { object: sentiments, usage } = await generateObject({
			model: google("gemini-2.0-flash"),
			output: "array",
			schema: tweetSentimentSchema,
			prompt,
			temperature: 0.1,
			maxRetries: 3,
		});

		const categorizedTweets = tweets.map((tweet, index) => {
			const sentiment = sentiments[index];

			// Increment the appropriate counter
			if (sentiment.score > 0) sentimentCounts.positive++;
			if (sentiment.score < 0) sentimentCounts.negative++;
			if (sentiment.score === 0) sentimentCounts.neutral++;
			// Return tweet with sentiment data
			return {
				tweetId: tweet.id,
				created: tweet.createdAt,
				url: tweet.url,
				sentiment: sentiment || null,
			};
		});

		return {
			summary: {
				total: tweets.length,
				counts: sentimentCounts,
				tokenUsage: usage,
			},
			tweets: categorizedTweets,
		};
	} catch (error: any) {
		console.error("Sentiment analysis failed:", error);
		throw new Error(`Failed to analyze sentiment: ${error.message}`);
	}
}

// const url = 'https://x.com/grv/status/232323'
// const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/)
// console.log(match)
// console.log(
//   new URLSearchParams({
//     aaa: 'value',
//   }).toString()
// )

// const options = { method: 'GET', headers: { 'X-API-Key': process.env.TWITTER_API_KEY as string } }

// fetch(
//   'https://api.twitterapi.io/twitter/tweets?tweet_ids=1914641623322947706',
//   options
// )
//   .then((response) => response.json())
//   .then((response) => console.log(response))
//   .catch((err) => console.error(err))
// Example usage:
// async function run() {
//   const twitter = new Twitter('7b2f5f7983504d4aa9d8c7782af35eec')

//   try {
//     // Get latest tweet for a query
//     const latestTweet = await twitter.getLatestTweet('javascript')
//     console.log('Latest tweet:', latestTweet)

//     // // Get top tweets for a query
//     // const topTweets = await twitter.getTopTweets('typescript', 10)
//     // console.log('Top tweets:', topTweets)

//     // // Get tweets by query with pagination
//     // const tweets = await twitter.getTweetsByQuery('nodejs', 30)
//     // console.log('All tweets:', tweets)
//   } catch (error) {
//     console.error('Error:', error)
//   }
// }

// // Run the example
// run();

export default Twitter;
