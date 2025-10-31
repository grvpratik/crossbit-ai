import { createClient, RedisClientType } from "redis";

const redisClient: RedisClientType = createClient({
	url: process.env.REDIS_CLIENT_URL,
	socket: {
		// allow overriding connect timeout via env (ms)
		connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || "10000", 10),
	},
});

// Helpful logging for debugging connection issues
redisClient.on("error", (err) => {
	// keep the message concise but include stack for deeper debugging
	console.error(
		"Redis client error:",
		err?.message || err,
		err?.stack ? `\n${err.stack}` : ""
	);
});

redisClient.on("connect", () => {
	console.info("Redis client: connect event");
});

redisClient.on("ready", () => {
	console.info("Redis client: ready");
});

export default redisClient;
