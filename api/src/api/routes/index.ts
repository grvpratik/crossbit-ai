import { Router } from 'express'
import chatRoutes from './chat.routes'
import authRoutes from './auth.route'
import onChainRoutes from './onchain.route'
import socialRoutes from './social.route'
import reportRoutes from './report.route'

const router = Router()

// API Routes
router.use('/auth', authRoutes)
router.use('/chat', chatRoutes)
router.use('/onchain', onChainRoutes)
router.use('/social', socialRoutes)
router.use('/report', reportRoutes)

export default router

// Export individual routes for potential direct usage
export { chatRoutes, authRoutes, onChainRoutes, socialRoutes, reportRoutes }
