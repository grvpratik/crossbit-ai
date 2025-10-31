import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { AuthProvider } from "./wrapper/auth-provider";
import "./app.css";
import { ThemeProvider } from "./wrapper/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "~/components/ui/sonner";
import { ChatProvider } from "./wrapper/chat-provider";
import type React from "react";
export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
	// {
	// 	rel: "stylesheet",
	// 	href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap",
	
	// },
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<script
					crossOrigin="anonymous"
					src="//unpkg.com/react-scan/dist/auto.global.js"
				/>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className=" bg-background text-foreground antialiased">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	const queryClient = new QueryClient();
	return (
		<AuthProvider>
			<QueryClientProvider client={queryClient}>
				<ThemeProvider defaultTheme="dark" storageKey="app-theme">
					<Outlet />
					<Toaster  position="top-center" />
				</ThemeProvider>
			</QueryClientProvider>
		</AuthProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto ">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
export function UpmintLogo(props: React.ImgHTMLAttributes<HTMLImageElement>) {
	return <img {...props} src="/favicon.ico" alt="upmint logo" className=" size-8 rounded-md" />;
}