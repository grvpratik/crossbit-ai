import { useMemo } from "react";
import type { UploadedFile } from "~/types/fileUpload";
import type { UserAddress } from "./useAddressManagement";

interface UseChatLayoutOptions {
	input: string;
	agent: string;
	uploadedFiles: UploadedFile[];
	addresses: UserAddress[];
	threshold?: number;
}

export const useChatLayout = ({
	input,
	agent,
	uploadedFiles,
	addresses,
	threshold = 30,
}: UseChatLayoutOptions) => {
	// Determine if layout should be vertical
	const isVertical = useMemo(() => {
		return (
			input.length >= threshold ||
			!!agent ||
			uploadedFiles.length > 0 ||
			addresses.length > 0
		);
	}, [input.length, threshold, agent, uploadedFiles.length, addresses.length]);

	// Calculate row start positions based on content
	const rowPositions = useMemo(() => {
		let currentRow = 1;
		const positions = {
			filePreview: 0,
			addressTags: 0,
			textarea: 0,
			toolbar: 0,
		};

		// File preview on first row if exists
		if (uploadedFiles.length > 0) {
			positions.filePreview = currentRow;
			currentRow++;
		}

		// Address tags on next row if exists
		if (addresses.length > 0) {
			positions.addressTags = currentRow;
			currentRow++;
		}

		// Textarea
		positions.textarea = currentRow;
		currentRow++;

		// Toolbar
		positions.toolbar = currentRow;

		return positions;
	}, [uploadedFiles.length, addresses.length]);

	// Get grid classes for different sections
	const getGridClasses = useMemo(() => {
		return {
			container: isVertical
				? "grid-cols-6 grid-rows-[auto,auto,1fr,auto] rounded-2xl grid h-auto"
				: "grid-cols-6 grid-rows-1 rounded-full flex " ,

			filePreview: "col-span-6 row-start-1",

			addressTags: `col-span-6 row-start-${rowPositions.addressTags}`,

			textarea: isVertical
				? `col-span-6 row-start-${rowPositions.textarea} min-h-12`
				: "col-span-4 resize-none flex-1 overflow-hidden",

			toolbarLeft: isVertical
				? `col-start-1 row-start-${rowPositions.toolbar}`
				: "col-start-1",

			toolbarRight: isVertical
				? `col-start-6 row-start-${rowPositions.toolbar}`
				: "col-span-1 col-start-6",
		};
	}, [isVertical, rowPositions]);

	// Generate status text
	const statusText = useMemo(() => {
		const parts: string[] = [];

		if (input.length > 0) {
			parts.push(`${input.length} characters`);
		}

		if (uploadedFiles.length > 0) {
			parts.push(
				`${uploadedFiles.length} file${uploadedFiles.length !== 1 ? "s" : ""}`
			);
		}

		if (addresses.length > 0) {
			parts.push(
				`${addresses.length} address${addresses.length !== 1 ? "es" : ""}`
			);
		}

		return parts.join(" • ");
	}, [input.length, uploadedFiles.length, addresses.length]);

	// Check if we should show status
	const shouldShowStatus = isVertical && statusText.length > 0;

	return {
		isVertical,
		rowPositions,
		gridClasses: getGridClasses,
		statusText,
		shouldShowStatus,
	};
};
