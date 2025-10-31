// import { Plus, Send, Settings2 } from "lucide-react";
// import React, {
// 	memo,
// 	useCallback,
// 	useEffect,
// 	useRef,
// 	useState,
// 	useMemo,
// } from "react";
// import { cn } from "~/lib/utils";
// import { Button } from "../ui/button";
// import {
// 	PromptInput,
// 	PromptInputButton,
// 	PromptInputModelSelect,
// 	PromptInputModelSelectContent,
// 	PromptInputModelSelectItem,
// 	PromptInputModelSelectTrigger,
// 	PromptInputTextarea,
// 	PromptInputToolbar,
// 	PromptInputTools,
// } from "../ai/prompt-input";
// import { Switch } from "../ui/switch";
// import { SelectSeparator } from "../ui/select";
// import { useChatForm } from "~/hooks/useChatForm";
// import { agents } from "~/config/models";
// import { useFileUpload } from "~/hooks/useFileUpload";
// import { useDragAndDrop } from "~/hooks/useDragAndDrop";
// import { DragOverlay } from "../DragOverlay";
// import { FilePreview } from "../FilePreview";
// import AddressTags from "./address-tags";
// import { toast } from "sonner";
// import {
// 	createRpcClient,
// 	fetchAccountType,
// 	matchAddress,
// 	uniqueBy,
// 	type AccountIdentifierEnum,
// } from "~/lib/solana";

// export type UserAddress = {
// 	address: string;
// 	type: AccountIdentifierEnum;
// };

// interface ChatInputAreaProps {
// 	onSubmit: any;
// 	maxAddresses?: number;
// }

// const ToolSwitch = memo<{
// 	tool: { name: string; active: boolean };
// 	disabled?: boolean;
// 	onToggle: (name: string, checked: boolean) => void;
// }>(({ tool, disabled, onToggle }) => (
// 	<div className="flex items-center justify-between px-2 py-1.5">
// 		<span className="capitalize text-sm">{tool.name}</span>
// 		<Switch
// 			checked={tool.active}
// 			disabled={disabled}
// 			onCheckedChange={(checked) => onToggle(tool.name, checked)}
// 		/>
// 	</div>
// ));

// ToolSwitch.displayName = "ToolSwitch";

// const ChatInputArea: React.FC<ChatInputAreaProps> = memo(
// 	({ onSubmit, maxAddresses = 2 }) => {
// 		const {
// 			input,
// 			setInput,
// 			agent,
// 			setAgent,
// 			handleSubmit,
// 			AgentTools,
// 			userSelectedTools,
// 			handleToolToggle,
// 			allToolNames,
// 		} = useChatForm({ onSubmit });

// 		// File upload
// 		const {
// 			uploadedFiles,
// 			error: fileError,
// 			handleFileUpload,
// 			removeFile,
// 			clearFiles,
// 		} = useFileUpload();

// 		const fileInputRef = useRef<HTMLInputElement>(null);
// 		const textareaRef = useRef<HTMLTextAreaElement>(null);

// 		// Address management
// 		const [addresses, setAddresses] = useState<UserAddress[]>([]);
// 		const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
// 		const rpcClient = useMemo(() => createRpcClient(), []);

// 		// Drag and drop
// 		const { isDragging, dragHandlers } = useDragAndDrop(handleFileUpload);

// 		// Layout calculation
// 		const THRESHOLD = 30;
// 		const isVertical =
// 			input.length >= THRESHOLD ||
// 			agent ||
// 			uploadedFiles.length > 0 ||
// 			addresses.length > 0;

// 		// File input handlers
// 		const triggerFileInput = useCallback(() => {
// 			fileInputRef.current?.click();
// 		}, []);

// 		const handleFileInputChange = useCallback(
// 			(e: React.ChangeEvent<HTMLInputElement>) => {
// 				const files = e.target.files;
// 				if (files) {
// 					handleFileUpload(Array.from(files));
// 				}
// 				if (fileInputRef.current) {
// 					fileInputRef.current.value = "";
// 				}
// 			},
// 			[handleFileUpload]
// 		);

// 		// Address handlers
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

// 		const handleAddressPaste = useCallback(
// 			async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
// 				event.preventDefault();

// 				const pastedText = event.clipboardData.getData("text").trim();
// 				if (!pastedText) return;

// 				const words = pastedText.split(/\s+/);
// 				const addressWords = uniqueBy(
// 					words.filter(matchAddress),
// 					(addr: string) => addr
// 				);
// 				const nonAddressWords = words.filter((word) => !matchAddress(word));

