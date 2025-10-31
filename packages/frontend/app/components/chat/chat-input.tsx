// import React, {
// 	useRef,
// 	memo,
// 	useCallback,
// 	useState,
// 	useEffect,
// 	useMemo,
// } from "react";

// import {
// 	PromptInput,
// 	PromptInputButton,
// 	PromptInputModelSelect,
// 	PromptInputModelSelectContent,
// 	PromptInputModelSelectItem,
// 	PromptInputModelSelectTrigger,
// 	PromptInputModelSelectValue,
// 	PromptInputSubmit,
// 	PromptInputTextarea,
// 	PromptInputToolbar,
// 	PromptInputTools,
// } from "~/components/ai/prompt-input";
// import { useDragAndDrop } from "~/hooks/useDragAndDrop";
// import { useFileUpload, type UploadedFile } from "~/hooks/useFileUpload";
// import { useChatForm, type ChatSubmitFunction } from "~/hooks/useChatForm";
// import { FilePreview } from "../FilePreview";
// import { DragOverlay } from "../DragOverlay";
// import { GlobeIcon, Option, Plus, Settings2 } from "lucide-react";
// import { agents, models } from "~/config/models";
// import { ErrorAlert } from "../ErrorAlert";
// import type { ChatStatus } from "ai";
// import { Switch } from "../ui/switch";
// import {
// 	createRpcClient,
// 	fetchAccountType,
// 	matchAddress,
// 	TOOLS,
// 	uniqueBy,
// 	type AccountIdentifierEnum,
// 	type ChatMode,
// } from "~/lib/solana";
// import { toast } from "sonner";
// import AddressTags from "./address-tags";

// interface ChatInputProps {
// 	status?: ChatStatus;
// 	onSubmit: ChatSubmitFunction;
// 	onError?: (error: string) => void;
// 	onSuccess?: () => void;
// 	// Optional initial values
// 	initialInput?: string;
// 	initialModel?: string;
// 	initialAgent?: string;
// 	initialAdditionalTools?: { name: string; active: boolean }[];
// }

// // Memoized FilePreview component
// const MemoizedFilePreview = memo(FilePreview);


// // Memoized Switch component for tools
// const ToolSwitch = memo<{
// 	tool: { name: string; active: boolean };
// 	onToggle: (name: string, checked: boolean) => void;
// }>(({ tool, onToggle }) => (
// 	<div className="flex items-center justify-between px-2 py-1.5">
// 		<span className="capitalize">{tool.name}</span>
// 		<Switch
// 			checked={tool.active}
// 			onCheckedChange={(checked) => onToggle(tool.name, checked)}
// 		/>
// 	</div>
// ));

// ToolSwitch.displayName = "ToolSwitch";
// export type UserAddress = {
// 	address: string;
// 	type: AccountIdentifierEnum;
// };

// const DEFAULT_MAX_ADDRESS = 2;

// const ChatInput: React.FC<ChatInputProps> = memo(
// 	({
// 		status,
// 		onSubmit,
// 		onError,
// 		onSuccess,
// 		// initialInput = "",
// 		// initialModel = "claude-3-5-sonnet-20241022",
// 		// initialAgent = "default",
// 		// initialAdditionalTools = [
// 		// 	{ name: "search", active: false },
// 		// 	{ name: "clipboard", active: false },
// 		// ],
// 	}) => {
// 		// File upload hook
// 		const [addresses, setAddresses] = useState<UserAddress[]>([]);
// 		const maxAddresses = 1 || DEFAULT_MAX_ADDRESS; //need to add dynamic

// 		const {
// 			uploadedFiles,
// 			error: fileError,
// 			handleFileUpload,
// 			removeFile,
// 			clearError: clearFileError,
// 			clearFiles,
// 		} = useFileUpload();

