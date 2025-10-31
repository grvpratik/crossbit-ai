import { Link } from "react-router";

export default function NotFound() {
	return (
		<div className="h-full flex flex-col items-start justify-center min-h-svh ">
			<div className="text-start ml-4 lg:ml-8 space-y-2">
				<h1 className="text-4xl font-bold font-mono">404</h1>
				<p className="text-xl text-muted-foreground font-serif uppercase">
					Page not found
				</p>
				<p className="text-muted-foreground text-base ">
					The page you're looking for doesn't exist or has been moved.
				</p>
				<Link
					to="/"
					className="inline-block mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
				>
					Go back home
				</Link>
			</div>
		</div>
	);
}
