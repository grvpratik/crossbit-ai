import dotenv from 'dotenv'

dotenv.config()

import app from './app'
import logger from './utils/logger'
import prisma from './db/connection'

const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

const server = app.listen(PORT, () => {
  logger.info(`🚀 ${NODE_ENV.toUpperCase()}: ${PORT}`)
  // logger.info(
  // 	`📝 API Documentation available at http://localhost:${PORT}/api-docs`
  // );
})

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`)

  server.close(async () => {
    logger.info('HTTP server closed')
    try {
      await prisma.$disconnect()
      logger.info('🛑 Prisma disconnected')
    } catch (err) {
      logger.error('Error disconnecting Prisma:', err)
    }

    process.exit(0)
  })

  setTimeout(() => {
    logger.error(
      'Could not close connections in time, forcefully shutting down'
    )
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

 export default server
