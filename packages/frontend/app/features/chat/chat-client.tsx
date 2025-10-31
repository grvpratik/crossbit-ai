import { Chat, useChat } from "@ai-sdk/react";
import React from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "~/wrapper/auth-provider";
import ChatInputArea from "./chat-input";
import ChatMessages from "~/components/chat/chat-messages";
import type { UploadedFile } from "~/hooks/useFileUpload";
import type { ChatSubmitFunction } from "~/hooks/useChatForm";
import { useSharedChatContext } from "~/wrapper/chat-provider";
import type { InferUIDataParts, UIDataPartSchemas } from "ai";
import FeaturedScreen from "./featured-list";

type ChatClientProps = {
	chat: Chat<any>;
	title?: string;
	chatSubmit?: ChatSubmitFunction;
};

const ChatClient: React.FC<ChatClientProps> = ({ chat, title, chatSubmit }) => {
	console.log("CHAT CLIENT RENDER");
	const navigate = useNavigate();
	const location = useLocation();
	const { session } = useAuth();

	const {
		id: ChatId,
		messages,
		status,
		sendMessage,
	} = useChat({
		chat,
		// onData: (dataPart) => {
		// 	console.log(dataPart, "data_part");
		// },
		// onFinish: ({message}) => {
		// 	// When assistant finished producing a response, redirect to chat page if needed
		// 	console.log("ON FINISH CALLED");
		// 	try {
		// 		if (ChatId && !location.pathname.includes(`/chat/${ChatId}`)) {
		// 			navigate(`/chat/${ChatId}`);
		// 		}
		// 	} catch (err) {
		// 		console.error("Redirect on finish failed:", err);
		// 	}
		// },
	});

	function handleChatCompletion() {
		try {
			if (ChatId && !location.pathname.includes(`/chat/${ChatId}`)) {
				navigate(`/chat/${ChatId}`);
				//   window.history.replaceState(null, '', `/chat/${ChatId}`);
			}
		} catch (err) {
			console.error("handleChatCompletion redirect failed:", err);
		}
	}
	const handleChatSubmit: ChatSubmitFunction = async ({
		input,
		model,
		agent,
		uploadedFiles,
		addresses,
		additionalTools,
		clearInput,
		clearFiles,
		clearAddresses,
		resetForm,
	}) => {
		// console.log({
		// 	input,
		// 	model,
		// 	agent,
		// 	uploadedFiles,
		// 	addresses,
		// 	additionalTools,
		// 	clearInput,
		// 	clearFiles,
		// 	clearAddresses,
		// 	resetForm,
		// });
		const inputWithAddresses = [
			input,
			...(addresses || []).map((a) => `[ADDRESS] ${a.address}`),
		].join("\n");

		const parts = [
			{ text: inputWithAddresses, type: "text" },
			...((uploadedFiles || []) as UploadedFile[]).map((file) => ({
				type: "file" as const,
				filename: file.fileName,
				url: file.uploadThingUrl,
				mediaType: file.type || "image/jpg",
			})),
			// ...(addresses || []).map((address) => ({
			// 	type: "address" as const,
			// 	address: address.address, // string or structured object
			// })),
		];

		const sendMessagePromise = sendMessage(
			{
				role: "user",
				parts: parts as unknown as UIDataPartSchemas,
			},
			{
				body: {
					model,
					agent,
					additionalTools,
					// fileUrls: (uploadedFiles || []).map((f: any) => f.uploadThingUrl),
				},
			}
		);

		// Clear input immediately after submission
		clearInput();
		clearFiles?.();
		clearAddresses?.();
		resetForm?.();

		// Wait in background (optional: handle errors if needed)
		try {
			await sendMessagePromise;
			handleChatCompletion();
		} catch (err) {
			console.error("sendMessage failed:", err);
		}
	};

	return (
		<div className="min-h-screen bg-background w-full h-full">
			{messages.length > 1 && (
				<div className=" text-xl font-bold ">{title}</div>
			)}
			{messages.length === 0 && (
				<div className="flex flex-col w-full justify-center text-balance items-center h-full ">
				<FeaturedScreen/>
				</div>
			)}
			<ChatMessages
				messages={messages}
				status={status}
				id={ChatId}
				clearError={() => {}}
			/>
			<ChatInputArea status={status} onSubmit={handleChatSubmit} />
		</div>
	);
};

export default ChatClient;
