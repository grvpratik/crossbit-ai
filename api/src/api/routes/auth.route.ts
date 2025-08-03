import { Router } from 'express'
import {
  addSession,
  deleteSession,
  getSessions,
  updateSessions,
} from '../controllers/walletAuth.controller'
import { asyncHandler } from '../../middleware/error.middleware'
import { authWrapper } from '../../middleware/auth.middleware'

const router = Router()
router.use(authWrapper)
router.post(
  '/sessions',
  //validateRequest("createConversation"),
  asyncHandler(addSession)
)

router.get(
  '/sessions',
  //validateRequest("createConversation"),
  asyncHandler(getSessions)
)
router.delete(
  '/sessions',
  //validateRequest("createConversation"),
  asyncHandler(deleteSession)
)
router.put(
  '/sessions',
  //validateRequest("createConversation"),
  asyncHandler(updateSessions)
)
export default router
