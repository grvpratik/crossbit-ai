import { Router, Request, Response } from "express";
import {
	requireAuth,
	optionalAuth,
	getUserId,
	isAuthenticated,
} from "../middleware/auth";
import Twitter, { cleanXresults, getVoumeMatrix } from "../services/x.service";
import { getAddressInfo } from "../utils/rpc";
import { MetadataService } from "../services/onchain.service";
import { MetadataBySoltracker } from "../providers/solanatracker-provider";
import { TokenDetailResponse } from "@solana-tracker/data-api";
import { symbol } from "zod";

const router: Router = Router();

/**
 * GET /api/example/public
 * Public endpoint - no authentication required
 */
router.get("/public", async (req: Request, res: Response) => {
	console.log(process.env.SOLANA_TRACKER_API, "jj");
	const x = process.env.SOLANA_TRACKER_API;
	let acc;
	let result;
	let volume;

	try {
		const socialService = new Twitter(process.env.TWITTER_API_KEY as string);

		const topPosts = await socialService.getTopTweets(
			"3mVVCjwHuLAzkrQ3EREAxziFUiyjv8wZudrkwaF9pump",
			50
		);

		// filter low effort account and posts(repeated);

		// =>notable accounts section here
		// extract account maybe define category to accounts and rank based on follower and verified and score

		// =>activity
		// show chart of tweets over time (either multi line chart for sentiment plus voume OR another pie chart for sentiment)
		// show verified account

		//=> sentiments maybe pie chart

		// =>top posts
		// if account with score found then rank based on that or just views and interactions

		// const accounts = getAccounts(topPosts);

		const { posts, accounts } = cleanXresults(topPosts);
		console.log(topPosts.length, "top posts");
		console.log(
			`Found ${accounts.length} important accounts from ${posts.length} posts`
		);

		acc = accounts;
		result = posts;
		// const topPostSentiments = await analyzeSentiments(
		// 	topPosts,
		// 	authorIds
		// );

		// const latestPosts = await socialService.getTweetsByQuery(
		// 	address,
		// 	100
		// );

		// // Calculate volume metrics
		volume = getVoumeMatrix(topPosts);

		// const sentimentCounts = topPostSentiments.reduce(
		// 	(acc, result) => {
		// 		const weight = result.engagement_score * result.confidence;
		// 		acc.total_weight += weight;

		// 		if (result.sentiment === "positive") {
		// 			acc.positive += weight;
		// 		} else if (result.sentiment === "negative") {
		// 			acc.negative += weight;
		// 		} else {
		// 			acc.neutral += weight;
		// 		}
		// 		return acc;
		// 	},
		// 	{ positive: 0, negative: 0, neutral: 0, total_weight: 0 }
		// );

		// // Normalize percentages
		// const totalWeight = sentimentCounts.total_weight || 1;
		// const overall_sentiment = {
		// 	positive: (sentimentCounts.positive / totalWeight) * 100,
		// 	negative: (sentimentCounts.negative / totalWeight) * 100,
		// 	neutral: (sentimentCounts.neutral / totalWeight) * 100,
		// 	weighted_score:
		// 		(sentimentCounts.positive - sentimentCounts.negative) /
		// 		totalWeight,
		// };

		// // Calculate key metrics
		// const totalReach = accounts.reduce(
		// 	(sum, account) => sum + account.followersCount,
		// 	0
		// );
		// const totalEngagement = topPosts.reduce(
		// 	(sum, tweet) =>
		// 		sum + tweet.likeCount + tweet.retweetCount + tweet.replyCount,
		// 	0
		// );
		// const engagementRate =
		// 	totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
		// const viralPotential = Math.min(
		// 	(volumeMetrics.trending_score *
		// 		overall_sentiment.weighted_score *
		// 		engagementRate) /
		// 		10,
		// 	100
		// );

		// const analysisResult: SocialAnalysisResult = {
		// 	overall_sentiment,
		// 	volume_metrics: volumeMetrics,
		// 	top_influencers: accounts.slice(0, 10), // Top 10 influencers
		// 	sentiment_breakdown: topPostSentiments,
		// 	key_metrics: {
		// 		total_reach: totalReach,
		// 		engagement_rate: engagementRate,
		// 		viral_potential: Math.max(viralPotential, 0),
		// 	},
		// };
		const social_analysis = { volume };
		console.log("social_analysis", social_analysis);
	} catch (error: any) {
		console.log(error, "se");
	}
	res.json({
		message: "This is a public endpoint",
		timestamp: new Date().toISOString(),
		x,
		volume,
		acc,
		result,
	});
});

/**
 * GET /api/example/optional
 * Optional authentication - works with or without auth
 */
router.get("/optional", optionalAuth, (req: Request, res: Response) => {
	if (req.user) {
		res.json({
			message: "Hello authenticated user!",
			user: {
				id: req.user.id,
				email: req.user.email,
				name: req.user.name,
			},
			authenticated: true,
		});
	} else {
		res.json({
			message: "Hello guest!",
			authenticated: false,
		});
	}
});

/**
 * GET /api/example/protected
 * Protected endpoint - requires authentication
 */
router.get("/protected", requireAuth, (req: Request, res: Response) => {
	const userId = getUserId(req);
	const authenticated = isAuthenticated(req);

	res.json({
		message: "This is a protected endpoint",
		user: {
			id: req.user!.id,
			email: req.user!.email,
			name: req.user!.name,
		},
		userId,
		authenticated,
		timestamp: new Date().toISOString(),
	});
});

/**
 * POST /api/example/data
 * Protected endpoint for creating data
 */
router.post("/data", requireAuth, (req: Request, res: Response) => {
	const { title, content } = req.body;
	const userId = getUserId(req);

	if (!title || !content) {
		return res.status(400).json({
			error: "Title and content are required",
		});
	}

	// In a real app, you would save this to the database
	const data = {
		id: Date.now().toString(),
		title,
		content,
		userId,
		createdAt: new Date().toISOString(),
	};

	res.status(201).json({
		message: "Data created successfully",
		data,
	});
});

router.get("/:ca", requireAuth, async (req: Request, res: Response) => {
	const { ca: address } = req.params;
	let report = {};

	const addressInfo = await getAddressInfo(address);
	if (!addressInfo.isValid || addressInfo.type !== "tokenMint") {
		return res.status(200).json({
			success: false,
			message: `not a valid address!. curr address type:${addressInfo.type}`,
		});
	}
	const freezeAuthority = addressInfo.details?.freezeAuthority;
	const mintAuthority = addressInfo.details?.mintAuthority;
	const tokenMetadata = new MetadataService();

	tokenMetadata.registerProvider(new MetadataBySoltracker());
	const metadata = (await tokenMetadata.getTokenInfo(
		address
	)) as TokenDetailResponse;

	const token = metadata.token;;
	const pools=metadata.pools;
	const solanatrackerRisk=metadata.risk;
	
	return res.status(200).json({
		addressInfo,
		metadata,
	});
});

export default router;
