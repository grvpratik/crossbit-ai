import { Message } from 'ai'
import prisma from '../../db/connection'
import { Visibility } from '../../generated/prisma'
import { safeExecutePrismaOperation } from '../../middleware/error.middleware'
import { JsonValue } from '../../generated/prisma/runtime/library'

export interface CreateMessageDto {
  id: string
  chatId: string
  role: string
  parts: any
  metadata?: any
}

export interface UpdateMessageDto {
  role?: string
  parts?: any
  metadata?: any
}
export interface CreateChatDto {
  id: string
  title?: string
  visibility?: Visibility
  userId: string
}

export interface UpdateChatDto {
  title?: string
  visibility?: Visibility
}

export const chatService = {
  create: async (data: CreateChatDto) => {
    return await safeExecutePrismaOperation(() =>
      prisma.chat.create({
        data,
        include: { messages: true, user: true },
      })
    )
  },

  findById: async (
    id: string,
    userId: string,
    includeMessage: boolean = true
  ) => {
    if (!includeMessage) {
      return await safeExecutePrismaOperation(() =>
        prisma.chat.findUnique({
          where: { id, userId },
          include: { messages: false, user: false },
        })
      )
    }
    return await safeExecutePrismaOperation(() =>
      prisma.chat.findUnique({
        where: { id, userId },
        include: { messages: true, user: true },
      })
    )
  },

  update: async (id: string, userId: string, data: UpdateChatDto) => {
    return await safeExecutePrismaOperation(() =>
      prisma.chat.update({
        where: { id, userId },
        data,
        include: { messages: true, user: true },
      })
    )
  },

  delete: async (id: string, userId: string) => {
    return await safeExecutePrismaOperation(() =>
      prisma.chat.delete({ where: { id, userId } })
    )
  },
  //   updateMessages: async (id: string, userId: string, messages:) => {
  //     return await safeExecutePrismaOperation(() =>
  //       prisma.chat.update({
  //         where: { id, userId },
  //         data,
  //         include: { messages: true, user: true },
  //       })
  //     )
  //   },
  findByUserId: async (userId: string) => {
    return await safeExecutePrismaOperation(() =>
      prisma.chat.findMany({
        where: { userId },
        include: { messages: false },
      })
    )
  },
  async appendMessages(params: {
    id: string
    userId: string
    title: string
    messages: Message[]
    fullMessages: Message[]
  }) {
    const { id, userId, title, messages, fullMessages } = params
    console.log({ id, userId, title, messages, fullMessages }, 'chat save')
    return await safeExecutePrismaOperation(async () => {
   
      return await prisma.chat.upsert({
        where: {
          // id_userId: {
          //   // Use the compound unique key
          //   id,
          //   userId,
          // },
          id,
          userId,
        },
        update: {
          messages: {
            create: messages.map((msg) => ({
              id: msg.id || Math.random().toString(36).substring(2, 15),
              role: msg.role,
              parts: (msg.parts as JsonValue) || [],
            })),
          },
        },
        create: {
          id,
          userId,
          title: title,
          messages: {
            create: fullMessages.map((msg) => ({
              id: msg.id || Math.random().toString(36).substring(2, 15),
              role: msg.role,
              parts: (msg.parts as JsonValue) || [],
            })),
          },
        },
      })
    })
  },
}

export const messageService = {
  create: async (data: CreateMessageDto) => {
    return await safeExecutePrismaOperation(() =>
      prisma.message.create({
        data,
        include: { chat: true },
      })
    )
  },

  findById: async (id: string) => {
    return await safeExecutePrismaOperation(() =>
      prisma.message.findUnique({
        where: { id },
        include: { chat: true },
      })
    )
  },

  update: async (id: string, data: UpdateMessageDto) => {
    return await safeExecutePrismaOperation(() =>
      prisma.message.update({
        where: { id },
        data,
        include: { chat: true },
      })
    )
  },

  delete: async (id: string) => {
    return await safeExecutePrismaOperation(() =>
      prisma.message.delete({ where: { id } })
    )
  },

  findByChatId: async (chatId: string) => {
    return await safeExecutePrismaOperation(() =>
      prisma.message.findMany({
        where: { chatId },
        include: { chat: true },
        orderBy: { createdAt: 'asc' },
      })
    )
  },
}
;(async () => {
  // console.log(
  //   await chatService.create({
  //     id:"chat-id",
  //     userId: '1a805cb3-a215-4d12-b3a2-b7a03dc639a0',
  //     title:"chat tutle"
  //   })
  // )
  //console.log(await chatService.update('chat-id', {}))
})()
