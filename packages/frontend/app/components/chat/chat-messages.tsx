import type {
	ChatStatus,
	UIMessage,
	RetryError,
	ToolCallRepairError,
	UIMessagePart,
} from "ai";
import React from "react";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "~/components/ai/conversation";
import { Message, MessageContent } from "~/components/ai/message";
import { Response } from "~/components/ai/response";
import {
	Source,
	Sources,
	SourcesContent,
	SourcesTrigger,
} from "~/components/ai/source";
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "~/components/ai/reasoning";
import { Loader } from "~/components/ai/loader";
import TokenAnalyserTool from "../../features/chat/agents/token-tool";
import { useChat } from "@ai-sdk/react";
import { useSharedChatContext } from "~/wrapper/chat-provider";

interface MessagesProps {
	messages: UIMessage[];
	status: ChatStatus;
	error?: Error;
	clearError: () => void;
	id: string;
}

// Renders “source-url” parts for an assistant message
const MessageSources: React.FC<{ message: UIMessage }> = ({ message }) => {
	const sources = message.parts.filter((p) => p.type === "source-url");
	if (sources.length === 0) return null;

	return (
		<Sources>
			<SourcesTrigger count={sources.length} />
			<SourcesContent>
				{sources.map((part, i) => (
					<Source
						key={`${message.id}-src-${i}`}
						href={part.url}
						title={part.url}
					/>
				))}
			</SourcesContent>
		</Sources>
	);
};

// Renders a single part (text, reasoning, file, etc.)
const MessagePartRenderer: React.FC<{
	message: UIMessage;
	part: UIMessagePart<any, any>;
	index: number;
	status: string;
}> = ({ message, part, index, status }) => {
	console.log("MESSAGE PART", part);

	if (part.type === "text") {
		return (
			<Response className="px-4 py-3 " key={`${message.id}-text-${index}`}>
				{part.text}
			</Response>
		);
	}

	if (part.type === "reasoning") {
		return (
			<Reasoning
				key={`${message.id}-reasoning-${index}`}
				className="w-full"
				isStreaming={status === "streaming"}
			>
				<ReasoningTrigger />
				<ReasoningContent>{part.text}</ReasoningContent>
			</Reasoning>
		);
	}

	if (part.type === "file") {
		return (
			<div key={`${message.id}-file-${index}`}>
				<div
					data-testid={`message-attachments`}
					className="flex flex-row justify-end gap-2"
				>
					<img
						src={part.url}
						alt={part.filename || "attachment"}
						className="aspect-auto max-w-44"
					/>
				</div>
			</div>
		);
	}

	// if (part.type === "data-token-tool") {
	// 	return (
	// 		<div>
	// 			<pre>{JSON.stringify(part.data, null, 2)}</pre>
	// 		</div>
	// 	);
	// }
	// if(part.type==="data-token-tool"){
	// 	return <TokenAnalyserTool part={part}/>
	// }
	// if (part.type === "tool-tokentool") {
	// 	return (
	// 		<div>
	// 			<p>token tool result</p>
	// 			<pre>{JSON.stringify(part, null, 2)}</pre>
	// 		</div>
	// 	);
	// }

	// If new type added later (e.g. tool result), you can extend here
	return null;
};

const ChatMessages: React.FC<MessagesProps> = ({
	messages,
	status,
	error,
	clearError,
	id,
}) => {
	const { data: chatData } = useSharedChatContext();
	console.log("message_data", chatData);
	// console.log("message status ", status);

	return (
		<Conversation className="h-full">
			<ConversationContent className="max-w-3xl mx-auto w-full mb-24">
				{messages.map((message) => {
					// Prefer per-message tool/data parts when available.
					// Avoid showing the token analyser on user messages by
					// only rendering it for assistant messages that include
					// the tool/data parts.
					const tokenDataPart = message.parts.find(
						(p) => p.type === "data-token-tool"
					);
					const toolResultPart = message.parts.find(
						(p) => p.type === "tool-tokentool"
					);

					return (
						<div key={message.id}>
							{message.role === "assistant" && (
								<MessageSources message={message} />
							)}

							<Message from={message.role}>
								<MessageContent className=" font-normal text-base leading-6 tracking-[-0.011em]">
									{message.parts.map((part, idx) => (
										<MessagePartRenderer
											key={`${message.id}-part-${idx}`}
											message={message}
											part={part}
											index={idx}
											status={status}
										/>
									))}

									{/* Render TokenAnalyserTool only for assistant messages
										and only when there is relevant tool/data present.
										Fall back to shared chatData only if a per-message
										data part isn't available and the message is
										from the assistant. */}
									{message.role === "assistant" &&
										(tokenDataPart || toolResultPart) && (
											<TokenAnalyserTool
												part={tokenDataPart ?? chatData}
												result={toolResultPart}
											/>
										)}
								</MessageContent>
							</Message>
						</div>
					);
				})}

				{status === "submitted" && <Loader />}

				{error && (
					<div className="border-2 border-red-200 rounded-lg p-4 bg-red-50 mb-4">
						<div className="flex items-center gap-2 mb-2">
							<span className="text-lg">⚠️</span>
							<span className="font-medium">Error</span>
						</div>
						<p className="text-red-700 mb-2">{error.message}</p>
						<button
							onClick={clearError}
							className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
						>
							Clear Error
						</button>
					</div>
				)}
			</ConversationContent>

			<ConversationScrollButton />
		</Conversation>
	);
};

export default ChatMessages;
{
	/* {message.parts.map((part, index) => {
							// if (part.type === "data-tool") {

							// }
							if (part.type === "data-tool") {
								const data = part.data;

								// Handle different step types
								if (data.step === "complete") {
									return (
										<div key={index} className="mb-4">
											<FinalSummary
												finalAnalysis={data.finalAnalysis}
												totalScore={data.totalScore}
												maxScore={data.maxScore}
												percentage={data.percentage}
												category={data.category}
												riskLevel={data.riskLevel}
											/>
										</div>
									);
								}

								if (data.step === "stopped") {
									return (
										<div key={index} className="mb-4">
											<div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
												<div className="flex items-center gap-2 mb-2">
													<span className="text-lg">⏸️</span>
													<span className="font-medium">
														Analysis Stopped Early
													</span>
												</div>
												<p className="text-yellow-700">{data.reason}</p>
												{data.finalScore && data.maxScore && (
													<div className="mt-2 text-sm">
														Partial Score: {data.finalScore}/{data.maxScore} (
														{Math.round(
															(data.finalScore / data.maxScore) * 100
														)}
														%)
													</div>
												)}
											</div>
										</div>
									);
								}

								if (data.step === "error") {
									return (
										<div key={index} className="mb-4">
											<div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
												<div className="flex items-center gap-2 mb-2">
													<span className="text-lg">❌</span>
													<span className="font-medium">Analysis Error</span>
												</div>
												<p className="text-red-700">{data.message}</p>
											</div>
										</div>
									);
								}

								// Regular analysis steps
								return (
									<div key={index}>
										<AnalysisStep
											step={data.step}
											status={data.status}
											data={data.data}
											score={data.score}
											maxScore={data.maxScore}
											message={data.message}
											progress={data.progress}
											totalSteps={data.totalSteps}
										/>
									</div>
								);
							}

							return null;
						})} */
}
