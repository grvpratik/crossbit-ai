import { z } from 'zod'
import { generateObject } from 'ai'
import { registry } from '../ai/registry'
import axios, { AxiosError } from 'axios'
import logger from '../../utils/logger'

export interface Tweet {
  type: 'tweet'
  id: string
  url: string
  text: string
  source: string
  retweetCount: number
  replyCount: number
  likeCount: number
  quoteCount: number
  viewCount: number
  createdAt: string // e.g., "Tue Dec 10 07:00:30 +0000 2024"
  lang?: string // may be empty
  bookmarkCount: number
  isReply: boolean
  inReplyToId?: string
  conversationId?: string
  inReplyToUserId?: string
  inReplyToUsername?: string
  author: TweetAuthor
  entities: TweetEntities
  quoted_tweet?: Tweet | null
  retweeted_tweet?: Tweet | null
}

export interface TweetAuthor {
  id: string
  name: string
  username: string
  profileImageUrl?: string
  verified?: boolean
  followersCount?: number
  followingCount?: number
  tweetCount?: number
  listedCount?: number
}

export interface TweetEntities {
  hashtags?: { text: string; indices: number[] }[]
  urls?: {
    url: string
    expanded_url: string
    display_url: string
    indices: number[]
  }[]
  mentions?: {
    screen_name: string
    name: string
    id: string
    indices: number[]
  }[]
  media?: {
    id: string
    media_url: string
    type: string
    indices: number[]
  }[]
}

interface TwitterApiResponse {
  tweets: Tweet[]
  has_next_page: boolean
  next_cursor: string
}

export class Twitter {
  private apiKey: string
  private searchUrl: string =
    'https://api.twitterapi.io/twitter/tweet/advanced_search'
  private fetchTweetUrl: string = 'https://api.twitterapi.io/twitter/tweets'
  private query: string = ''
  private limit: number = 20
  private delay: number = 200
  private maxRetries: number = 3

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Sleep function to implement delay between requests
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Extract tweet ID from a Twitter/X URL
   */
  public extractTweetId(url: string): string | null {
    const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/)
    return match ? match[1] : null
  }

  /**
   * Make API request with retry mechanism
   */
  private async makeRequest(
    url: string,
    type: { [key: string]: string },
    cursor?: string
  ): Promise<TwitterApiResponse> {
    let retries = 0

    while (retries <= this.maxRetries) {
      try {
        const params = new URLSearchParams({
          ...type,
          query: this.query,
        })

        if (cursor) {
          params.append('cursor', cursor)
        }

        const response = await axios.get(`${url}?${params.toString()}`, {
          headers: {
            'X-API-Key': this.apiKey,
          },
        })

        return response.data as TwitterApiResponse
      } catch (error) {
        retries++
        const axiosError = error as AxiosError

        if (retries > this.maxRetries) {
          throw new Error(
            `Failed after ${this.maxRetries} retries: ${axiosError.message}`
          )
        }

        const delayTime = this.delay * Math.pow(2, retries - 1)
        console.warn(
          `Request failed, retrying in ${delayTime}ms. Error: ${axiosError.message}`
        )
        await this.sleep(delayTime)
      }
    }

    throw new Error('Request failed')
  }
  /**
   * Get a tweet by its ID
   */
  async getTweetById(tweetId: string): Promise<Tweet | null> {
    try {
      const result = await this.makeRequest(this.fetchTweetUrl, {
        tweet_ids: tweetId,
      })

      if (result && result.tweets && result.tweets.length > 0) {
        return result.tweets[0]
      }

      return null
    } catch (error) {
      console.error(`Error fetching tweet with ID ${tweetId}:`, error)
      return null
    }
  }

  /**
   * Get tweets based on current query, with pagination
   */
  async getTweetsByQuery(
    queryToUse?: string,
    limitToUse?: number
  ): Promise<Tweet[]> {
    this.query = queryToUse || this.query
    const limit = limitToUse || this.limit

    if (!this.query) {
      throw new Error('Query is required')
    }

    let count = 0
    let allTweets: Tweet[] = []
    let nextCursor: string | undefined = undefined
    let hasNextPage = true

    while (hasNextPage && count < limit) {
      await this.sleep(this.delay)

      const result = await this.makeRequest(
        this.searchUrl,
        { queryType: 'Latest' },
        nextCursor
      )

      if (!result || !result.tweets) {
        break
      }

      allTweets = [...allTweets, ...result.tweets]
      count += result.tweets.length

      // Check if we need to continue pagination
      hasNextPage = result.has_next_page && count < limit
      nextCursor = result.next_cursor
    }

    // Truncate to the requested limit if we went over
    return allTweets.slice(0, limit)
  }

  /**
   * Get top tweets for a query
   */
  async getTopTweets(
    query: string,
    limit: number = this.limit
  ): Promise<Tweet[]> {
    this.query = query
    this.limit = limit

    let count = 0
    let allTweets: Tweet[] = []
    let nextCursor: string | undefined = undefined
    let hasNextPage = true

    while (hasNextPage && count < limit) {
      await this.sleep(this.delay)

      const result = await this.makeRequest(
        this.searchUrl,
        { queryType: 'Top' },
        nextCursor
      )

      if (!result || !result.tweets) {
        break
      }

      allTweets = [...allTweets, ...result.tweets]
      count += result.tweets.length

      // Check if we need to continue pagination
      hasNextPage = result.has_next_page && count < limit
      nextCursor = result.next_cursor
    }

    return allTweets.slice(0, limit)
  }

  /**
   * Get the latest tweet for a query
   */
  async getLatestTweet(query: string): Promise<Tweet | null> {
    this.query = query
    this.limit = 1

    try {
      const result = await this.makeRequest(this.searchUrl, {
        queryType: 'Latest',
      })

      if (result && result.tweets && result.tweets.length > 0) {
        return result.tweets[0]
      }

      return null
    } catch (error) {
      console.error('Error fetching latest tweet:', error)
      return null
    }
  }
}


export async function analyzeSentiment(tweets: any[]) {
 
  if (!Array.isArray(tweets) || tweets.length === 0) {
    throw new Error('Input must be a non-empty array of tweets')
  }

  const model = registry.languageModel('google:free')

  const tweetSentimentSchema = z.object({
    score: z
      .number()
      .min(-10)
      .max(10)
      .describe(
        'Sentiment score from -10 (most negative) to 10 (most positive), with 0 being neutral'
      ),
  })

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
`

 const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0,
    }

  try {
    // Generate sentiment analysis with improved options
    const { object: sentiments, usage } = await generateObject({
      model,
      output: 'array',
      schema: tweetSentimentSchema,
      prompt,
      temperature: 0.1,
      maxRetries: 3,
    })

   
   
    const categorizedTweets = tweets.map((tweet, index) => {
      const sentiment = sentiments[index]

      // Increment the appropriate counter
      if (sentiment.score > 0) sentimentCounts.positive++
      if (sentiment.score < 0) sentimentCounts.negative++
      if (sentiment.score === 0) sentimentCounts.neutral++
      // Return tweet with sentiment data
      return {
        tweetId: tweet.id,
        created:tweet.createdAt,
        url: tweet.url,
        sentiment: sentiment || null,
      }
    })

   
    return {
      summary: {
        total: tweets.length,
        counts: sentimentCounts,
        tokenUsage: usage,
      },
      tweets: categorizedTweets,
    }
  } catch (error: any) {
    logger.error('Sentiment analysis failed:', error)
    throw new Error(`Failed to analyze sentiment: ${error.message}`)
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

export default Twitter
