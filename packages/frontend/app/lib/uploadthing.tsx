import { generateReactHelpers, generateUploadButton } from "@uploadthing/react";
import { generateUploadDropzone } from "@uploadthing/react";

export const UploadDropzone = generateUploadDropzone();

export const UploadButton = generateUploadButton({
	url: "http://localhost:3000/api/uploadthing",
});
export const { useUploadThing, uploadFiles } = generateReactHelpers({
	url: "http://localhost:3000/api/uploadthing",
});
