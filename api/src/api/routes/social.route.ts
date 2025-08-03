import { Router } from 'express'
import {
  
  getTwitterAnalysis,
} from '../controllers/social.controller'

const router = Router()

router.get('/token/:ca', getTwitterAnalysis)

export default router
