import type { Route } from "./+types/chat-details";
import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ProtectedRoute, useAuth } from "~/wrapper/auth-provider";
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { MessageSquare } from "lucide-react";
import { type ChatSubmitFunction } from "~/hooks/useChatForm";
import { type UploadedFile } from "~/hooks/useFileUpload";
import ChatMessages from "~/components/chat/chat-messages";

import { toast } from "sonner";
import ChatInputArea from "~/features/chat/chat-input";
import ChatClient from "~/features/chat/chat-client";
import { useSharedChatContext } from "~/wrapper/chat-provider";

// Client Loader - fetches initial messages from server
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	console.log("client loader loaded 🚀");
	try {
		const message = await fetch(`http://localhost:3000/api/chat/${params.id}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});
		if (message.status === 404) {
			return { messages: [], notFound: true };
		}
		if (message.status !== 200) {
			throw new Error("error");
		}

		const parsed = await message.json();
		// parsed is expected to be { id, title, messages: Message[] }
		const dbMessages = parsed.messages || [];
		// convert to UIMessage[] shape expected by ai useChat
		const uiMessages = dbMessages.map((m: any) => ({
			id: m.id,
			role: m.role,
			parts: m.parts,
			metadata: m.metadata ?? undefined,
		}));
		return { messages: uiMessages, title: parsed.title, id: parsed.id };
	} catch (error) {
		console.error("Error loading chat:", error);
		return [];
	}
}

export default function ChatDetails({
	params,
	loaderData,
}: Route.ComponentProps) {
	const { chat, setChat, createChatFromExisting } = useSharedChatContext();
	const data = (loaderData as any) || {};

	// In chat-details.tsx, update the useEffect:
	useEffect(() => {
		if (!chat || chat.id !== data.id) {
			console.log("new chat context");
			createChatFromExisting(data.id, data.messages || []); // Use the new helper
		}
	}, [data.id]);

	return (
		<ProtectedRoute>
			{chat && <ChatClient chat={chat} title={data.title} />}
		</ProtectedRoute>
	);
}




// Chat Details Content Component
function ChatDetailsContent({
	id,
	initMessages,
	title,
}: {
	id: string;
	initMessages: UIMessage[];
	title?: string;
}) {
	const navigate = useNavigate();
	const { session } = useAuth();
	const location = useLocation();

	// State management
	const [chatData, setChatData] = useState<{
		id: string;
		title: string;
		createdAt: string;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [chatNotFound, setChatNotFound] = useState(false);

	// Refs for component lifecycle management
	const initialMessageSent = useRef(false);

	// Chat hook initialization
	const {
		messages,
		sendMessage,
		status,
		error: chatError,
		clearError,
	} = useChat({
		onData: (dataPart) => {
			//console.log(dataPart, "data_part");
		},
		id,
		messages: initMessages,
		transport: new DefaultChatTransport({
			api: "http://localhost:3000/api/chat",
			credentials: "include",
		}),
		onFinish: () => {
			// Logic after message is fully received
		},
		onError: (error) => {
			toast(error.message);
		},
	});

	// Submit handler for existing chat
	const handleExistingChatSubmit: ChatSubmitFunction = async ({
		input,
		model,
		agent,
		additionalTools,
		uploadedFiles,

		clearFiles,
	}) => {
		// Send message using ai-sdk
		console.log(additionalTools, "additional tools here");
		sendMessage(
			{
				role: "user",
				parts: [
					{ text: input, type: "text" },
					...uploadedFiles.map((file) => ({
						type: "file" as const,
						filename: file.fileName,
						url: file.uploadThingUrl,
						mediaType: "image/jpg",
					})),
				],
			},
			{
				body: {
					model,
					agent,
					additionalTools,
					fileUrls: uploadedFiles.map((f) => f.uploadThingUrl),
				},
			}
		);

		// Clean up

		clearFiles?.();
	};

	// Initialization logic - handles different chat scenarios
	useEffect(() => {
		console.log("initialMessageSent ref:", initialMessageSent.current);

		const state = location.state as {
			messageFromHome?: boolean;
			initialMessage?: string;
			title?: string;
		};

		const isNewChatFromHome = state?.messageFromHome;
		const hasServerMessages = initMessages.length > 0;

		// Scenario 1: Loading existing chat (refresh or direct navigation)
		if (hasServerMessages) {
			const storedChatData = localStorage.getItem(`chat_${id}`);
			if (storedChatData) {
				setChatData(JSON.parse(storedChatData));
			} else {
				// Fallback if localStorage is cleared but messages exist on server
				setChatData({
					id: id,
					title: title ?? "chat history",
					createdAt: new Date().toISOString(),
				});
			}
			setIsLoading(false);
			return;
		}

		// Scenario 2: Starting new chat from another page
		if (isNewChatFromHome && !initialMessageSent.current) {
			const storedChatData = localStorage.getItem(`chat_${id}`);
			if (storedChatData) {
				const parsedData = JSON.parse(storedChatData);
				setChatData(parsedData);

				if (parsedData.initialMessage) {
					// Send the initial message with all the stored parameters
					sendMessage(
						{
							role: "user",
							parts: [
								{ text: parsedData.initialMessage, type: "text" },
								...(parsedData.fileUrls
									? parsedData.fileUrls.map((i: UploadedFile) => ({
											type: "file",
											filename: i.fileName,
											url: i.uploadThingUrl,
											mediaType: "image/jpg",
									  }))
									: []),
							],
						},
						{
							body: {
								model: parsedData.model,
								agent: parsedData.agent,
								webSearch: parsedData.webSearch,
								fileUrls: parsedData.fileUrls || [],
							},
						}
					);
					localStorage.removeItem(`chat_${id}`);
					initialMessageSent.current = true;
				}
			} else {
				// Data for new chat not found in localStorage
				setChatNotFound(true);
			}
			setIsLoading(false);
			return;
		}

		// Scenario 3: Chat does not exist
		if (!hasServerMessages && !isNewChatFromHome) {
			setChatNotFound(true);
			setIsLoading(false);
		}
	}, [id]);

	console.log("chat info Messages", messages);

	const handleError = (error: string) => {
		console.error("Form error:", error);
		toast(error);
	};

	const handleSuccess = () => {
		console.log("Message sent successfully!");
	};

	// Loading state
	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-slate-600 dark:text-slate-400">Loading chat...</p>
				</div>
			</div>
		);
	}

	// Chat not found state
	if (chatNotFound) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
				<div className="text-center p-4">
					<div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
						<MessageSquare className="w-8 h-8 text-red-600 dark:text-red-400" />
					</div>
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
						Chat Not Found
					</h2>
					<p className="text-slate-600 dark:text-slate-400 mb-6">
						The chat you're looking for doesn't exist or has been deleted.
					</p>
					<Button
						onClick={() => navigate("/chat/new")}
						className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
					>
						Start New Chat
					</Button>
				</div>
			</div>
		);
	}

	// Main chat interface
	return (
		<div className=" relative size-full ">
			<div className="flex flex-col h-full w-full">
				{/* Chat Header */}
				<div className="mb-4">
					<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
						{chatData?.title || "Chat"}
					</h1>
					<p className="text-sm text-slate-600 dark:text-slate-400">
						{chatData?.createdAt
							? new Date(chatData.createdAt).toLocaleDateString()
							: "A new conversation"}
					</p>
					{session?.user?.name && (
						<p className="text-sm text-slate-500 dark:text-slate-400">
							Chatting as {session.user.name}
						</p>
					)}
				</div>
				<div className=" overflow-y-auto h-full w-full   ">
					{/* Conversation Area */}
					<ChatMessages
						id={id}
						error={chatError}
						status={status}
						messages={messages}
						clearError={clearError}
					/>
				</div>

				{/* Input Area */}

				<ChatInputArea
					onSubmit={handleExistingChatSubmit}
					onError={handleError}
					onSuccess={handleSuccess}
				/>
			</div>
		</div>
	);
}
