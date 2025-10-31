import {
	type RouteConfig,
	route,
	index,
	layout,
} from "@react-router/dev/routes";

export default [
	route("login", "./routes/login.tsx"),
	layout("./routes/layout.tsx", [
		index("./routes/home.tsx"),
		route("explore", "./routes/explore/explore.tsx"),
		route("history", "./routes/history.tsx"),
		route("settings", "./routes/settings.tsx"),
		route("report/:ca", "./routes/report.tsx"),
		layout("./routes/chat/chat-layout.tsx", [
			route("chat/new", "./routes/chat/chat-new.tsx"),
			route("chat/:id", "./routes/chat/chat-details.tsx"),
		]),
	]),
	route("*", "./routes/not-found.tsx"),
] satisfies RouteConfig;
