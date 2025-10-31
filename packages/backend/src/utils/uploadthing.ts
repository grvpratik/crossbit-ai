import { createUploadthing, type FileRouter } from "uploadthing/express";
import { auth } from "./auth";
import { fromNodeHeaders } from "better-auth/node";
import { UploadThingError } from "uploadthing/server";
const f = createUploadthing();

export const uploadRouter: FileRouter = {
	chatAttachment: f({ image: { maxFileSize: "4MB", maxFileCount: 3 } })
		// .middleware(async ({ req }) => {
		// 		const session = await auth.api.getSession({
		// 			headers: fromNodeHeaders(req.headers as any),
		// 		});

		// 	if (!session) throw new Error("Unauthorized");

		// 	return { userId: session.user.id };
		// })
		// .middleware(async ({ req, res }) => {
		// 	console.log(req,"req")
		// 			const session = await auth.api.getSession({
		// 				headers: fromNodeHeaders(req.headers as any),
		// 			});

		// 		if (!session) throw new UploadThingError(
		// 			"You must be logged in to upload a profile picture"
		// 		);

		// 		return { userId: session.user.id };
		// })
		.onUploadComplete(async ({ file, metadata }) => {
			console.log("File uploaded:", file.ufsUrl, "with metdata", metadata);
			return { url: file.ufsUrl };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
