import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create some users
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
    },
  })

  // Create some posts
  await prisma.post.upsert({
    where: { id: 'post-1' },
    update: {},
    create: {
      id: 'post-1',
      title: 'Hello World',
      content: 'This is my first post!',
      published: true,
      authorId: user1.id,
    },
  })

  await prisma.post.upsert({
    where: { id: 'post-2' },
    update: {},
    create: {
      id: 'post-2',
      title: 'Getting Started with Prisma',
      content: 'Prisma is a great ORM for Node.js and TypeScript.',
      published: true,
      authorId: user2.id,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('Users created:', { user1: user1.email, user2: user2.email })
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