// 		// Chat form hook with submit logic from parent
// 		const {
// 			input,
// 			setInput,
// 			model,
// 			setModel,
// 			agent,
// 			setAgent,
// 			additionalTools,
// 			setClipboardActive,
// 			setSearchActive,
// 			isSubmitting,
// 			error: formError,
// 			handleSubmit,
// 			clearError: clearFormError,
// 			canSubmit,
// 		} = useChatForm({
// 			onSubmit,
// 			onError: onError || ((error) => console.error("Form error:", error)),
// 			onSuccess:
// 				onSuccess || (() => console.log("Chat submitted successfully!")),
// 			// initialInput,
// 			// initialModel,
// 			// initialAgent,
// 			// initialAdditionalTools,
// 		});

// 		const fileInputRef = useRef<HTMLInputElement>(null);

// 		// Memoize callbacks to prevent unnecessary re-renders
// 		const triggerFileInput = useCallback(() => {
// 			fileInputRef.current?.click();
// 		}, []);

// 		const handleFileInputChange = useCallback(
// 			(e: React.ChangeEvent<HTMLInputElement>) => {
// 				const files = e.target.files;
// 				if (files) {
// 					handleFileUpload(Array.from(files));
// 				}
// 				// Reset input value to allow selecting the same file again
// 				if (fileInputRef.current) {
// 					fileInputRef.current.value = "";
// 				}
// 			},
// 			[handleFileUpload]
// 		);

// 		const { isDragging, dragHandlers } = useDragAndDrop(handleFileUpload);

// 		// Memoize computed values
// 		const error = formError || fileError;
// 		const isSubmitDisabled = !canSubmit(uploadedFiles);

// 		const clearError = useCallback(() => {
// 			clearFormError();
// 			clearFileError();
// 		}, [clearFormError, clearFileError]);

// 		const handleFormSubmit = useCallback(
// 			(e: React.FormEvent) => {
// 				e.preventDefault();
// 				handleSubmit(uploadedFiles, clearFiles);
// 			},
// 			[handleSubmit, uploadedFiles, clearFiles]
// 		);

// 		const handleInputChange = useCallback(
// 			(e: React.ChangeEvent<HTMLTextAreaElement>) => {
// 				setInput(e.target.value);
// 			},
// 			[setInput]
// 		);
// 		const [isLoading, setIsLoading] = useState<boolean>(false);
// 		const textareaRef = useRef<HTMLTextAreaElement>(null);
// 		const rpcClient = useMemo(() => createRpcClient(), []);

// 		useEffect(() => {
// 			if (textareaRef.current && !isLoading) {
// 				textareaRef.current.focus();
// 			}
// 		}, [isLoading]);

// 		// Utility functions
// 		const validateAddressLimit = useCallback(
// 			(newAddressCount: number): boolean => {
// 				if (addresses.length + newAddressCount > maxAddresses) {
// 					toast.info(`Maximum of ${maxAddresses} addresses allowed`);
// 					return false;
// 				}
// 				return true;
// 			},
// 			[addresses.length, maxAddresses]
// 		);

// 		const filterAddressesByMode = useCallback(
// 			(
// 				addressList: UserAddress[],
// 				selectedMode: ChatMode | null
// 			): UserAddress[] => {
// 				if (!selectedMode?.requiredTokenTypes?.length) {
// 					return addressList;
// 				}

// 				const filtered = addressList.filter((addr) =>
// 					selectedMode.requiredTokenTypes?.includes(addr.type)
// 				);

// 				if (filtered.length === 0 && addressList.length > 0) {
// 					toast.error(
// 						`Selected mode requires specific token types: ${selectedMode.requiredTokenTypes.join(
// 							", "
// 						)}`
// 					);
// 				}

// 				return filtered;
// 			},
// 			[]
// 		);
// 		const handleDeleteAddress = useCallback((addressToDelete: string) => {
// 			setAddresses((prev) =>
// 				prev.filter((addr) => addr.address !== addressToDelete)
// 			);
// 		}, []);
// 		const fetchAddressInfo = useCallback(
// 			async (addressList: string[]): Promise<UserAddress[]> => {
// 				const results = await Promise.allSettled(
// 					addressList.map(async (address) => {
// 						const type = await fetchAccountType(rpcClient, address);
// 						if (!type) throw new Error("Invalid address type");
// 						return { address, type };
// 					})
// 				);

