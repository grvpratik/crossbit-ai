// types/fileUpload.ts
export interface UploadedFile {
	id: string;
	fileName: string;
	fileSize: number;
	url: string;
	uploadThingUrl: string;
	isUploading?: boolean;
	error?: string;
}

export interface FileValidationResult {
	isValid: boolean;
	error?: string;
}

export interface UploadProgress {
	file: File;
	progress: number;
	loaded: number;
	totalProgress: number;
}

export interface UploadResult {
	name: string;
	size: number;
	url: string;
}

// File validation constants
export const FILE_UPLOAD_CONFIG = {
	MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
	ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png"],
	MAX_FILES: 10,
} as const;
