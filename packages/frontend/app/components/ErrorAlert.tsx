// components/ErrorAlert.tsx
import { AlertCircle, X } from "lucide-react";

interface ErrorAlertProps {
	error: string | null;
	onClear: () => void;
}

export const ErrorAlert = ({ error, onClear }: ErrorAlertProps) => {
	if (!error) return null;

	return (
		<div className="max-w-2xl mx-auto mb-6">
			<div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
				<AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
				<div className="flex-1">
					<p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
				</div>
				<button
					onClick={onClear}
					className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
				>
					<X className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
};
