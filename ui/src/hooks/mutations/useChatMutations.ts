import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Message } from "@ai-sdk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";


export const useUpdateChatTitle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, title }: { chatId: string; title: string }) =>
      api.post(`/api/chat/${chatId}?messages=true`, title),
    // onSuccess: (newUser) => {

    //   queryClient.invalidateQueries({ queryKey: queryKeys.user.all });

    // },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ( chatId: string) =>
      api.delete(`/api/chat/${chatId}?messages=true`),
    // onSuccess: (newUser) => {

    //   queryClient.invalidateQueries({ queryKey: queryKeys.user.all });

    // },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
  });
};
export const useCreateChat = () => {
  

  return useMutation({
    mutationFn: (variables: { chatId: string; messages: Message }) => 
      api.post(`/api/chat/create`, variables),
    // onSuccess: (newUser) => {
     
    //   queryClient.invalidateQueries({ queryKey: queryKeys.user.all });

   
    // },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
  });
};