
export type Visibility = "PUBLIC" | "PRIVATE";

export interface User {
    id: string;
    name?: string | null;
    address: string;
    chats: Chat[];
}

export interface Chat {
    id: string;
    title?: string | null;
    visibility: Visibility;
    userId: string;
    user: User;
    messages: Message[];
}

export interface Message {
    id: string;
    metadata?: Record<string, any> | null;
    chatId: string;
    role: string;
    content?:string;
    parts: Record<string, any>;
    createdAt: Date;
    chat: Chat;
}