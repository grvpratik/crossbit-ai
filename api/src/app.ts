import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'

import routes from './api/routes'

import prisma from './db/connection'
import logger from './utils/logger'

import { errorHandler } from './middleware/error.middleware'
import redisClient from './db/redis'

class App {
  public app: Application

  constructor() {
    this.app = express()
    this.initializeMiddlewares()
    this.initializeRoutes()
    this.initializeRedis()
    this.initializeDatabase()
    this.initializeErrorHandling()
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet())
    //process.env.ALLOWED_ORIGINS?.split(',') ||
    this.app.use(
      cors({
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      })
    )

    
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    this.app.use(compression())

    this.app.use(
      morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
    )
  }

  private initializeRoutes(): void {
    this.app.use('/api', routes)

    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date() })
    })
  }
  private async initializeRedis(): Promise<void> {
    try {
      await redisClient.connect()
     
      logger.info('👥 Redis: ✅')
    } catch (error) {
      logger.error('❌ Redis connection failed:', error)
    }
  }
  private async initializeDatabase(): Promise<void> {
    try {
      await prisma.$connect()
      logger.info('📦 Database: ✅')
    } catch (error) {
      logger.error('❌ Database connection failed:', error)
    }
  }
  private initializeErrorHandling(): void {
    this.app.use(errorHandler)
  }
}

export default new App().app
