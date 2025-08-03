import { Router } from 'express'
import {
  chat,
  chatDetails,
  chatDelete,
  chatHistory,
  chatUpdate,
  chatCreate
} from '../controllers/chat.controller'
import { authWrapper } from '../../middleware/auth.middleware'
import { asyncHandler } from '../../middleware/error.middleware'

const router = Router()

router.use(authWrapper);


router.post(
  '/',
  asyncHandler(chat)
)
router.post('/create', asyncHandler(chatCreate))
router.get('/history', asyncHandler(chatHistory))

router.get('/:id', asyncHandler(chatDetails))

router.post('/:id', asyncHandler(chatUpdate))

router.delete('/:id', asyncHandler(chatDelete))

export default router
