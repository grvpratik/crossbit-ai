// account,chat,


export const queryKeys = {
  user: {
    all: ['user'],
    detail: (id: string) => [...queryKeys.user.all, id],
  },
  history: {
    all: ['history'],
    chats: () => [...queryKeys.history.all, 'list'],
    chat: (filters: any) => [...queryKeys.history.chats(), { filters }],
    details: () => [...queryKeys.history.all, 'detail'],
    detail: (id: string) => [...queryKeys.history.details(), id],
    byUser: (userId: string) => [...queryKeys.history.all, 'byUser', userId],
  },
};
