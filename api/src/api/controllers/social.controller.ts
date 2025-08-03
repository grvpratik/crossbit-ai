import { Request, Response } from 'express'
import { ValidationError } from '../../middleware/error.middleware'
import { isValidSolanaAddress } from '../../services/onchain/utils'
import Twitter, { analyzeSentiment } from '../../services/social/twitter'

function calculateTweetVolume(tweets) {
  if (!tweets || tweets.length === 0) {
    return {
      lastHour: {
        count: 0,
        change: 0,
        intervals: [],
        engagement: { total: {}, average: {} },
      },
      last6Hours: {
        count: 0,
        change: 0,
        intervals: [],
        engagement: { total: {}, average: {} },
      },
      last24Hours: {
        count: 0,
        change: 0,
        intervals: [],
        engagement: { total: {}, average: {} },
      },
    }
  }

  // Sort tweets by creation date (newest first)
  const sortedTweets = [...tweets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const now = new Date()

  // Filter tweets by time periods
  const lastHourTweets = sortedTweets.filter(
    (tweet) =>
      now.getTime() - new Date(tweet.createdAt).getTime() <= 60 * 60 * 1000
  )

  const last6HoursTweets = sortedTweets.filter(
    (tweet) =>
      now.getTime() - new Date(tweet.createdAt).getTime() <= 6 * 60 * 60 * 1000
  )

  const last24HoursTweets = sortedTweets.filter(
    (tweet) =>
      now.getTime() - new Date(tweet.createdAt).getTime() <= 24 * 60 * 60 * 1000
  )

  // Get previous period data for comparison (to calculate change percentage)
  const previousHourTweets = sortedTweets.filter((tweet) => {
    const tweetTime = new Date(tweet.createdAt).getTime()
    return (
      now.getTime() - tweetTime > 60 * 60 * 1000 &&
      now.getTime() - tweetTime <= 2 * 60 * 60 * 1000
    )
  })

  const previous6HoursTweets = sortedTweets.filter((tweet) => {
    const tweetTime = new Date(tweet.createdAt).getTime()
    return (
      now.getTime() - tweetTime > 6 * 60 * 60 * 1000 &&
      now.getTime() - tweetTime <= 12 * 60 * 60 * 1000
    )
  })

  const previous24HoursTweets = sortedTweets.filter((tweet) => {
    const tweetTime = new Date(tweet.createdAt).getTime()
    return (
      now.getTime() - tweetTime > 24 * 60 * 60 * 1000 &&
      now.getTime() - tweetTime <= 48 * 60 * 60 * 1000
    )
  })

  // Calculate percentage changes
  const hourlyChange = calculateChangePercentage(
    lastHourTweets.length,
    previousHourTweets.length
  )
  const sixHourChange = calculateChangePercentage(
    last6HoursTweets.length,
    previous6HoursTweets.length
  )
  const dailyChange = calculateChangePercentage(
    last24HoursTweets.length,
    previous24HoursTweets.length
  )

  // Generate interval data
  const hourlyIntervals = generateIntervals(lastHourTweets, 10, 6) // 10-minute intervals
  const sixHourIntervals = generateIntervals(last6HoursTweets, 60, 6) // 1-hour intervals
  const dailyIntervals = generateIntervals(last24HoursTweets, 180, 8) // 3-hour intervals

  // Calculate engagement metrics
  const hourlyEngagement = calculateEngagementMetrics(lastHourTweets)
  const sixHourEngagement = calculateEngagementMetrics(last6HoursTweets)
  const dailyEngagement = calculateEngagementMetrics(last24HoursTweets)

  return {
    lastHour: {
      count: lastHourTweets.length,
      change: hourlyChange,
      intervals: hourlyIntervals,
      engagement: hourlyEngagement,
    },
    last6Hours: {
      count: last6HoursTweets.length,
      change: sixHourChange,
      intervals: sixHourIntervals,
      engagement: sixHourEngagement,
    },
    last24Hours: {
      count: last24HoursTweets.length,
      change: dailyChange,
      intervals: dailyIntervals,
      engagement: dailyEngagement,
    },
  }
}

// Helper function to calculate percentage change
function calculateChangePercentage(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Helper function to generate time intervals with engagement data
function generateIntervals(tweets, minutesPerInterval, numIntervals) {
  const intervals = []
  const now = new Date()

  // Create the specified number of intervals
  for (let i = 0; i < numIntervals; i++) {
    const endTime = new Date(now.getTime() - i * minutesPerInterval * 60 * 1000)
    const startTime = new Date(
      endTime.getTime() - minutesPerInterval * 60 * 1000
    )

    // Format the interval name (e.g., "12:00")
    const name = formatTimeLabel(endTime)

    // Filter tweets for this interval
    const intervalTweets = tweets.filter((tweet) => {
      const tweetTime = new Date(tweet.createdAt).getTime()
      return tweetTime >= startTime.getTime() && tweetTime <= endTime.getTime()
    })

    // Calculate engagement for this interval
    const count = intervalTweets.length
    // const engagement = {
    //   likes: sumEngagement(intervalTweets, 'likeCount'),
    //   retweets: sumEngagement(intervalTweets, 'retweetCount'),
    //   replies: sumEngagement(intervalTweets, 'replyCount'),
    //   quotes: sumEngagement(intervalTweets, 'quoteCount'),
    //   views: sumEngagement(intervalTweets, 'viewCount'),
    // }

    intervals.unshift({ name, count })
  }

  return intervals
}

// Helper function to format time label
function formatTimeLabel(date) {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  return utcDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
}

// Helper function to sum engagement metrics
function sumEngagement(tweets, property) {
  return tweets.reduce((sum, tweet) => sum + (tweet[property] || 0), 0)
}

// Helper function to calculate engagement metrics
function calculateEngagementMetrics(tweets) {
  if (tweets.length === 0) {
    return {
      total: { likes: 0, retweets: 0, replies: 0, quotes: 0, views: 0 },
      average: { likes: 0, retweets: 0, replies: 0, quotes: 0, views: 0 },
    }
  }

  // Calculate total engagement
  const total = {
    likes: sumEngagement(tweets, 'likeCount'),
    retweets: sumEngagement(tweets, 'retweetCount'),
    replies: sumEngagement(tweets, 'replyCount'),
    quotes: sumEngagement(tweets, 'quoteCount'),
    views: sumEngagement(tweets, 'viewCount'),
  }

  // Calculate average engagement per tweet
  const average = {
    likes: total.likes / tweets.length,
    retweets: total.retweets / tweets.length,
    replies: total.replies / tweets.length,
    quotes: total.quotes / tweets.length,
    views: total.views / tweets.length,
  }

  return { total, average }
}

// After calculating volume data, you'll need to add these helper functions to complete the API endpoint
// function identifyNotableAccounts(tweets) {
//   const accountsMap = new Map()

//   // Compile statistics for each author
//   tweets.forEach((tweet) => {
//     if (!tweet.author || !tweet.author.username) return

//     const username = tweet.author.username
//     if (!accountsMap.has(username)) {
//       accountsMap.set(username, {
//         username,
//         displayName: tweet.author.name || username,
//         profileImageUrl: tweet.author.profileImageUrl || '',
//         verified: tweet.author.verified || false,
//         followerCount: tweet.author.followersCount || 0,
//         tweetCount: 0,
//         engagement: {
//           likes: 0,
//           retweets: 0,
//           replies: 0,
//           quotes: 0,
//           views: 0,
//         },
//       })
//     }

//     const account = accountsMap.get(username)
//     account.tweetCount++
//     account.engagement.likes += tweet.likeCount || 0
//     account.engagement.retweets += tweet.retweetCount || 0
//     account.engagement.replies += tweet.replyCount || 0
//     account.engagement.quotes += tweet.quoteCount || 0
//     account.engagement.views += tweet.viewCount || 0
//   })

//   // Convert to array and sort by engagement
//   const accounts = Array.from(accountsMap.values())

//   // Calculate total engagement score for sorting
//   accounts.forEach((account) => {
//     account.engagementScore =
//       account.engagement.likes * 1 +
//       account.engagement.retweets * 2 +
//       account.engagement.replies * 1 +
//       account.engagement.quotes * 2
//   })

//   // Sort by engagement score (descending)
//   accounts.sort((a, b) => b.engagementScore - a.engagementScore)
// //   filter only verified and sort based on follower and engagement

//   // Return top 10 accounts
//   return accounts.slice(0, 10)
// }

// function getTopPosts(tweets) {
//   if (!tweets || tweets.length === 0) return []

//   // Create a copy of tweets with engagement score
//   const scoredTweets = tweets.map((tweet) => {
//     // Calculate engagement score
//     const engagementScore =
//       (tweet.likeCount || 0) * 1 +
//       (tweet.retweetCount || 0) * 2 +
//       (tweet.replyCount || 0) * 1 +
//       (tweet.quoteCount || 0) * 2 +
//       (tweet.viewCount || 0) * 0.01 // Lower weight for views

//     return {
//       ...tweet,
//       engagementScore,
//     }
//   })

//   // Sort by engagement score (descending)
//   scoredTweets.sort((a, b) => b.engagementScore - a.engagementScore)

//   // Return top 5 posts
//   return scoredTweets.slice(0, 5)
// }
const IGNORE_TWITTER_ACCOUNTS: any[] = []
const ANALYZED_TWIITER_ACCOUNTS:any[]=[{id:'',username:'',score:0,description:''}]
export async function getTwitterAnalysis(req: Request, res: Response) {
  const tokenAddress = req.params.ca

  if (!tokenAddress) throw new ValidationError('Token CA is required')
  if (!isValidSolanaAddress(tokenAddress))
    throw new ValidationError('Invalid Solana address')
  console.time('ft')
  const twitter = new Twitter(process.env.TWITTER_API_KEY!)




  const recentTweets = (
    await twitter.getTweetsByQuery(tokenAddress, 200)
  ).filter((tweet) => !IGNORE_TWITTER_ACCOUNTS.includes(tweet.author.id))




  const twlen = recentTweets.length
 


// reassign score from known twitter account 
  // Analyze sentiment
  const sentimentData = await analyzeSentiment(recentTweets)


 if(twlen){}
  // console.log(twlen)
  console.timeEnd('ft')

  const volumeData = calculateTweetVolume(recentTweets)
  console.time('s')
  const sentimentResult = sentimentData.tweets.map((tweet) => [
    tweet.tweetId,
    tweet.sentiment.score,
  ])
  console.timeEnd('s')

  // const accountsData = identifyNotableAccounts(recentTweets)


  // const topPosts = getTopPosts(recentTweets)

  res.json({
    volume: volumeData,
    sentiments: { summery: sentimentData.summary, tweet: sentimentResult },
    // accounts: accountsData,
    // posts: topPosts,
  })
}