// 				const validAddresses: UserAddress[] = [];
// 				let hasErrors = false;

// 				results.forEach((result, index) => {
// 					if (result.status === "fulfilled") {
// 						validAddresses.push(result.value);
// 					} else {
// 						console.error(
// 							`Failed to fetch account type for ${addressList[index]}:`,
// 							result.reason
// 						);
// 						hasErrors = true;
// 					}
// 				});

// 				if (hasErrors) {
// 					toast.error("Some addresses could not be processed");
// 				}

// 				return validAddresses;
// 			},
// 			[rpcClient]
// 		);
// 		// Memoize tool toggle handler
// 		const handleToolToggle = useCallback(
// 			(name: string, checked: boolean) => {
// 				if (name === "search") {
// 					setSearchActive(checked);
// 				} else {
// 					setClipboardActive(checked);
// 				}
// 			},
// 			[setSearchActive, setClipboardActive]
// 		);

// 		const handleAddressPaste = async (
// 			event: React.ClipboardEvent<HTMLTextAreaElement>
// 		) => {
// 			event.preventDefault();

// 			const pastedText = event.clipboardData.getData("text").trim();
// 			if (!pastedText) return;

// 			const words = pastedText.split(/\s+/);
// 			const addressWords = uniqueBy(
// 				words.filter(matchAddress),
// 				(addr: string) => addr
// 			);
// 			const nonAddressWords = words.filter((word) => !matchAddress(word));

// 			// Validate address limit
// 			if (!validateAddressLimit(addressWords.length)) return;

// 			// Filter out already existing addresses
// 			const newAddresses = addressWords.filter(
// 				(addr: string) =>
// 					!addresses.some(
// 						(existing) => existing.address.toLowerCase() === addr.toLowerCase()
// 					)
// 			);

// 			if (newAddresses.length === 0 && nonAddressWords.length === 0) {
// 				toast.info("No new content to add");
// 				return;
// 			}

// 			setIsLoading(true);

// 			try {
// 				// Process new addresses
// 				if (newAddresses.length > 0) {
// 					const availableSlots = maxAddresses - addresses.length;
// 					const addressesToProcess = newAddresses.slice(0, availableSlots);

// 					const validAddresses = await fetchAddressInfo(addressesToProcess);
// 					const filteredAddresses = filterAddressesByMode(
// 						validAddresses,
// 						TOOLS[0]
// 					);

// 					setAddresses((prev) => [...prev, ...filteredAddresses]);
// 				}

// 				// Add non-address words to text
// 				if (nonAddressWords.length > 0) {
// 					const newText = nonAddressWords.join(" ");
// 					setInput((prev) => {
// 						const trimmed = prev.trim();
// 						return trimmed ? `${trimmed} ${newText}` : newText;
// 					});
// 				}
// 			} catch (error) {
// 				console.error("Error handling token paste:", error);
// 				toast.error("Failed to process pasted content");
// 			} finally {
// 				setIsLoading(false);
// 				textareaRef.current?.focus();
// 			}
// 		};

// 		return (
// 			<div>
// 				<input
// 					ref={fileInputRef}
// 					type="file"
// 					accept=".jpg,.jpeg,.png"
// 					multiple
// 					onChange={handleFileInputChange}
// 					className="hidden"
// 				/>

// 				{/* Main Content */}
// 				<div className="max-w-4xl mx-auto px-4">
// 					{/* Error Alert */}
// 					{/* <MemoizedErrorAlert error={error} onClear={clearError} /> */}

