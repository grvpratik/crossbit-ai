import prisma from '../db/connection'
import { User, Chat } from '../generated/prisma'
import { safeExecutePrismaOperation } from '../middleware/error.middleware'

export interface CreateUserDto {
  address: string
  name?: string
}

export interface UpdateUserDto {
  name?: string
  address?: string
}

export const userService = {
  create: async (data: CreateUserDto) => {
    return await safeExecutePrismaOperation(() => prisma.user.create({ data }))
},
createOrUpdate: async (address: string) => {
    return await safeExecutePrismaOperation(() =>
        prisma.user.upsert({
            where: { address },
            create: { address },
            update: { address },
            include: { chats: true },
        })
    )
},

findByAddress: async (address: string) => {
    return await safeExecutePrismaOperation(() =>
        prisma.user.findUnique({
            where: { address },
            include: { chats: true },
        })
    )
},

findById: async (id: string) => {
    return await safeExecutePrismaOperation(() =>
        prisma.user.findUnique({
            where: { id },
            include: { chats: true },
        })
    )
},

update: async (id: string, data: UpdateUserDto) => {
    return await safeExecutePrismaOperation(() =>
        prisma.user.update({
            where: { id },
            data,
            include: { chats: true },
        })
    )
},

delete: async (id: string) => {
    return await safeExecutePrismaOperation(() =>
        prisma.user.delete({ where: { id } })
    )
},

findAll: async () => {
    return await safeExecutePrismaOperation(() =>
      prisma.user.findMany({
        include: { chats: true },
      })
    )
  },
};
