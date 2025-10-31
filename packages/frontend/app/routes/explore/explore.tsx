import { ProtectedRoute } from "~/wrapper/auth-provider";
import { useAuth } from "~/wrapper/auth-provider";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/explore";
import { UploadButton } from "~/lib/uploadthing";
import { Chat } from "@ai-sdk/react";


export function meta({}: Route.MetaArgs) {
	return [
		{ title: "explore" },
		{ name: "description", content: "Your explore" },
	];
}

export default function explore() {
	return (
		<ProtectedRoute>
			<ExploreContent />
		</ProtectedRoute>
	);
}

function ExploreContent() {
	const { session, signOut } = useAuth();

	const handleSignOut = async () => {
		await signOut();
		window.location.href = "/";
	};

	return (
		<main className="w-full h-full min-h-svh flex flex-col  ">
			Lorem ipsum dolor sit amet consectetur adipisicing elit. Cupiditate
			repellendus tempore, facere exercitationem numquam at nemo autem ducimus
			natus, ex saepe, voluptatibus atque ut aspernatur labore voluptates ea?
			Unde, doloremque.
			<UploadButton
				endpoint="chatAttachment"
				onClientUploadComplete={(res) => {
					// Do something with the response
					console.log("Files: ", res);
					alert("Upload Completed");
				}}
				onUploadError={(error: Error) => {
					// Do something with the error.
					alert(`ERROR! ${error.message}`);
				}}
				onBeforeUploadBegin={(files) => {
					// Preprocess files before uploading (e.g. rename them)
					return files.map(
						(f) => new File([f], "renamed-" + f.name, { type: f.type })
					);
				}}
				onUploadBegin={(name) => {
					// Do something once upload begins
					console.log("Uploading: ", name);
				}}
			/>
		</main>
	);
}
