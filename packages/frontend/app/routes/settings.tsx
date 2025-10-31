import { ProtectedRoute } from "~/wrapper/auth-provider";
import { useAuth } from "~/wrapper/auth-provider";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/settings";
import {
	Settings as SettingsIcon,
	User,
	Bell,
	Shield,
	Palette,
	Globe,
} from "lucide-react";
import { Moon, Sun } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useTheme } from "~/wrapper/theme-provider";
import { useUploadThing } from "~/lib/uploadthing";
import { useCallback, useState } from "react";
import { useDropzone } from "@uploadthing/react";
// import {
//   generateClientDropzoneAccept,
//   generatePermittedFileTypes,
// } from "uploadthing/client";
export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Settings" },
		{ name: "description", content: "Manage your account settings" },
	];
}

export default function Settings() {
	return (
		<ProtectedRoute>
			<SettingsContent />
		</ProtectedRoute>
	);
}

function SettingsContent() {
	const { session, signOut } = useAuth();

	const { setTheme } = useTheme();

	const handleSignOut = async () => {
		await signOut();
		window.location.href = "/";
	};

	const settingsSections = [
		{
			id: "profile",
			title: "Profile",
			icon: User,
			description: "Manage your account information",
			items: [
				{ label: "Name", value: session?.user?.name || "Not set" },
				{ label: "Email", value: session?.user?.email || "Not set" },
				{
					label: "Email Verified",
					value: session?.user?.emailVerified ? "Yes" : "No",
				},
			],
		},
		{
			id: "notifications",
			title: "Notifications",
			icon: Bell,
			description: "Configure your notification preferences",
			items: [
				{ label: "Email Notifications", value: "Enabled" },
				{ label: "Push Notifications", value: "Disabled" },
				{ label: "Sound Alerts", value: "Enabled" },
			],
		},
		{
			id: "privacy",
			title: "Privacy & Security",
			icon: Shield,
			description: "Manage your privacy and security settings",
			items: [
				{ label: "Two-Factor Authentication", value: "Disabled" },
				{ label: "Session Timeout", value: "30 minutes" },
				{ label: "Data Retention", value: "90 days" },
			],
		},
		{
			id: "appearance",
			title: "Appearance",
			icon: Palette,
			description: "Customize the app appearance",
			items: [
				{ label: "Theme", value: "System" },
				{ label: "Font Size", value: "Medium" },
				{ label: "Compact Mode", value: "Disabled" },
			],
		},
		{
			id: "language",
			title: "Language & Region",
			icon: Globe,
			description: "Set your language and regional preferences",
			items: [
				{ label: "Language", value: "English" },
				{ label: "Time Zone", value: "UTC" },
				{ label: "Date Format", value: "MM/DD/YYYY" },
			],
		},
	];
	 const [files, setFiles] = useState<File[]>([]);
		const onDrop = useCallback((acceptedFiles: File[]) => {
			setFiles(acceptedFiles);
		}, []);
		const { startUpload, routeConfig } = useUploadThing("myUploadEndpoint", {
			onClientUploadComplete: () => {
				alert("uploaded successfully!");
			},
			onUploadError: () => {
				alert("error occurred while uploading");
			},
			onUploadBegin: ({ file }) => {
				console.log("upload has begun for", file);
			},
		});
		const { getRootProps, getInputProps } = useDropzone({
			onDrop,
			accept: {
				'image/*': ['.png', '.jpg', '.jpeg', '.gif']
			}
		});
	return (
		<div className=" bg-gray-50 dark:bg-gray-900 overflow-y-auto font-serif ">
			<div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-2">
						<SettingsIcon className="w-8 h-8 text-blue-600" />
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
							Settings
						</h1>
					</div>
					<p className="text-gray-600 dark:text-gray-400">
						Manage your account and application preferences
					</p>
				</div>
				<div {...getRootProps()}>
					<input {...getInputProps()} />
					<div>
						{files.length > 0 && (
							<button onClick={() => startUpload(files)}>
								Upload {files.length} files
							</button>
						)}
					</div>
					Drop files here!
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon">
							<Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
							<Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
							<span className="sr-only">Toggle theme</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => setTheme("light")}>
							Light
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTheme("dark")}>
							Dark
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTheme("system")}>
							System
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Settings Sections */}
				<div className="space-y-6">
					{settingsSections.map((section) => {
						const IconComponent = section.icon;
						return (
							<div
								key={section.id}
								className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
							>
								<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
									<div className="flex items-center gap-3">
										<IconComponent className="w-5 h-5 text-blue-600" />
										<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
											{section.title}
										</h2>
									</div>
									<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
										{section.description}
									</p>
								</div>
								<div className="px-6 py-4">
									<div className="space-y-3">
										{section.items.map((item, index) => (
											<div
												key={index}
												className="flex items-center justify-between py-2"
											>
												<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
													{item.label}
												</span>
												<span className="text-sm text-gray-500 dark:text-gray-400">
													{item.value}
												</span>
											</div>
										))}
									</div>
									<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
										<Button variant="outline" size="sm">
											Edit {section.title}
										</Button>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Danger Zone */}
				<div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 overflow-hidden">
					<div className="px-6 py-4 border-b border-red-200 dark:border-red-800">
						<h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
							Danger Zone
						</h2>
						<p className="text-sm text-red-600 dark:text-red-400 mt-1">
							Irreversible and destructive actions
						</p>
					</div>
					<div className="px-6 py-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-sm font-medium text-gray-900 dark:text-white">
									Sign Out
								</h3>
								<p className="text-sm text-gray-500 dark:text-gray-400">
									Sign out of your account on this device
								</p>
							</div>
							<Button variant="destructive" size="sm" onClick={handleSignOut}>
								Sign Out
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
