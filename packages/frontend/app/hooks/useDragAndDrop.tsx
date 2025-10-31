// hooks/useDragAndDrop.ts
import { useState, useCallback } from "react";

export const useDragAndDrop = (onDrop: (files: File[]) => void) => {
	const [isDragging, setIsDragging] = useState(false);
	const [dragCounter, setDragCounter] = useState(0);

	const handleDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragCounter((prev) => prev + 1);
		if (e.dataTransfer.types.includes("Files")) {
			setIsDragging(true);
		}
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragCounter((prev) => {
			const newCounter = prev - 1;
			if (newCounter <= 0) {
				setIsDragging(false);
			}
			return newCounter;
		});
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);
			setDragCounter(0);

			const files = e.dataTransfer.files;
			if (files.length > 0) {
				onDrop(Array.from(files));
			}
		},
		[onDrop]
	);

	return {
		isDragging,
		dragHandlers: {
			onDragEnter: handleDragEnter,
			onDragLeave: handleDragLeave,
			onDragOver: handleDragOver,
			onDrop: handleDrop,
		},
	};
};
