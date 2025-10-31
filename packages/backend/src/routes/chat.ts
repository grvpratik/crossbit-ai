import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import {
	convertToModelMessages,
	createUIMessageStream,
	pipeUIMessageStreamToResponse,
	streamText,
	tool,
	generateText,
	ToolSet,
	InferUITools,
} from "ai";
import { Prisma } from "../generated/prisma/client";
import prisma from "../config/database";
import { google } from "@ai-sdk/google";
import { tokenAnalyzerTool } from "../utils/tools";

const router: Router = Router();
// ==========================================
// Clean Route Handler
// ==========================================

// const tools={
// 	tokenAnalyzerTool
// }satisfies ToolSet

router.post("/", requireAuth, async (req: Request, res: Response) => {
	try {
		const {
			messages: uiMessages,
			id: chatId,
			model,
			agent,
			additionalTools,
		} = req.body;
		console.log({ uiMessages, chatId, model, agent, additionalTools });
		// Validate input
		if (!Array.isArray(uiMessages)) {
			return res.status(400).json({ error: "Missing messages array" });
		}

		const userId = req.user?.id;
		const chat = await findOrCreateChat(chatId, userId, prisma);
		const modelMessages = convertToModelMessages(uiMessages);
		const lastUserMessage = getLastUserMessage(uiMessages);

		// Save user message in background (don't await)
		if (lastUserMessage && chat.id) {
			saveUserMessage(lastUserMessage, chat.id, prisma).catch(console.error);
		}

		const stream = createUIMessageStream({
			async execute({ writer }) {
				// Start streaming immediately - DON'T await title generation
				const titlePromise = generateAndStreamTitle(
					uiMessages,
					chat.id,
					writer,
					google("gemini-2.5-flash"),
					prisma
				);
				const tools = {
					tokentool: tokenAnalyzerTool(writer),
					datares: tool({
						description: "call when asked by user no input from user",
						async execute() {
							writer.write({
								type: "data-token-tool",
								id: "test-id",
								data: {
									status_name: "statusName",
									status: "s",
									status_message: "statusMessage",
								},
								transient: true,
							});
							return { success: true };
						},
					}),
				} satisfies ToolSet;
				type MyTools = InferUITools<typeof tools>;
				// Stream text immediately in parallel
				const result = streamText({
					model: google("gemini-2.5-flash"),
					messages: modelMessages,
					tools,
				});

				writer.merge(
					result.toUIMessageStream({
						messageMetadata: ({ part }) => createMessageMetadata(part, model),
					})
				);

				// Wait for title in background (optional)
				titlePromise.catch(console.error);
			},

			onFinish: async ({ messages }) => {
				// Save messages in background - don't block response
				saveMessages(messages, chat.id, prisma).catch(console.error);
			},
		});

		pipeUIMessageStreamToResponse({ response: res, stream });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
});

// ==========================================
// Utility Functions
// ==========================================

async function findOrCreateChat(
	chatId: string | undefined,
	userId: string | undefined,
	prisma: any
) {
	let chat = null;

	if (chatId) {
		chat = await prisma.chat.findFirst({
			where: { id: chatId, userId },
		});
	}

	if (!chat) {
		chat = await prisma.chat.create({
			data: {
				id: chatId,
				title: "New Chat",
				userId: userId || undefined,
			},
		});
	}

	return chat;
}

function getLastUserMessage(messages: UIMessage[]) {
	return [...messages].reverse().find((m) => m.role === "user");
}

function getFirstUserMessage(messages: UIMessage[]) {
	return messages.find((m) => m.role === "user") || messages[0];
}

async function saveUserMessage(
	message: UIMessage,
	chatId: string,
	prisma: any
) {
	return prisma.message.create({
		data: {
			chatId,
			role: message.role,
			parts: message.parts as unknown as Prisma.InputJsonValue[],
			metadata:
				(message.metadata as unknown as Prisma.InputJsonValue) ?? undefined,
		},
	});
}

async function saveMessages(messages: any[], chatId: string, prisma: any) {
	if (!chatId || messages.length === 0) return;

	return prisma.message.createMany({
		data: messages.map((msg) => ({
			chatId,
			role: msg.role,
			parts: msg.parts as unknown as Prisma.InputJsonValue[],
			metadata: (msg.metadata as unknown as Prisma.InputJsonValue) ?? undefined,
		})),
	});
}

async function generateChatTitle(
	userMessage: UIMessage,
	model: any
): Promise<string> {
	try {
		const modelMsg = convertToModelMessages([userMessage])[0];

		const gen = await generateText({
			model,
			messages: [modelMsg],
			system: `Generate a concise, descriptive title (3-8 words) for this chat based on the user's first message. Focus on the main topic or question being asked. If topic is unclear return simple greeting message title never return more then 3-8 words in any case`,
		});

		let title = (gen.text || "New Chat").replace(/^['\"]|['\"]$/g, "");
		return title.length > 50 ? title.substring(0, 47) + "..." : title;
	} catch (err) {
		console.error("Failed to generate title:", err);
		return "New Chat";
	}
}

async function updateChatTitle(chatId: string, title: string, prisma: any) {
	try {
		return await prisma.chat.update({
			where: { id: chatId },
			data: { title, updatedAt: new Date() },
		});
	} catch (err) {
		console.error("Failed to save generated title:", err);
		throw err;
	}
}

async function generateAndStreamTitle(
	messages: UIMessage[],
	chatId: string,
	writer: any,
	model: any,
	prisma: any
) {
	try {
		// Check if chat already has a title
		const chat = await prisma.chat.findUnique({
			where: { id: chatId },
			select: { title: true },
		});

		// Skip if title exists and isn't "New Chat"
		if (chat?.title && chat.title !== "New Chat") {
			return;
		}

		const firstUserMessage = getFirstUserMessage(messages);
		if (!firstUserMessage) return;

		const title = await generateChatTitle(firstUserMessage, model);

		writer.write({
			type: "data-generate-title",
			data: { text: title },
			transient: true,
		});

		await updateChatTitle(chatId, title, prisma);
		return title;
	} catch (err) {
		console.error("Error while generating title:", err);
	}
}
function createMessageMetadata(part: any, model?: string) {
	if (part.type === "start") {
		return {
			createdAt: Date.now(),
			model: model,
		};
	}

	if (part.type === "finish") {
		return {
			totalTokens: part.totalUsage.totalTokens,
		};
	}

	return undefined;
}

async function measureExecutionTime<T>(
	fn: () => Promise<T>,
	label: string = "Execution"
): Promise<T> {
	const startTime = performance.now();
	const result = await fn();
	const endTime = performance.now();
	const executionTime = endTime - startTime;
	console.warn(`${label} time: ${executionTime} milliseconds`);
	return result;
}

// ==========================================
// Type Definitions
// ==========================================

interface UIMessage {
	role: any;
	parts: any[];
	metadata?: any;
}
router.post("/history", requireAuth, async (req: Request, res: Response) => {
	const userId = req.user?.id;
	if (!userId) return res.status(400).json({ error: "auth required" });

	const chats = await prisma.chat.findMany({
		where: {
			userId,
		},
		orderBy: {
			createdAt: "desc",
		},
		include: {
			_count: {
				select: { messages: true },
			},
		},
	});
	// map to expose a friendly messageCount and remove the _count wrapper
	const chatsWithCount = chats.map((c) => {
		const { _count, ...rest } = c as any;
		return { ...rest, messageCount: _count?.messages ?? 0 };
	});
	console.table(chatsWithCount);
	return res.status(200).json({ chats: chatsWithCount });
});
router.post("/:id", requireAuth, async (req: Request, res: Response) => {
	try {
		const { id: chatId } = req.params;

		if (!chatId) {
			return res.status(400).json({ error: "Chat ID is required" });
		}

		const userId = req.user?.id;

		// Ensure the chat belongs to the authenticated user
		const chat = await prisma.chat.findFirst({
			where: { id: chatId, userId },
		});

		if (!chat) {
			return res.status(404).json({ error: "Chat not found" });
		}

		// Fetch messages from DB
		const messages = await prisma.message.findMany({
			where: { chatId },
			orderBy: { createdAt: "asc" },
		});
		const chatDetails = await prisma.chat.findUnique({
			where: {
				id: chatId,
				userId: req.user!.id!,
			},
		});

		// // Convert DB messages into UIMessage[]
		// const uiMessages: UIMessage[] = messages.map((msg) => ({
		// 	id: msg.id,
		// 	role: msg.role as "user" | "assistant", // cast safely if using enum
		// 	parts: msg.parts as unknown as any[],
		// 	metadata: msg.metadata ?? undefined,
		// }));
		console.log("messages", messages);
		return res.status(200).json({ ...chatDetails, messages });
	} catch (error) {
		console.error("Error in /:id route:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

router.patch("/:id/title", requireAuth, async (req: Request, res: Response) => {
	try {
		const { id: chatId } = req.params;
		const { title } = req.body;

		if (!chatId) {
			return res.status(400).json({ error: "Chat ID is required" });
		}

		if (!title || typeof title !== "string" || title.trim().length === 0) {
			return res.status(400).json({ error: "Valid title is required" });
		}

		const userId = req.user?.id;

		// Ensure the chat belongs to the authenticated user
		const chat = await prisma.chat.findFirst({
			where: { id: chatId, userId },
		});

		if (!chat) {
			return res.status(404).json({ error: "Chat not found" });
		}

		// Update the chat title
		const updatedChat = await prisma.chat.update({
			where: { id: chatId },
			data: {
				title: title.trim(),
				updatedAt: new Date(),
			},
		});

		return res.status(200).json({
			message: "Title updated successfully",
			chat: {
				id: updatedChat.id,
				title: updatedChat.title,
				updatedAt: updatedChat.updatedAt,
			},
		});
	} catch (error) {
		console.error("Error updating chat title:", error);
		return res.status(500).json({ error: "Failed to update chat title" });
	}
});

// PATCH /api/chat/:id/favorite - Toggle favorite status
router.patch(
	"/:id/favorite",
	requireAuth,
	async (req: Request, res: Response) => {
		try {
			const { id: chatId } = req.params;
			const { isFavorite } = req.body;

			if (!chatId) {
				return res.status(400).json({ error: "Chat ID is required" });
			}

			if (typeof isFavorite !== "boolean") {
				return res.status(400).json({ error: "isFavorite must be a boolean" });
			}

			const userId = req.user?.id;

			// Ensure the chat belongs to the authenticated user
			const chat = await prisma.chat.findFirst({
				where: { id: chatId, userId },
			});

			if (!chat) {
				return res.status(404).json({ error: "Chat not found" });
			}

			// Update the favorite status
			const updatedChat = await prisma.chat.update({
				where: { id: chatId },
				data: {
					isFavorite,
					updatedAt: new Date(),
				},
			});

			return res.status(200).json({
				message: `Chat ${isFavorite ? "added to" : "removed from"} favorites`,
				chat: {
					id: updatedChat.id,
					isFavorite: updatedChat.isFavorite,
					updatedAt: updatedChat.updatedAt,
				},
			});
		} catch (error) {
			console.error("Error updating favorite status:", error);
			return res
				.status(500)
				.json({ error: "Failed to update favorite status" });
		}
	}
);

// DELETE /api/chat/:id - Delete a chat
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
	try {
		const { id: chatId } = req.params;

		if (!chatId) {
			return res.status(400).json({ error: "Chat ID is required" });
		}

		const userId = req.user?.id;

		// Ensure the chat belongs to the authenticated user
		const chat = await prisma.chat.findFirst({
			where: { id: chatId, userId },
		});

		if (!chat) {
			return res.status(404).json({ error: "Chat not found" });
		}

		// Delete the chat (messages will be cascade deleted if configured in schema)
		await prisma.chat.delete({
			where: {
				id: chatId,
			},
		});

		return res.status(200).json({
			message: "Chat deleted successfully",
			deletedChatId: chatId,
		});
	} catch (error) {
		console.error("Error deleting chat:", error);
		return res.status(500).json({ error: "Failed to delete chat" });
	}
});

export default router;
