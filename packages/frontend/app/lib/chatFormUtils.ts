// utils/chatFormUtils.ts
import { type UploadedFile } from "~/hooks/useFileUpload";

export interface ChatFormData {
	input: string;
	model: string;
	agent: string;
	additionalTools: any;
	uploadedFiles: UploadedFile[];
}

export interface ChatSubmissionPayload {
	id: string;
	input: string;
	model: string;
	additionalTools: any;
	fileUrls: string[];
}

export interface ChatData {
	id: string;
	title: string;
	initialMessage: string;
	createdAt: string;
	model: string;
	additionalTools: any;
	userId: string;
	hasFiles: boolean;
	fileCount: number;
	fileUrls: UploadedFile[];
}

export const createChatPayload = (
	formData: ChatFormData
): ChatSubmissionPayload => {
	return {
		id: (Math.random() + 1).toString(36).substring(7),
		input: formData.input.trim(),
		model: formData.model,
		additionalTools: formData.additionalTools,
		fileUrls: formData.uploadedFiles.map((f) => f.uploadThingUrl),
	};
};

export const createChatData = (
	chatId: string,
	formData: ChatFormData,
	userId?: string
): ChatData => {
	const { input, model, additionalTools, uploadedFiles } = formData;

	return {
		id: chatId,
		title: input.substring(0, 100) + (input.length > 100 ? "..." : ""),
		initialMessage: input,
		createdAt: new Date().toISOString(),
		model: model,
		additionalTools: additionalTools,
		userId: userId || "anonymous",
		hasFiles: uploadedFiles.length > 0,
		fileCount: uploadedFiles.length,
		fileUrls: uploadedFiles,
	};
};

export const validateFormSubmission = (
	input: string,
	uploadedFiles: UploadedFile[]
): { isValid: boolean; error?: string } => {
	if (!input.trim() && uploadedFiles.length === 0) {
		return { isValid: false, error: "Please enter a message or upload files." };
	}

	const filesWithErrors = uploadedFiles.filter((f) => f.error);
	if (filesWithErrors.length > 0) {
		return {
			isValid: false,
			error: "Please fix file errors before submitting.",
		};
	}

	const uploadingFiles = uploadedFiles.filter((f) => f.isUploading);
	if (uploadingFiles.length > 0) {
		return {
			isValid: false,
			error: "Please wait for all files to finish uploading.",
		};
	}

	return { isValid: true };
};

export const submitChat = async (
	payload: ChatSubmissionPayload
): Promise<{ id: string }> => {
	const resp = await fetch("http://localhost:3000/api/chat", {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!resp.ok) {
		const errorData = await resp.json().catch(() => ({}));
		throw new Error(
			errorData.message || `Failed to create chat (${resp.status})`
		);
	}

	return resp.json();
};
