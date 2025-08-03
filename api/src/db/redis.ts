import { createClient } from 'redis'

const redisClient = createClient({
  url: process.env.REDIS_CLIENT_URL,
})

export default redisClient
