import { ProtectedRoute } from "~/wrapper/auth-provider";
import { useAuth } from "~/wrapper/auth-provider";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import type { Route } from "./+types/history";
import {
	MessageSquare,
	Calendar,
	Star,
	Edit2,
	Trash2,
	Check,
	X,
	Search,
	Loader2,
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";

// Types
interface ChatMessage {
	role: string;
	parts?: { type: string; text: string }[];
}

interface Chat {
	id: string;
	title?: string;
	createdAt: string;
	messages?: ChatMessage[];
	isFavorite?: boolean;
	lastMessage?: string;
	messageCount?: number;
}

interface EnrichedChat extends Chat {
	title: string;
	lastMessage: string;
	messagesCount: number;
}

// API functions
const apiService = {
	async updateChatTitle(chatId: string, title: string): Promise<void> {
		const response = await fetch(
			`http://localhost:3000/api/chat/${chatId}/title`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ title: title.trim() }),
			}
		);

		if (!response.ok) {
			throw new Error("Failed to update title");
		}
	},

	async toggleChatFavorite(chatId: string, isFavorite: boolean): Promise<void> {
		const response = await fetch(
			`http://localhost:3000/api/chat/${chatId}/favorite`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ isFavorite }),
			}
		);

		if (!response.ok) {
			throw new Error("Failed to toggle favorite");
		}
	},

	async deleteChat(chatId: string): Promise<void> {
		const response = await fetch(`http://localhost:3000/api/chat/${chatId}`, {
			method: "DELETE",
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error("Failed to delete chat");
		}
	},
};

// Utility functions
const formatDate = (dateString: string): string => {
	const date = new Date(dateString);
	const now = new Date();
	const diffTime = Math.abs(now.getTime() - date.getTime());
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const enrichChat = (chat: Chat): EnrichedChat => {
	const messages = chat.messages || [];
	const lastUserMessage = [...messages]
		.reverse()
		.find((msg) => msg.role === "user" || msg.role === "assistant");

	const lastMessageText =
		lastUserMessage?.parts?.find((p) => p.type === "text")?.text || "";

	return {
		...chat,
		title: chat.title || "Untitled Chat",
		lastMessage: lastMessageText,
		messagesCount: messages.length,
	};
};

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Chat History" },
		{ name: "description", content: "Your chat history" },
	];
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	console.log("client loader loaded 🚀");
	try {
		const response = await fetch(`http://localhost:3000/api/chat/history`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});

		if (response.status !== 200) {
			return [];
		}

		const parsed = await response.json();
		console.log(parsed, "parsed");

		const chats = parsed.chats || [];
		return chats.map(enrichChat);
	} catch (error) {
		console.error("Error loading chat:", error);
		return [];
	}
}

export default function History({ loaderData }: Route.ComponentProps) {
	return (
		<ProtectedRoute>
			<HistoryContent historyData={loaderData} />
		</ProtectedRoute>
	);
}

// Search and Filter Component
function SearchAndFilter({
	searchQuery,
	onSearchChange,
	filterFavorites,
	onFilterToggle,
}: {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	filterFavorites: boolean;
	onFilterToggle: () => void;
}) {
	return (
		<div className="flex gap-3">
			<div className="relative flex-1">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<Input
					placeholder="Search chats..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="pl-10"
				/>
			</div>
			<Button
				variant={filterFavorites ? "default" : "outline"}
				size="sm"
				onClick={onFilterToggle}
				className="shrink-0"
			>
				<Star className="w-4 h-4" />
			</Button>
		</div>
	);
}

// Chat Header Component
function ChatHeader({
	session,
	totalChats,
}: {
	session: any;
	totalChats: number;
}) {
	return (
		<div className="space-y-2">
			<h1 className="text-2xl font-semibold font-serif">Chat History</h1>
			<div className="flex items-center gap-3 text-sm text-muted-foreground">
				{session?.user?.image && (
					<img
						src={session.user.image}
						alt={session.user.name || session.user.email}
						className="w-6 h-6 rounded-full"
					/>
				)}
				<span>{session?.user?.name || session?.user?.email}</span>
				<span>•</span>
				<span>{totalChats} chats</span>
			</div>
		</div>
	);
}

