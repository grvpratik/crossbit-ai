import { PrismaClient } from '../generated/prisma'

import { withAccelerate } from '@prisma/extension-accelerate'
const prisma = new PrismaClient()

export default prisma;
