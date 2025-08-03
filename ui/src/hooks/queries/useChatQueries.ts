import { api } from '@/lib/api';
import type { Chat } from '@/types/api.types';
import type { Message } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
export const useChatHistory = () => {
  return useQuery({
    queryKey: ['history'],
    queryFn: () => api.get('/api/chat/history'),
  });
};

export const useChatDetails = (chatId: string) => {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => api.get<Chat>(`/api/chat/${chatId}?messages=true`),
    enabled: !!chatId,
  });
};

export const useUpdateChatTitle = (chatId: string, title: string) => {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => api.post(`/api/chat/${chatId}?messages=true`, title),
  });
};

export const useDeleteChat = (chatId: string) => {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => api.delete(`/api/chat/${chatId}?messages=true`),
  });
};
export const createChat = (chatId: string, messages: Message) => {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => api.post(`/api/chat/create`, { chatId, messages }),
  });
};

// export const useUpdateChatBookmark = (chatId: string, fav: boolean) => {
//   return useQuery({
//     queryKey: ['chat', chatId],
//     queryFn: () => api.post(`/api/chat/${chatId}?messages=true`, fav),
//   });
// };
