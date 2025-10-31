import React, { createContext, useContext, useState, useCallback } from "react";
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

type ChatState = {
	chat: Chat<UIMessage> | null;
	setChat: (chat: Chat<UIMessage>) => void;
	createNewChat: () => Chat<UIMessage>;
	createChatFromExisting: (
		id: string,
		messages: UIMessage[]
	) => Chat<UIMessage>;
	data: any;
	clearData: () => void;
};

const ChatContext = createContext<ChatState | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
	const [chat, setChat] = useState<Chat<UIMessage> | null>(null);
	const [data, setData] = useState(null);
	// Shared callback handlers
	const handleData = useCallback((dataPart: any) => {
		setData(dataPart);
		
		console.log("Data received:", dataPart);
		console.log(data,"data");
	}, []);
	const clearData = () => setData(null);
	const handleFinish = useCallback(({ message }: { message: any }) => {
		console.log("Message finished:", message);
	}, []);

	const createNewChat = useCallback(() => {
		const newChat = new Chat<UIMessage>({
			transport: new DefaultChatTransport({
				api: "http://localhost:3000/api/chat",
				credentials: "include",
			}),
			onData: handleData,
			onFinish: handleFinish,
		});
		setChat(newChat);
		return newChat;
	}, [handleData, handleFinish]);

	const createChatFromExisting = useCallback(
		(id: string, messages: UIMessage[]) => {
			const existingChat = new Chat<UIMessage>({
				id,
				messages,
				transport: new DefaultChatTransport({
					api: "http://localhost:3000/api/chat",
					credentials: "include",
				}),
				onData: handleData,
				onFinish: handleFinish,
			});
			setChat(existingChat);
			return existingChat;
		},
		[handleData, handleFinish]
	);

	return (
		<ChatContext.Provider
			value={{
				chat,
				setChat,
				createNewChat,
				createChatFromExisting,
				data,
				clearData,
			}}
		>
			{children}
		</ChatContext.Provider>
	);
}

export function useSharedChatContext() {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useSharedChatContext must be used within ChatProvider");
	}
	return context;
}
