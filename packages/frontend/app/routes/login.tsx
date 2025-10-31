import { useAuth } from "~/wrapper/auth-provider";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Link, Navigate } from "react-router";
import LoadingPage from "./loading";
import { ChevronLeftIcon, Grid2x2PlusIcon } from "lucide-react";
import { useLoading } from "~/hooks/useLoading";

// optional loading icons
import { Loader2 } from "lucide-react";

export default function Login() {
	const { session, signIn, isPending } = useAuth();
	const { withLoading } = useLoading();

	const [loadingButton, setLoadingButton] = useState<
		"google" | "twitter" | null
	>(null);

	if (isPending) return <LoadingPage />;
	if (session?.user) {
		return <Navigate to="/chat/new" replace />;
	}

	const handleGoogleLogin = async () => {
		setLoadingButton("google");
		try {
			console.log(import.meta.env.VITE_APP_URL, "vite");
			const res = await withLoading(() =>
				signIn.social({
					provider: "google",
					callbackURL: `${import.meta.env.VITE_APP_URL}/explore`,
					errorCallbackURL: `${
						import.meta.env.VITE_APP_URL
					}/login?error=auth_failed`,
					newUserCallbackURL: `${import.meta.env.VITE_APP_URL}/explore`,
				})
			);
			if (res.error) {
				toast.error(res.error.message || "Google login failed");
			}
		} catch (e) {
			console.log(e);
			toast.error("Google login error");
		} finally {
			setLoadingButton(null);
		}
	};

	const handleTwitterLogin = async () => {
		setLoadingButton("twitter");
		try {
			const res = await withLoading(() =>
				signIn.social({
					provider: "twitter",
					callbackURL: `${import.meta.env.VITE_APP_URL}/explore`,
					errorCallbackURL: `${
						import.meta.env.VITE_APP_URL
					}/login?error=auth_failed`,
					newUserCallbackURL: `${import.meta.env.VITE_APP_URL}/explore`,
				})
			);
			if (res.error) {
				toast.error(res.error.message || "Twitter login failed");
			}
		} catch {
			toast.error("Twitter login error");
		} finally {
			setLoadingButton(null);
		}
	};

	return (
		
		<div className="relative h-screen   min-h-screen w-screen overflow-hidden">
			<img
				src="/landscape.png"
				alt=""
				className="absolute inset-0 w-full h-full object-cover hidden lg:block "
			/>
			<img
				src="/potrait.png"
				alt=""
				className="absolute inset-0 w-full h-full object-cover sm:hidden block "
			/>
			<div className="relative mx-auto flex min-h-screen flex-col justify-between gap-2">
				<div className="flex w-full m-4">
					<Button variant="ghost" asChild>
						<Link to="/">
							<ChevronLeftIcon className="size-4" />
						</Link>
					</Button>
				</div>

				<div className="mx-auto flex flex-col space-y-4 px-4 sm:w-xs">
					<div className="flex items-center gap-2">
						<img src="/favicon.ico" className="size-8 rounded " />
						<p className="font-serif text-xl font-semibold tracking-wider ">
							Upmint
						</p>
					</div>
					<div className="flex flex-col space-y-1">
						<h1 className="font-serif font-bold tracking-wider text-2xl">
							Sign In or Join Now!
						</h1>
						<p className="text-muted-foreground text-base">
							Login or create your Upmint account.
						</p>
					</div>

					<div className="space-y-2">
						{/* GOOGLE BUTTON */}
						<Button
							type="button"
							variant="secondary"
							size="lg"
							className="w-full rounded-3xl text-sm font-semibold cursor-pointer transform-gpu transition-transform duration-150 ease-out active:scale-95 active:translate-y-[1px] will-change-transform"
							onClick={handleGoogleLogin}
							disabled={!!loadingButton}
						>
							<span className="inline-flex items-center justify-center gap-2">
								{loadingButton === "google" ? (
									<Loader2 className="me-2 size-4 animate-spin" />
								) : (
									<GoogleSVG className="me-2 size-4" />
								)}

								<span className="transition-transform duration-150 ease-out">
									{loadingButton === "google"
										? "Signing in..."
										: "Continue with Google"}
								</span>
							</span>
						</Button>

						{/* TWITTER BUTTON */}
						<Button
							type="button"
							size="lg"
							variant="secondary"
							className="w-full rounded-3xl cursor-pointer text-sm font-semibold transform-gpu transition-transform duration-150 ease-out active:scale-95 active:translate-y-[1px] will-change-transform"
							onClick={handleTwitterLogin}
							disabled={!!loadingButton}
						>
							{/* inline-flex so the whole content (icon + text) scales smoothly */}
							<span className="inline-flex items-center justify-center gap-2">
								{loadingButton === "twitter" ? (
									<Loader2 className="me-2 size-4 animate-spin" />
								) : (
									<TwitterSVG className="me-2 size-4" />
								)}

								<span className="transition-transform duration-150 ease-out">
									{loadingButton === "twitter"
										? "Signing in..."
										: "Continue with X"}
								</span>
							</span>
						</Button>
					</div>
				</div>

				<div className="mx-auto flex flex-col items-center space-y-4 px-4 py-2 sm:w-xs ">
					<p className="text-muted-foreground text-xs font-medium opacity-75">
						By clicking continue, you agree to our{" "}
						<a
							href="#"
							className="underline underline-offset-4 hover:text-primary"
						>
							Terms of Service
						</a>{" "}
						and{" "}
						<a
							href="#"
							className="underline underline-offset-4 hover:text-primary"
						>
							Privacy Policy
						</a>
						.
					</p>
				</div>
			</div>
		</div>
	);
}

const GoogleSVG = (props: React.ComponentProps<"svg">) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={64}
		height={64}
		preserveAspectRatio="xMidYMid"
		viewBox="-3 0 262 262"
		{...props}
	>
		<path
			fill="#4285F4"
			d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
		/>
		<path
			fill="#34A853"
			d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
		/>
		<path
			fill="#FBBC05"
			d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
		/>
		<path
			fill="#EB4335"
			d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
		/>
	</svg>
);
const TwitterSVG = (props: React.ComponentProps<"svg">) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 1024 1024"
		fill="currentColor"
		fillRule="evenodd"
		{...props}
	>
		<path
			d="M818 800 498.11 333.745l.546.437L787.084 0h-96.385L455.738 272 269.15 0H16.367l298.648 435.31-.036-.037L0 800h96.385l261.222-302.618L565.217 800zM230.96 72.727l448.827 654.546h-76.38L154.217 72.727z"
			transform="translate(103 112)"
		/>
	</svg>
);
