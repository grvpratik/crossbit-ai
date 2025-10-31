import { Plus, Send, Settings2 } from "lucide-react";
import React, { memo, useCallback, useEffect, useRef } from "react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
	PromptInput,
	PromptInputButton,
	PromptInputModelSelect,
	PromptInputModelSelectContent,
	PromptInputModelSelectItem,
	PromptInputModelSelectTrigger,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from "~/components/ai/prompt-input";
import { Switch } from "~/components/ui/switch";
import { SelectSeparator } from "~/components/ui/select";
import { agents } from "~/config/models";
import { useFileUpload } from "~/hooks/useFileUpload";
import { useDragAndDrop } from "~/hooks/useDragAndDrop";

// Import new modular hooks
import { useChatForm } from "~/hooks/useChatForm";
import { useAddressManagement } from "./hooks/useAddressManagement";
import { useToolManagement } from "./hooks/useToolManagement";
import { useChatLayout } from "./hooks/useChatLayout";
import { useFileInput } from "./hooks/useFileInput";
import { FilePreview } from "~/components/FilePreview";
import { DragOverlay } from "~/components/DragOverlay";
import AddressTags from "~/components/chat/address-tags";
import type { ChatStatus } from "ai";

interface ChatInputAreaProps {
	onSubmit: any;
	status:ChatStatus
	maxAddresses?: number;
}

// Tool Switch Component
const ToolSwitch = memo<{
	tool: { name: string; active: boolean };
	disabled?: boolean;
	onToggle: (name: string, checked: boolean) => void;
}>(({ tool, disabled, onToggle }) => (
	<div className="flex items-center justify-between px-2 py-1.5">
		<span className="capitalize text-sm">{tool.name}</span>
		<Switch
			checked={tool.active}
			disabled={disabled}
			onCheckedChange={(checked) => onToggle(tool.name, checked)}
		/>
	</div>
));

ToolSwitch.displayName = "ToolSwitch";

