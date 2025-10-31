// components/DragOverlay.tsx
import { Upload } from "lucide-react";

interface DragOverlayProps {
	isDragging: boolean;
}

export const DragOverlay = ({ isDragging }: DragOverlayProps) => {
	if (!isDragging) return null;

	return (
		<div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 backdrop-blur-[1px] rounded-2xl z-10 flex items-center justify-center border-2 border-dashed border-blue-400">
			<div className="text-center px-4 py-2">
				<Upload className="w-6 h-6 text-blue-500 mx-auto mb-2" />
				<p className="text-sm font-medium text-blue-600 dark:text-blue-400">
					Drop images here
				</p>
			</div>
		</div>
	);
};