// 					{/* Chat Form */}
// 					<div className="max-w-4xl mx-auto">
// 						<PromptInput
// 							{...dragHandlers}
// 							className={`relative transition-all duration-200 bg-accent ${
// 								isDragging
// 									? "ring-2 ring-blue-400 ring-offset-2 ring-offset-background shadow-none "
// 									: "rounded-3xl "
// 							}`}
// 							onSubmit={handleFormSubmit}
// 						>
// 							{/* File Preview Section */}
// 							<MemoizedFilePreview
// 								uploadedFiles={uploadedFiles}
// 								onRemoveFile={removeFile}
// 								isSubmitting={isSubmitting}
// 							/>
// 							{addresses.length > 0 && (
// 								<AddressTags
// 									addressTags={addresses}
// 									onDelete={handleDeleteAddress}
// 								/>
// 							)}
// 							<DragOverlay isDragging={isDragging} />
// 							{/* Text Input */}
// 							<PromptInputTextarea
// 								ref={textareaRef}
// 								onPaste={handleAddressPaste}
// 								value={input}
// 								onChange={handleInputChange}
// 								placeholder={
// 									uploadedFiles.length > 0
// 										? "Add a message about your images (optional)..."
// 										: "Tell me about your day, ask a question, or share an idea..."
// 								}
// 								className="min-h-[60px] text-lg placeholder:text-base resize-none border-0 focus:ring-0 bg-transparent placeholder:text-accent-foreground/50"
// 								disabled={isSubmitting || isLoading}
// 							/>
// 							{/* Toolbar */}
// 							<PromptInputToolbar className="gap-2">
// 								<PromptInputTools>
// 									<PromptInputButton
// 										onClick={triggerFileInput}
// 										disabled={isSubmitting}
// 										title="Upload images"
// 									>
// 										<Plus size={16} />
// 									</PromptInputButton>
// 									<PromptInputModelSelect disabled={isSubmitting}>
// 										<PromptInputModelSelectTrigger showDropdownIcon={false}>
// 											<Settings2 />
// 										</PromptInputModelSelectTrigger>
// 										<PromptInputModelSelectContent>
// 											{agents.map((agentOption) => (
// 												<PromptInputModelSelectItem
// 													key={agentOption.value}
// 													value={agentOption.value}
// 													onChange={() => setAgent(agentOption.name)}
// 												>
// 													{agentOption.name}
// 												</PromptInputModelSelectItem>
// 											))}
// 											{additionalTools.map((tool) => (
// 												<ToolSwitch
// 													key={tool.name}
// 													tool={tool}
// 													onToggle={handleToolToggle}
// 												/>
// 											))}
// 										</PromptInputModelSelectContent>
// 									</PromptInputModelSelect>

// 									{/* Model Selection */}
// 									<PromptInputModelSelect
// 										onValueChange={setModel}
// 										value={model}
// 										disabled={isSubmitting}
// 									>
// 										<PromptInputModelSelectTrigger>
// 											<PromptInputModelSelectValue />
// 										</PromptInputModelSelectTrigger>
// 										<PromptInputModelSelectContent>
// 											{models.map((modelOption) => (
// 												<PromptInputModelSelectItem
// 													key={modelOption.value}
// 													value={modelOption.value}
// 												>
// 													{modelOption.name}
// 												</PromptInputModelSelectItem>
// 											))}
// 										</PromptInputModelSelectContent>
// 									</PromptInputModelSelect>
// 								</PromptInputTools>

// 								{/* Submit Button */}
// 								<PromptInputSubmit
// 									size={"icon"}
// 									className="rounded-full"
// 									disabled={isSubmitDisabled}
// 									status={
// 										status ? status : isSubmitting ? "submitted" : "ready"
// 									}
// 								/>
// 							</PromptInputToolbar>
// 						</PromptInput>

// 						{/* Character Count */}
// 						<div className="mt-2 text-right">
// 							<span className="text-xs text-slate-400">
// 								{input.length}/1000
// 								{uploadedFiles.length > 0 && (
// 									<span className="ml-2">
// 										• {uploadedFiles.length} image
// 										{uploadedFiles.length !== 1 ? "s" : ""}
// 									</span>
// 								)}
// 							</span>
// 						</div>
// 					</div>
// 				</div>
// 			</div>
// 		);
// 	}
// );

// ChatInput.displayName = "ChatInput";

// export default ChatInput;