// Empty State Component
function EmptyState({
	searchQuery,
	filterFavorites,
}: {
	searchQuery: string;
	filterFavorites: boolean;
}) {
	return (
		<div className="text-center py-12 space-y-2">
			<MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto" />
			<p className="text-muted-foreground">
				{searchQuery || filterFavorites ? "No chats found" : "No chat history"}
			</p>
		</div>
	);
}

// Edit Title Component
function EditTitle({
	title,
	onTitleChange,
	onSave,
	onCancel,
	isLoading,
}: {
	title: string;
	onTitleChange: (title: string) => void;
	onSave: () => void;
	onCancel: () => void;
	isLoading: boolean;
}) {
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				onSave();
			} else if (e.key === "Escape") {
				onCancel();
			}
		},
		[onSave, onCancel]
	);

	return (
		<div className="flex items-center gap-2">
			<Input
				value={title}
				onChange={(e) => onTitleChange(e.target.value)}
				onKeyDown={handleKeyDown}
				className="h-8"
				autoFocus
				disabled={isLoading}
			/>
			<Button
				size="sm"
				variant="ghost"
				onClick={onSave}
				className="h-8 w-8 p-0"
				disabled={isLoading || !title.trim()}
			>
				{isLoading ? (
					<Loader2 className="w-4 h-4 animate-spin" />
				) : (
					<Check className="w-4 h-4" />
				)}
			</Button>
			<Button
				size="sm"
				variant="ghost"
				onClick={onCancel}
				className="h-8 w-8 p-0"
				disabled={isLoading}
			>
				<X className="w-4 h-4" />
			</Button>
		</div>
	);
}

// Chat Actions Component
function ChatActions({
	chat,
	onToggleFavorite,
	onStartEdit,
	onDelete,
	isLoading,
	visible,
}: {
	chat: EnrichedChat;
	onToggleFavorite: (e: React.MouseEvent) => void;
	onStartEdit: (e: React.MouseEvent) => void;
	onDelete: (e: React.MouseEvent) => void;
	isLoading: boolean;
	visible: boolean;
}) {
	return (
		<div
			className={`flex items-center gap-1 transition-opacity ${
				visible ? "opacity-100" : "opacity-0"
			}`}
		>
			<Button
				size="sm"
				variant="ghost"
				onClick={onToggleFavorite}
				className="h-8 w-8 p-0"
				disabled={isLoading}
				title={chat.isFavorite ? "Remove from favorites" : "Add to favorites"}
			>
				<Star
					className={`w-4 h-4 ${
						chat.isFavorite
							? "fill-yellow-400 text-yellow-400"
							: "text-muted-foreground"
					}`}
				/>
			</Button>

			<Button
				size="sm"
				variant="ghost"
				onClick={onStartEdit}
				className="h-8 w-8 p-0"
				disabled={isLoading}
				title="Edit title"
			>
				<Edit2 className="w-4 h-4" />
			</Button>

			<Button
				size="sm"
				variant="ghost"
				onClick={onDelete}
				className="h-8 w-8 p-0 text-destructive hover:text-destructive"
				disabled={isLoading}
				title="Delete chat"
			>
				<Trash2 className="w-4 h-4" />
			</Button>
		</div>
	);
}

