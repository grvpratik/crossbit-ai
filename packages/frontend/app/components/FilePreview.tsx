// components/FilePreview.tsx
import { AlertCircle, X, Loader2, FileIcon } from "lucide-react";
import {type UploadedFile } from "~/hooks/useFileUpload";

interface FilePreviewProps {
	uploadedFiles: UploadedFile[];
	onRemoveFile: (fileId: string) => void;
	isSubmitting?: boolean;
}

export const FilePreview = ({
	uploadedFiles,
	onRemoveFile,
	isSubmitting = false,
}: FilePreviewProps) => {
	if (uploadedFiles.length === 0) return null;

	return (
		<div className="mb-2 space-y-1">
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
				{uploadedFiles.map((uploadedFile) => (
					<FilePreviewItem
						key={uploadedFile.id}
						file={uploadedFile}
						onRemove={() => onRemoveFile(uploadedFile.id)}
						disabled={isSubmitting}
					/>
				))}
			</div>

			{/* Error messages */}
			{uploadedFiles.some((f) => f.error) && (
				<div className="space-y-1">
					{uploadedFiles
						.filter((f) => f.error)
						.map((f) => (
							<p key={f.id} className="text-xs text-red-600 dark:text-red-400">
								{f.fileName}: {f.error}
							</p>
						))}
				</div>
			)}
		</div>
	);
};

interface FilePreviewItemProps {
	file: UploadedFile;
	onRemove: () => void;
	disabled?: boolean;
}

const FilePreviewItem = ({
	file,
	onRemove,
	disabled = false,
}: FilePreviewItemProps) => {
	const containerClasses = `relative group rounded-lg overflow-hidden border-2 transition-all duration-200 ${
		file.error
			? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
			: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
	}`;

	return (
		<div className={containerClasses}>
			{/* Image or Loading State */}
			{file.isUploading ? (
				<div className="w-full h-24 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
					<Loader2 className="w-6 h-6 animate-spin text-slate-400" />
				</div>
			) : file.uploadThingUrl && !file.error ? (
				<img
					src={file.uploadThingUrl}
					alt={file.fileName}
					className="w-full h-24 object-cover"
				/>
			) : (
				<div className="w-full h-24 flex items-center justify-center">
					<FileIcon className="w-8 h-8 text-slate-400" />
				</div>
			)}

			{/* File info overlay */}
			<div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs">
				<p className="truncate">{file.fileName}</p>
				<p className="text-slate-300">
					{(file.fileSize / 1024).toFixed(1)} KB
					{file.isUploading && " • Uploading..."}
				</p>
			</div>

			{/* Remove button */}
			<button
				onClick={onRemove}
				className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
				disabled={disabled || file.isUploading}
			>
				<X className="w-3 h-3" />
			</button>

			{/* Error indicator */}
			{file.error && (
				<div className="absolute top-1 left-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
					<AlertCircle className="w-3 h-3" />
				</div>
			)}
		</div>
	);
};
