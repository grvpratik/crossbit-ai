import { ProtectedRoute } from "~/wrapper/auth-provider";
import type { Route } from "./+types/chat-new";

import React, { useEffect, useState } from "react";

import ChatInputArea from "~/features/chat/chat-input";
import { useSharedChatContext } from "~/wrapper/chat-provider";
import { Chat, useChat, type UIMessage } from "@ai-sdk/react";
import ChatClient from "~/features/chat/chat-client";
import { useLocation } from "react-router";
import { generateId } from "ai";
export function meta({}: Route.MetaArgs) {
	return [
		{ title: "New Chat" },
		{ name: "description", content: "Start a new conversation" },
	];
}

export default function ChatNew() {
	

	const { chat, createNewChat } = useSharedChatContext();
	const location = useLocation();
	useEffect(() => {
		//if (!chat) {
			createNewChat();
	//	}
	}, []);

	return (
		<ProtectedRoute>
			{chat && <ChatClient chat={chat} title="new chat" />}
		</ProtectedRoute>
	);
}
