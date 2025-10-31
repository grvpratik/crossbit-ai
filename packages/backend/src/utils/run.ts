import Twitter from "../services/x.service";

(async () => {
	const socialService = new Twitter("new1_088fa7b49f2249408874ae55002e7744");
	const topPosts = await socialService.getTopTweets(
		"2NVNtwvWXJHMgKWHc8AH146u7QektAaHtfEUYZ4hpump"
	);
	console.log(JSON.stringify(topPosts, null, 2));
})();
