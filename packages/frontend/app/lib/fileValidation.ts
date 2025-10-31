// utils/fileValidation.ts
import { FILE_UPLOAD_CONFIG } from "~/types/fileUpload";
import type { FileValidationResult } from "~/types/fileUpload";

export const validateFile = (file: File): FileValidationResult => {
	// Check file type
	if (!FILE_UPLOAD_CONFIG.ACCEPTED_IMAGE_TYPES.includes(file.type)) {
		return {
			isValid: false,
			error: `File type ${file.type} not supported. Please use JPG or PNG files.`,
		};
	}

	// Check file size
	if (file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
		const maxSizeMB = FILE_UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024;
		const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
		return {
			isValid: false,
			error: `File size ${fileSizeMB}MB exceeds maximum size of ${maxSizeMB}MB.`,
		};
	}

	return { isValid: true };
};

export const validateFiles = (files: File[]): FileValidationResult => {
	// Check number of files
	if (files.length > FILE_UPLOAD_CONFIG.MAX_FILES) {
		return {
			isValid: false,
			error: `Too many files. Maximum ${FILE_UPLOAD_CONFIG.MAX_FILES} files allowed.`,
		};
	}

	// Validate each file
	for (const file of files) {
		const result = validateFile(file);
		if (!result.isValid) {
			return result;
		}
	}

	return { isValid: true };
};

export const getFileTypeIcon = (fileType: string): string => {
	if (fileType.startsWith("image/")) return "🖼️";
	if (fileType.includes("pdf")) return "📄";
	if (fileType.includes("document") || fileType.includes("word")) return "📝";
	if (fileType.includes("spreadsheet") || fileType.includes("excel"))
		return "📊";
	return "📁";
};

export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