const ChatInputArea: React.FC<ChatInputAreaProps> = memo(
	({ onSubmit,status, maxAddresses = 2 }) => {
		const textareaRef = useRef<HTMLTextAreaElement>(null);

		// Chat form hook
		const {
			input,
			setInput,
			agent,
			setAgent,
			handleSubmit,
			canSubmit,
			additionalTools,
			handleToolToggle,
			isToolDisabledByAgent,
		} = useChatForm({ onSubmit });

		// File upload hook
		const { uploadedFiles, handleFileUpload, removeFile, clearFiles } =
			useFileUpload();

		// Address management hook
		const {
			addresses,
			isLoading: isLoadingAddresses,
			deleteAddress,
			clearAddresses,
			handlePaste: handleAddressPaste,
		} = useAddressManagement({ maxAddresses });

		
		// File input hook
		const { inputProps, triggerFileInput } = useFileInput({
			accept: ".jpg,.jpeg,.png",
			multiple: true,
			onFilesSelected: handleFileUpload,
		});

		// Drag and drop hook
		const { isDragging, dragHandlers } = useDragAndDrop(handleFileUpload);

		// Layout hook
		const { isVertical, gridClasses, statusText, shouldShowStatus } =
			useChatLayout({
				input,
				agent,
				uploadedFiles,
				addresses,
				threshold: 30,
			});

		// Handle paste event in textarea
		const handleTextareaPaste = useCallback(
			async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
				event.preventDefault();
				const pastedText = event.clipboardData.getData("text");

				await handleAddressPaste(pastedText, (extractedText) => {
					// Add non-address text to input
					setInput((prev) => {
						const trimmed = prev.trim();
						return trimmed ? `${trimmed} ${extractedText}` : extractedText;
					});
				});
			},
			[handleAddressPaste, setInput]
		);

		// Form submission
		const handleFormSubmit = useCallback(
			(e: React.FormEvent) => {
				e.preventDefault();
				handleSubmit(
					uploadedFiles,
					addresses,

					clearFiles,
					clearAddresses
				);
			},
			[handleSubmit, uploadedFiles, addresses, clearFiles, clearAddresses]
		);

		// Focus management
		useEffect(() => {
			if (textareaRef.current && !isLoadingAddresses) {
				textareaRef.current.focus();
			}
		}, [isLoadingAddresses]);
		//console.log("uploadedFiles", uploadedFiles);
		// Check if submit is disabled
		const isSubmitDisabled = !canSubmit(uploadedFiles, addresses);

		return (
			<div className="sticky z-50 w-full bottom-0  flex-col flex items-center justify-center">
				
				<div className="max-w-3xl mx-auto w-full px-2 lg:px-4 pb-1">
					<input {...inputProps} />

					<PromptInput
						onSubmit={handleFormSubmit}
						{...dragHandlers}
						className={cn(
							"bg-secondary w-full p-1.5 relative ",
							gridClasses.container,
							isDragging &&
								"ring-2 ring-blue-400 ring-offset-2 ring-offset-background shadow-none"
						)}
					>
						<DragOverlay isDragging={isDragging} />

						{/* File Preview */}
						{uploadedFiles.length > 0 && (
							<div className={gridClasses.filePreview}>
								<FilePreview
									uploadedFiles={uploadedFiles}
									onRemoveFile={removeFile}
									isSubmitting={false}
								/>
							</div>
						)}

						{/* Address Tags */}
						{addresses.length > 0 && (
							<div className={gridClasses.addressTags}>
								<AddressTags addressTags={addresses} onDelete={deleteAddress} />
							</div>
						)}

						{/* Toolbar - Left */}
						<PromptInputToolbar
							className={cn(
								"flex justify-start items-center p-0",
								gridClasses.toolbarLeft
							)}
						>
							<PromptInputTools>
								<PromptInputModelSelect
									disabled={false}
									value={agent}
									onValueChange={setAgent}
								>
									<PromptInputModelSelectTrigger
										showDropdownIcon={false}
										className="rounded-full  p-0 size-9 flex items-center justify-center"
									>
										<Settings2 className="size-4 " />
									</PromptInputModelSelectTrigger>
									<PromptInputModelSelectContent>
										{agents.map((agentOption) => (
											<PromptInputModelSelectItem
												key={agentOption.value}
												value={agentOption.value}
											>
												{agentOption.name}
											</PromptInputModelSelectItem>
										))}
										<SelectSeparator />
										{additionalTools.map((tool) => (
											<ToolSwitch
												key={tool.name}
												tool={tool}
												disabled={isToolDisabledByAgent(tool.name)}
												onToggle={handleToolToggle}
											/>
										))}
									</PromptInputModelSelectContent>
								</PromptInputModelSelect>
								{agent && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setAgent("")}
										className="text-xs"
									>
										Clear {agent}
									</Button>
								)}
							</PromptInputTools>
						</PromptInputToolbar>

						{/* Textarea */}
						<PromptInputTextarea
							ref={textareaRef}
							className={cn(
								"w-full min-h-0 p-1 md:text-base",
								gridClasses.textarea
							)}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onPaste={handleTextareaPaste}
							placeholder="Ask or Paste address"
							disabled={isLoadingAddresses}
						/>

						{/* Toolbar - Right */}
						<PromptInputToolbar
							className={cn(
								"flex items-center justify-end p-0",
								gridClasses.toolbarRight
							)}
						>
							<PromptInputButton
								type="button"
								onClick={triggerFileInput}
								disabled={false}
								title="Upload images"
							>
								<Plus size={16} />
							</PromptInputButton>

							<Button
								type="submit"
								size="icon"
								className=" rounded-full"
								disabled={isSubmitDisabled}
							>
								<Send className="size-4" />
							</Button>
						</PromptInputToolbar>
					</PromptInput>

					{/* Status Text */}
					{/* {shouldShowStatus && (
						<div className="mt-2 text-right">
							<span className="text-xs text-slate-400">{statusText}</span>
						</div>
					)} */}
				</div>
			</div>
		);
	}
);

ChatInputArea.displayName = "ChatInputArea";

export default ChatInputArea;
