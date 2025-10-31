import { useRef, useCallback } from "react";
import type { UploadedFile } from "~/types/fileUpload";

interface UseFileInputOptions {
	accept?: string;
	multiple?: boolean;
	onFilesSelected: (files: File[]) => void;
}

export const useFileInput = ({
	accept = ".jpg,.jpeg,.png",
	multiple = true,
	onFilesSelected,
}: UseFileInputOptions) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Trigger the file input dialog
	const triggerFileInput = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	// Handle file input change
	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (files && files.length > 0) {
				onFilesSelected(Array.from(files));
			}

			// Reset input value to allow selecting the same file again
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		},
		[onFilesSelected]
	);

	// Create the hidden input element props
	const inputProps = {
		ref: fileInputRef,
		type: "file" as const,
		accept,
		multiple,
		onChange: handleFileInputChange,
		className: "hidden",
	};

	return {
		fileInputRef,
		triggerFileInput,
		handleFileInputChange,
		inputProps,
	};
};