// 				// Validate address limit
// 				if (
// 					addressWords.length > 0 &&
// 					!validateAddressLimit(addressWords.length)
// 				) {
// 					return;
// 				}

// 				// Filter out existing addresses
// 				const newAddresses = addressWords.filter(
// 					(addr: string) =>
// 						!addresses.some(
// 							(existing) =>
// 								existing.address.toLowerCase() === addr.toLowerCase()
// 						)
// 				);

// 				if (newAddresses.length === 0 && nonAddressWords.length === 0) {
// 					toast.info("No new content to add");
// 					return;
// 				}

// 				setIsLoadingAddresses(true);

// 				try {
// 					// Process new addresses
// 					if (newAddresses.length > 0) {
// 						const availableSlots = maxAddresses - addresses.length;
// 						const addressesToProcess = newAddresses.slice(0, availableSlots);
// 						const validAddresses = await fetchAddressInfo(addressesToProcess);
// 						setAddresses((prev) => [...prev, ...validAddresses]);
// 					}

// 					// Add non-address words to text
// 					if (nonAddressWords.length > 0) {
// 						const newText = nonAddressWords.join(" ");
// 						setInput((prev) => {
// 							const trimmed = prev.trim();
// 							return trimmed ? `${trimmed} ${newText}` : newText;
// 						});
// 					}
// 				} catch (error) {
// 					console.error("Error handling address paste:", error);
// 					toast.error("Failed to process pasted content");
// 				} finally {
// 					setIsLoadingAddresses(false);
// 					textareaRef.current?.focus();
// 				}
// 			},
// 			[
// 				addresses,
// 				maxAddresses,
// 				validateAddressLimit,
// 				fetchAddressInfo,
// 				setInput,
// 			]
// 		);

// 		const handleDeleteAddress = useCallback((addressToDelete: string) => {
// 			setAddresses((prev) =>
// 				prev.filter((addr) => addr.address !== addressToDelete)
// 			);
// 		}, []);

// 		// Form submission
// 		const handleFormSubmit = useCallback(
// 			(e: React.FormEvent) => {
// 				e.preventDefault();
// 				handleSubmit(uploadedFiles, addresses, clearFiles, () =>
// 					setAddresses([])
// 				);
// 			},
// 			[handleSubmit, uploadedFiles, addresses, clearFiles]
// 		);

// 		// Additional tools calculation
// 		const agentToolNames = AgentTools[agent] || [];
// 		const additionalTools = allToolNames.map((name) => {
// 			const isAgentTool = agentToolNames.includes(name);
// 			const isUserSelected = userSelectedTools.includes(name);
// 			return {
// 				name,
// 				active: isAgentTool || isUserSelected,
// 			};
// 		});

// 		// Focus management
// 		useEffect(() => {
// 			if (textareaRef.current && !isLoadingAddresses) {
// 				textareaRef.current.focus();
// 			}
// 		}, [isLoadingAddresses]);

// 		return (
// 			<div className="fixed max-w-2xl w-full mx-auto bottom-16 lg:bottom-4 px-4">
// 				<input
// 					ref={fileInputRef}
// 					type="file"
// 					accept=".jpg,.jpeg,.png"
// 					multiple
// 					onChange={handleFileInputChange}
// 					className="hidden"
// 				/>
// 				<form onSubmit={handleFormSubmit}>
// 					<PromptInput
// 						{...dragHandlers}
// 						className={cn(
// 							"bg-secondary w-full p-1 relative ",
// 							isVertical
// 								? "grid-cols-6 grid-rows-[auto,auto,1fr,auto] rounded-2xl grid h-auto"
// 								: "grid-cols-6 grid-rows-1 rounded-full flex",
// 							isDragging
// 								? "ring-2 ring-blue-400 ring-offset-2 ring-offset-background shadow-none"
// 								: ""
// 						)}
// 					>
// 						{/* <DragOverlay isDragging={isDragging} /> */}

// 						{/* File Preview */}
// 						{uploadedFiles.length > 0 && (
// 							<div className="col-span-6 row-start-1">
// 								<FilePreview
// 									uploadedFiles={uploadedFiles}
// 									onRemoveFile={removeFile}
// 									isSubmitting={false}
// 								/>
// 							</div>
// 						)}