// Chat Item Component
function ChatItem({
	chat,
	editingId,
	editingTitle,
	onTitleChange,
	onStartEdit,
	onCancelEdit,
	onSaveEdit,
	onToggleFavorite,
	onDelete,
	isLoading,
}: {
	chat: EnrichedChat;
	editingId: string | null;
	editingTitle: string;
	onTitleChange: (title: string) => void;
	onStartEdit: (chat: EnrichedChat) => void;
	onCancelEdit: () => void;
	onSaveEdit: (chatId: string, title: string) => void;
	onToggleFavorite: (chatId: string) => void;
	onDelete: (chatId: string) => void;
	isLoading: boolean;
}) {
	const [showActions, setShowActions] = useState(false);
	const navigate = useNavigate();
	const isEditing = editingId === chat.id;

	const handleCardClick = useCallback(() => {
		if (!isEditing) {
			navigate(`/chat/${chat.id}`);
		}
	}, [chat.id, navigate, isEditing]);

	const handleStartEdit = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onStartEdit(chat);
		},
		[chat, onStartEdit]
	);

	const handleToggleFavorite = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onToggleFavorite(chat.id);
		},
		[chat.id, onToggleFavorite]
	);

	const handleDelete = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (window.confirm("Are you sure you want to delete this chat?")) {
				onDelete(chat.id);
			}
		},
		[chat.id, onDelete]
	);

	const handleSave = useCallback(() => {
		onSaveEdit(chat.id, editingTitle);
	}, [chat.id, editingTitle, onSaveEdit]);

	return (
		<Card
			className={`group hover:shadow-sm transition-all duration-200 ${
				isEditing ? "" : "cursor-pointer"
			}`}
			onClick={handleCardClick}
			onMouseEnter={() => setShowActions(true)}
			onMouseLeave={() => setShowActions(false)}
		>
			<CardContent className="p-4">
				<div className="flex items-start gap-3">
					<MessageSquare className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />

					<div className="flex-1 min-w-0 space-y-2">
						{isEditing ? (
							<EditTitle
								title={editingTitle}
								onTitleChange={onTitleChange}
								onSave={handleSave}
								onCancel={onCancelEdit}
								isLoading={isLoading}
							/>
						) : (
							<h3 className="font-medium leading-none">{chat.title}</h3>
						)}

						<div className="flex items-center gap-3 text-xs text-muted-foreground">
							<span className="flex items-center gap-1">
								<Calendar className="w-3 h-3" />
								{formatDate(chat.createdAt)}
							</span>
							<span>{chat.messageCount} messages</span>
						</div>

						{chat.lastMessage && (
							<p className="text-sm text-muted-foreground line-clamp-1">
								{chat.lastMessage}
							</p>
						)}
					</div>

					<ChatActions
						chat={chat}
						onToggleFavorite={handleToggleFavorite}
						onStartEdit={handleStartEdit}
						onDelete={handleDelete}
						isLoading={isLoading}
						visible={showActions || isEditing}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

// Chat Section Component
function ChatSection({
	title,
	chats,
	icon,
	editingId,
	editingTitle,
	onTitleChange,
	onStartEdit,
	onCancelEdit,
	onSaveEdit,
	onToggleFavorite,
	onDelete,
	isLoading,
}: {
	title?: string;
	chats: EnrichedChat[];
	icon?: React.ReactNode;
	editingId: string | null;
	editingTitle: string;
	onTitleChange: (title: string) => void;
	onStartEdit: (chat: EnrichedChat) => void;
	onCancelEdit: () => void;
	onSaveEdit: (chatId: string, title: string) => void;
	onToggleFavorite: (chatId: string) => void;
	onDelete: (chatId: string) => void;
	isLoading: boolean;
}) {
	if (chats.length === 0) return null;

	return (
		<div className="space-y-3">
			{title && (
				<h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
					{icon}
					{title}
				</h3>
			)}
			{chats.map((chat) => (
				<ChatItem
					key={chat.id}
					chat={chat}
					editingId={editingId}
					editingTitle={editingTitle}
					onTitleChange={onTitleChange}
					onStartEdit={onStartEdit}
					onCancelEdit={onCancelEdit}
					onSaveEdit={onSaveEdit}
					onToggleFavorite={onToggleFavorite}
					onDelete={onDelete}
					isLoading={isLoading}
				/>
			))}
		</div>
	);
}

// Main History Content Component
function HistoryContent({
	historyData: initialHistoryData,
}: {
	historyData: EnrichedChat[];
}) {
	const { session } = useAuth();
	const [historyData, setHistoryData] = useState<EnrichedChat[]>(
		initialHistoryData || []
	);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingTitle, setEditingTitle] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterFavorites, setFilterFavorites] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleEditTitle = useCallback(
		async (chatId: string, newTitle: string) => {
			if (!newTitle?.trim()) return;

			setIsLoading(true);
			try {
				await apiService.updateChatTitle(chatId, newTitle);
				setHistoryData((prev) =>
					prev.map((chat) =>
						chat.id === chatId ? { ...chat, title: newTitle.trim() } : chat
					)
				);
				setEditingId(null);
				setEditingTitle("");
			} catch (error) {
				console.error("Failed to update title:", error);
				// You might want to show a toast notification here
			} finally {
				setIsLoading(false);
			}
		},
		[]
	);

	const handleToggleFavorite = useCallback(
		async (chatId: string) => {
			const currentChat = historyData.find((chat) => chat.id === chatId);
			if (!currentChat) return;

			setIsLoading(true);
			try {
				await apiService.toggleChatFavorite(chatId, !currentChat.isFavorite);
				setHistoryData((prev) =>
					prev.map((chat) =>
						chat.id === chatId
							? { ...chat, isFavorite: !chat.isFavorite }
							: chat
					)
				);
			} catch (error) {
				console.error("Failed to toggle favorite:", error);
				// You might want to show a toast notification here
			} finally {
				setIsLoading(false);
			}
		},
		[historyData]
	);

	const handleDeleteChat = useCallback(async (chatId: string) => {
		setIsLoading(true);
		try {
			await apiService.deleteChat(chatId);
			setHistoryData((prev) => prev.filter((chat) => chat.id !== chatId));
		} catch (error) {
			console.error("Failed to delete chat:", error);
			// You might want to show a toast notification here
		} finally {
			setIsLoading(false);
		}
	}, []);

	const startEditing = useCallback((chat: EnrichedChat) => {
		setEditingId(chat.id);
		setEditingTitle(chat.title);
	}, []);

	const cancelEditing = useCallback(() => {
		setEditingId(null);
		setEditingTitle("");
	}, []);

	const filteredChats = useMemo(() => {
		return historyData.filter((chat) => {
			const matchesSearch =
				chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesFilter = filterFavorites ? chat.isFavorite : true;
			return matchesSearch && matchesFilter;
		});
	}, [historyData, searchQuery, filterFavorites]);

	const { favoriteChats, regularChats } = useMemo(() => {
		const favorites = filteredChats.filter((chat) => chat.isFavorite);
		const regular = filteredChats.filter((chat) => !chat.isFavorite);
		return { favoriteChats: favorites, regularChats: regular };
	}, [filteredChats]);

	return (
		<div className="max-w-2xl mx-auto p-6 space-y-6">
			<ChatHeader session={session} totalChats={historyData.length} />

			<SearchAndFilter
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				filterFavorites={filterFavorites}
				onFilterToggle={() => setFilterFavorites(!filterFavorites)}
			/>

			<div className="space-y-4">
				{!filterFavorites && (
					<>
						<ChatSection
							title="Favorites"
							chats={favoriteChats}
							icon={
								<Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
							}
							editingId={editingId}
							editingTitle={editingTitle}
							onTitleChange={setEditingTitle}
							onStartEdit={startEditing}
							onCancelEdit={cancelEditing}
							onSaveEdit={handleEditTitle}
							onToggleFavorite={handleToggleFavorite}
							onDelete={handleDeleteChat}
							isLoading={isLoading}
						/>

						<ChatSection
							title={favoriteChats.length > 0 ? "Recent" : undefined}
							chats={regularChats}
							editingId={editingId}
							editingTitle={editingTitle}
							onTitleChange={setEditingTitle}
							onStartEdit={startEditing}
							onCancelEdit={cancelEditing}
							onSaveEdit={handleEditTitle}
							onToggleFavorite={handleToggleFavorite}
							onDelete={handleDeleteChat}
							isLoading={isLoading}
						/>
					</>
				)}

				{filterFavorites && (
					<ChatSection
						chats={favoriteChats}
						editingId={editingId}
						editingTitle={editingTitle}
						onTitleChange={setEditingTitle}
						onStartEdit={startEditing}
						onCancelEdit={cancelEditing}
						onSaveEdit={handleEditTitle}
						onToggleFavorite={handleToggleFavorite}
						onDelete={handleDeleteChat}
						isLoading={isLoading}
					/>
				)}

				{filteredChats.length === 0 && (
					<EmptyState
						searchQuery={searchQuery}
						filterFavorites={filterFavorites}
					/>
				)}
			</div>
		</div>
	);
}
