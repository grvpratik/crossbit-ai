import { useState, useCallback } from "react";
import type { UploadedFile } from "~/types/fileUpload";
import { getDefaultModel, getDefaultAgent } from "~/config/models";

export type UserAddress = {
	address: string;
	type: string;
};

// Submit function type that consumers will implement
export type ChatSubmitFunction = (data: {
	input: string;
	model: string;
	agent: string;
	uploadedFiles: UploadedFile[];
	addresses: UserAddress[];
	additionalTools: { name: string; active: boolean }[];
	// Utilities for cleanup
	clearInput: () => void;
	clearFiles?: () => void;
	clearAddresses?: () => void;
	resetForm: () => void;
}) => Promise<void> | void;

interface UseChatFormOptions {
	onSubmit: ChatSubmitFunction;
	onError?: (error: string) => void;
	onSuccess?: () => void;
	initialInput?: string;
	initialModel?: string;
	initialAgent?: string;
}

// Agent-specific tool configurations
const AGENT_TOOLS: Record<string, string[]> = {
	"token-research": ["clipboard"],
	"code-assistant": ["search"],
	// Add more agent configurations as needed
};

// All available tools
const ALL_TOOLS = ["search", "clipboard"] as const;

export const useChatForm = ({
	onSubmit,
	onError,
	onSuccess,
	initialInput = "",
	initialModel,
	initialAgent = "",
}: UseChatFormOptions) => {
	// Core form state
	const [input, setInput] = useState(initialInput);
	const [model, setModel] = useState<string>(initialModel || getDefaultModel());
	const [agent, setAgent] = useState<string>(initialAgent);

	// Tool state
	const [userSelectedTools, setUserSelectedTools] = useState<string[]>([]);

	// UI state
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Clear error
	const clearError = useCallback(() => setError(null), []);

	// Clear input
	const clearInput = useCallback(() => setInput(""), []);

	// Reset entire form
	const resetForm = useCallback(() => {
		setInput("");
		setModel(getDefaultModel());
		//setAgent(getDefaultAgent());
		setUserSelectedTools([]);
		setError(null);
	}, []);

	// Tool toggle handler
	const handleToolToggle = useCallback(
		(toolName: string, isActive: boolean) => {
			setUserSelectedTools((prev) => {
				if (isActive) {
					return [...prev, toolName];
				}
				return prev.filter((t) => t !== toolName);
			});
		},
		[]
	);

	// Get additional tools with active state
	const getAdditionalTools = useCallback(() => {
		const agentToolNames = AGENT_TOOLS[agent] || [];

		return ALL_TOOLS.map((name) => {
			const isAgentTool = agentToolNames.includes(name);
			const isUserSelected = userSelectedTools.includes(name);
			return {
				name,
				active: isAgentTool || isUserSelected,
			};
		});
	}, [agent, userSelectedTools]);

	const isToolDisabledByAgent = (toolName: string): boolean => {
		return AGENT_TOOLS[agent]?.includes(toolName);
	};

	// Validate submission
	const validateSubmit = useCallback(
		(uploadedFiles: UploadedFile[], addresses: UserAddress[]) => {
			// Must have at least input, files, or addresses
			if (
				!input.trim() &&
				uploadedFiles.length === 0 &&
				addresses.length === 0
			) {
				const errorMsg =
					"Please enter a message, upload files, or add addresses";
				setError(errorMsg);
				onError?.(errorMsg);
				return false;
			}

			// Check for file upload errors
			if (uploadedFiles.some((f) => f.error || f.isUploading)) {
				const errorMsg =
					"Please wait for files to finish uploading or fix upload errors";
				setError(errorMsg);
				onError?.(errorMsg);
				return false;
			}

			return true;
		},
		[input, onError]
	);

	// Handle form submission
	const handleSubmit = useCallback(
		async (
			uploadedFiles: UploadedFile[],
			addresses: UserAddress[],
			
			clearFiles?: () => void,
			clearAddresses?: () => void
		) => {
			// Validate
			if (!validateSubmit(uploadedFiles, addresses)) {
				return;
			}

			setIsSubmitting(true);
			setError(null);

			try {
				// Get current tool configuration
				const additionalTools = getAdditionalTools();

				// Call the custom submit implementation
				await onSubmit({
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
				});

				onSuccess?.();
			} catch (err) {
				console.error("Submit error:", err);
				const errorMessage =
					err instanceof Error
						? err.message
						: "An error occurred while submitting";
				setError(errorMessage);
				onError?.(errorMessage);
			} finally {
				setIsSubmitting(false);
			}
		},
		[
			input,
			model,
			agent,
			validateSubmit,
			getAdditionalTools,
			onSubmit,
			onSuccess,
			onError,
			clearInput,
			resetForm,
		]
	);

	// Check if form can be submitted
	const canSubmit = useCallback(
		(uploadedFiles: UploadedFile[], addresses: UserAddress[]) => {
			return (
				(input.trim() || uploadedFiles.length > 0 || addresses.length > 0) &&
				!isSubmitting &&
				!uploadedFiles.some((f) => f.error || f.isUploading)
			);
		},
		[input, isSubmitting]
	);

	// Individual tool setters (for backward compatibility)
	const setSearchActive = useCallback(
		(active: boolean) => {
			handleToolToggle("search", active);
		},
		[handleToolToggle]
	);

	const setClipboardActive = useCallback(
		(active: boolean) => {
			handleToolToggle("clipboard", active);
		},
		[handleToolToggle]
	);

	return {
		// Form state
		input,
		setInput,
		model,
		setModel,
		agent,
		setAgent,

		// Tool state
		userSelectedTools,
		handleToolToggle,
		setSearchActive,
		setClipboardActive,
isToolDisabledByAgent,
		// Computed values
		AgentTools: AGENT_TOOLS,
		allToolNames: ALL_TOOLS,
		additionalTools: getAdditionalTools(),

		// UI state
		isSubmitting,
		error,

		// Actions
		handleSubmit,
		clearError,
		clearInput,
		resetForm,
		canSubmit,

		// Form data object (for convenience)
		formData: {
			input,
			model,
			agent,
			additionalTools: getAdditionalTools(),
		},
	};
};