// 						{/* Address Tags */}
// 						{addresses.length > 0 && (
// 							<div
// 								className={cn(
// 									"col-span-6",
// 									uploadedFiles.length > 0 ? "row-start-2" : "row-start-1"
// 								)}
// 							>
// 								<AddressTags
// 									addressTags={addresses}
// 									onDelete={handleDeleteAddress}
// 								/>
// 							</div>
// 						)}

// 						{/* Toolbar - Left */}
// 						<PromptInputToolbar
// 							className={cn(
// 								"flex justify-start items-center p-0",
// 								isVertical
// 									? `col-start-1 row-start-${
// 											uploadedFiles.length > 0 || addresses.length > 0
// 												? "4"
// 												: "3"
// 									  }`
// 									: "col-start-1"
// 							)}
// 						>
// 							<PromptInputTools>
// 								<PromptInputModelSelect
// 									disabled={false}
// 									value={agent}
// 									onValueChange={setAgent}
// 								>
// 									<PromptInputModelSelectTrigger
// 										showDropdownIcon={false}
// 										className="rounded-full bg-amber-200 p-0 size-9 flex items-center justify-center"
// 									>
// 										<Settings2 className="size-4" />
// 									</PromptInputModelSelectTrigger>
// 									<PromptInputModelSelectContent>
// 										{agents.map((agentOption) => (
// 											<PromptInputModelSelectItem
// 												key={agentOption.value}
// 												value={agentOption.value}
// 											>
// 												{agentOption.name}
// 											</PromptInputModelSelectItem>
// 										))}
// 										<SelectSeparator />
// 										{additionalTools.map((tool) => (
// 											<ToolSwitch
// 												key={tool.name}
// 												tool={tool}
// 												disabled={AgentTools[agent]?.includes(tool.name)}
// 												onToggle={handleToolToggle}
// 											/>
// 										))}
// 									</PromptInputModelSelectContent>
// 								</PromptInputModelSelect>
// 								{agent && (
// 									<Button
// 										type="button"
// 										variant="ghost"
// 										size="sm"
// 										onClick={() => setAgent("")}
// 										className="text-xs"
// 									>
// 										Clear {agent}
// 									</Button>
// 								)}
// 							</PromptInputTools>
// 						</PromptInputToolbar>

// 						{/* Textarea */}
// 						<PromptInputTextarea
// 							ref={textareaRef}
// 							className={cn(
// 								"w-full min-h-0 p-1 md:text-base",
// 								isVertical
// 									? `col-span-6 row-start-${
// 											uploadedFiles.length > 0 || addresses.length > 0
// 												? "3"
// 												: "2"
// 									  } min-h-12`
// 									: "col-span-4 resize-none flex-1 overflow-hidden"
// 							)}
// 							value={input}
// 							onChange={(e) => setInput(e.target.value)}
// 							onPaste={handleAddressPaste}
// 							placeholder="Ask or Paste address"
// 							disabled={isLoadingAddresses}
// 						/>

// 						{/* Toolbar - Right */}
// 						<PromptInputToolbar
// 							className={cn(
// 								"flex items-center justify-end p-0",
// 								isVertical
// 									? `col-start-6 row-start-${
// 											uploadedFiles.length > 0 || addresses.length > 0
// 												? "4"
// 												: "3"
// 									  }`
// 									: "col-span-1 col-start-6"
// 							)}
// 						>
// 							<PromptInputButton
// 								type="button"
// 								onClick={triggerFileInput}
// 								disabled={false}
// 								title="Upload images"
// 							>
// 								<Plus size={16} />
// 							</PromptInputButton>
// 							<Button
// 								type="submit"
// 								size="icon"
// 								className="bg-amber-200 rounded-full"
// 								disabled={
// 									!input.trim() &&
// 									uploadedFiles.length === 0 &&
// 									addresses.length === 0
// 								}
// 							>
// 								<Send className="size-4" />
// 							</Button>
// 						</PromptInputToolbar>
// 					</PromptInput>
// 				</form>

// 				{/* Character Count */}
// 				{isVertical && (
// 					<div className="mt-2 text-right">
// 						<span className="text-xs text-slate-400">
// 							{input.length} characters
// 							{uploadedFiles.length > 0 &&
// 								` • ${uploadedFiles.length} file${
// 									uploadedFiles.length !== 1 ? "s" : ""
// 								}`}
// 							{addresses.length > 0 &&
// 								` • ${addresses.length} address${
// 									addresses.length !== 1 ? "es" : ""
// 								}`}
// 						</span>
// 					</div>
// 				)}
// 			</div>
// 		);
// 	}
// );

// ChatInputArea.displayName = "ChatInputArea";

// export default ChatInputArea;
