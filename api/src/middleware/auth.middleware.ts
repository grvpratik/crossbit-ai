import { SIWXSession } from '@reown/appkit-core'
import { NextFunction, Request, Response } from 'express'
import redisClient from '../db/redis'
import { Session } from '../types/session.types'
import logger from '../utils/logger'
declare global {
  namespace Express {
    interface Request {
      user: Session
    }
  }
}



export async function authWrapper(
  req: Request,
  res: Response,
  next: NextFunction
) {
  
  const authId = await getAuthId(req)
  logger.debug(`AUTH ID MIDDLEWARE${authId}`)
  let session: Session

  if (!authId) {
    logger.debug("creating new sesison id ()()()()")
    const sessionId = crypto.randomUUID()
    session = {
      session_id: sessionId,
      is_guest: true,
      message_count: 0,
      last_reset: new Date(),
    }

    const expires = new Date()
    expires.setDate(expires.getDate() + 7)
    res.cookie('auth_id', sessionId, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
  } else {
    const existingSession = await redisClient.get(authId)
    if (existingSession) {
      session = JSON.parse(existingSession)
    } else {
      session = {
        session_id: authId,
        is_guest: true,
        message_count: 0,
        last_reset: new Date(),
      }
    }
  }

  await redisClient.set(session.session_id, JSON.stringify(session))

  // console.log(session, 'auth middleware')
  req.user = session
  next()
}

export async function getAuthId(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.cookie || ''
  // console.log(req.headers,"header ")
  const authId = cookieHeader
    .split('; ')
    .find((s) => s.startsWith('auth_id='))
    ?.split('=')[1]

  return authId || null
}
