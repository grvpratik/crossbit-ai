import { ProtectedRoute, useAuth } from "~/wrapper/auth-provider";
import { Navigate } from "react-router";
import type { Route } from "./+types/home";
import LoadingPage from "./loading";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export default function Home() {
	const { session, isPending } = useAuth();

	if (isPending) {
		return <LoadingPage/>;
	}
	if (session?.user) {
		return <Navigate to="/chat/new" replace />;
	}
	if (!session?.user) {
		return <Navigate to="/login" replace />;
	}
	return null;
	// 	return (
	// 		<>
	// 			<ProtectedRoute>
	// 				<div>
	// 					Home here
	// 					<pre>{JSON.stringify(session, null, 2)}</pre>
	// 				</div>
	// 			</ProtectedRoute>
	// 		</>
	// 	);
}
