// hooks/useFileUpload.ts
import { useState, useCallback } from "react";
import { uploadFiles } from "~/lib/uploadthing";

export interface UploadedFile {
	id: string;
	fileName: string;
	fileSize: number;
	url: string;
	uploadThingUrl: string;
	isUploading?: boolean;
	error?: string;
	type?:string;
}

// File validation constants
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export const useFileUpload = () => {
	const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
	const [error, setError] = useState<string | null>(null);

	// File validation helper
	const validateFile = (file: File): string | null => {
		if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
			return `File type ${file.type} not supported. Please use JPG or PNG files.`;
		}
		if (file.size > MAX_FILE_SIZE) {
			return `File size ${(file.size / 1024 / 1024).toFixed(
				1
			)}MB exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
		}
		return null;
	};

	// Handle file upload with UploadThing
	const handleFileUpload = useCallback(async (files: File[]) => {
		// Validate files first
		const validFiles = files.filter((file) => {
			const validationError = validateFile(file);
			if (validationError) {
				setError(validationError);
				return false;
			}
			return true;
		});

		if (validFiles.length === 0) return;

		// Add files with uploading state
		const tempFiles: UploadedFile[] = validFiles.map((file) => ({
			id: `${file.name}-${Date.now()}-${Math.random()}`,
			fileName: file.name,
			fileSize: file.size,
			url: "",
			uploadThingUrl: "",
			isUploading: true,
		}));

		setUploadedFiles((prev) => [...prev, ...tempFiles]);

		try {
			const uploaded = await uploadFiles("chatAttachment", {
				files: validFiles,
				onUploadBegin: ({ file }) => {
					console.log("Started uploading:", file);
				},
				onUploadProgress: ({ file, progress }) => {
					console.log(`Progress for ${file.name}: ${progress}%`);
				},
			
			});

			console.log("Uploaded files:", uploaded);

			// Update the files with actual URLs
			setUploadedFiles((prev) =>
				prev.map((file) => {
					const uploadedFile = uploaded.find((u) => u.name === file.fileName);
					if (uploadedFile && file.isUploading) {
						return {
							...file,
							url: uploadedFile.ufsUrl,
							uploadThingUrl: uploadedFile.ufsUrl,
							isUploading: false,
							
						};
					}
					return file;
				})
			);
		} catch (err) {
			console.error("Upload failed:", err);
			setError("Upload failed. Please try again.");

			// Remove failed uploads
			setUploadedFiles((prev) =>
				prev.filter((file) => !tempFiles.some((temp) => temp.id === file.id))
			);
		}
	}, []);

	// Handle file removal
	const removeFile = useCallback((fileId: string) => {
		setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
	}, []);

	// Clear error
	const clearError = useCallback(() => setError(null), []);

	// Add files from UploadButton
	// const addUploadedFiles = useCallback(
	// 	(files: Array<{ name: string; size: number; url: string }>) => {
	// 		const newFiles: UploadedFile[] = files.map((file) => ({
	// 			id: `${file.name}-${Date.now()}-${Math.random()}`,
	// 			fileName: file.name,
	// 			fileSize: file.size,
	// 			url: file.url,
	// 			uploadThingUrl: file.url,
	// 			isUploading: false,
	// 		}));

	// 		setUploadedFiles((prev) => [...prev, ...newFiles]);
	// 	},
	// 	[]
	// );
	const clearFiles = () => setUploadedFiles([]);
	// Get validation status
	const getValidationStatus = () => {
		const filesWithErrors = uploadedFiles.filter((f) => f.error);
		const uploadingFiles = uploadedFiles.filter((f) => f.isUploading);

		return {
			hasErrors: filesWithErrors.length > 0,
			isUploading: uploadingFiles.length > 0,
			canSubmit: filesWithErrors.length === 0 && uploadingFiles.length === 0,
		};
	};

	return {
		clearFiles,
		uploadedFiles,
		error,
		handleFileUpload,
		removeFile,
		clearError,
		//addUploadedFiles,
		getValidationStatus,
		validateFile,
	};
};
