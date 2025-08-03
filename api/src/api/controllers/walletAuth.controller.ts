import { Request, Response } from 'express'
import { SIWXSession } from '@reown/appkit-core'

import prisma from '../../db/connection'
import {
  ApiError,
  AuthError,
  ValidationError,
} from '../../middleware/error.middleware'

import {
  AuthenticatedSession,
  GuestSession,
  Session,
} from '../../types/session.types'
import { sessionService } from '../../services/session'
import logger from '../../utils/logger'




export async function addSession(req: Request, res: Response) {
  const session: Session = req.user

  const siwx: SIWXSession = req.body

  if (!siwx || !siwx.data || !siwx.data.accountAddress || !siwx.data.chainId) {
    throw new ValidationError('Invalid session payload')
  }

  if (
    siwx.data.expirationTime &&
    new Date(siwx.data.expirationTime) < new Date()
  ) {
    logger.warn('Expired session provided', {
      expirationTime: siwx.data.expirationTime,
    })
    throw new ApiError('Session is expired', 400)
  }

  let existingUser = await prisma.user.findUnique({
    where: { address: siwx.data.accountAddress },
  })

  if (!existingUser) {
    existingUser = await prisma.user.create({
      data: {
        address: siwx.data.accountAddress,
      },
    })
    logger.info('Created new user', { address: siwx.data.accountAddress })
  }
  if (session.is_guest) {
    const authenticated: AuthenticatedSession = {
      session_id: session.session_id,
      last_reset: session.last_reset,
      message_count: session.message_count,
      is_guest: false,
      auth: {
        address: existingUser.address,
        user_id: existingUser.id,
        wallet_session: [siwx],
        chain_id: siwx.data.chainId,
      },
    }
    await sessionService.updateSession(session.session_id, authenticated)
  } else {
    const updated = {
      address: existingUser.address,
      user_id: existingUser.id,
      wallet_session: [siwx],
      chain_id: siwx.data.chainId,
    }
    await sessionService.updateSession(session.session_id, { auth: updated })
  }

  logger.info('New session added', {
    chainId: siwx.data.chainId,
    address: siwx.data.accountAddress,
  })

  return res.status(200).json({ success: true })
}
/**
 * Retrieve sessions for a user
 */
export async function getSessions(req: Request, res: Response) {
  logger.info('Session retrieval requested getsession(0')

  const chainId = req.query.chainId as string
  const address = req.query.address as string

  if (!chainId || !address) {
    logger.warn('Missing chainId or address in request')
    throw new ValidationError('Missing chainId or address')
  }
  const session: Session = req.user

  // if (!session) {
  //   logger.warn('Invalid session ID', { authId })
  //   return res.status(401).json({ error: 'Invalid session' })
  // }
  // Inside getSessions, after retrieving session
  if (
    !session.is_guest &&
    session.auth.wallet_session &&
    session.auth.wallet_session.length > 0
  ) {
    const siwx = session.auth.wallet_session[0]
    if (
      siwx.data.expirationTime &&
      new Date(siwx.data.expirationTime) < new Date()
    ) {
      logger.warn('SIWX session is expired on GET', {
        sessionId: session.session_id,
        address: address,
      })
      // Option 1: Actively convert to guest and return [] (proactive logout)
      // const guestSession: GuestSession = { /* ... create guest from current session ... */ };
      // await sessionService.updateSession(session.session_id, guestSession);
      // return res.status(200).json({ success: true, result: [] });

      // Option 2: Throw error (as you do), frontend's BackendStorage.get will return []
      // This relies on appkit to then trigger a re-login. This is acceptable.
      throw new AuthError('expired session')
    }
  }
  if (session.is_guest) {
    logger.info('Guest session — returning empty session list')
    return res.status(200).json({ success: true, result: [] })
  }

  if (session.auth.chain_id !== chainId || session.auth.address !== address) {
    logger.warn('Unauthorized session access attempt', {
      sessionChainId: session.auth.chain_id,
      requestedChainId: chainId,
      sessionAddress: session.auth.address,
      requestedAddress: address,
    })
    throw new AuthError('Unauthorized access')
  }

  return res
    .status(200)
    .json({ success: true, result: session.auth.wallet_session })
}
/**
 * Update sessions (Replace all sessions for a user)
 */
export async function updateSessions(req: Request, res: Response) {
  const sessions: SIWXSession[] = req.body
  let existingSession: Session = req.user

  if (!Array.isArray(sessions)) {
    throw new ValidationError('Invalid sessions payload')
  }

  // Handle disconnect (empty sessions array)
  if (sessions.length === 0) {
    const guestSession: GuestSession = {
      is_guest: true,
      session_id: existingSession.session_id,
      message_count: existingSession.message_count,
      last_reset: existingSession.last_reset,
    }
    await sessionService.updateSession(existingSession.session_id, guestSession)
    return res.status(200).json({ success: true })
  }

  // Handle reconnect/update (sessions provided)
  if (existingSession.is_guest) {
    // Guest trying to add sessions - convert to authenticated
    const firstSession = sessions[0]
    let user = await prisma.user.findUnique({
      where: { address: firstSession.data.accountAddress },
    })

    if (!user) {
      user = await prisma.user.create({
        data: { address: firstSession.data.accountAddress },
      })
    }

    const authenticated: AuthenticatedSession = {
      session_id: existingSession.session_id,
      last_reset: existingSession.last_reset,
      message_count: existingSession.message_count,
      is_guest: false,
      auth: {
        address: user.address,
        user_id: user.id,
        wallet_session: [sessions[0]], // Only store first session for single-chain
        chain_id: firstSession.data.chainId,
      },
    }
    await sessionService.updateSession(
      existingSession.session_id,
      authenticated
    )
  } else {
    // Authenticated user updating sessions
    const updated = {
      ...existingSession.auth,
      wallet_session: [sessions[0]], // Replace with new session
    }
    await sessionService.updateSession(existingSession.session_id, {
      auth: updated,
    })
  }

  return res.status(200).json({ success: true })
}

/**
 * Delete/revoke a session
 */
export async function deleteSession(req: Request, res: Response) {
  logger.info('Session deletion requested')

  try {
    const chainId = req.query.chainId as string
    const address = req.query.address as string

    if (!chainId || !address) {
      logger.warn('Missing chainId or address in request')
      return res.status(400).json({ error: 'Missing chainId or address' })
    }

    const authSession = req.user
    if (authSession.is_guest) {
      throw new AuthError('Unauthorised')
    }
    if (
      authSession.auth?.chain_id !== chainId ||
      authSession.auth.address !== address
    ) {
      logger.warn('Unauthorized deletion attempt', {
        sessionChainId: authSession.auth?.chain_id,
        requestedChainId: chainId,
        sessionAddress: authSession.auth?.address,
        requestedAddress: address,
      })
      return res.status(403).json({ error: 'Unauthorized access' })
    }

    await sessionService.deleteSession(authSession.session_id)

    // Clear the cookie
    res.clearCookie('auth_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })

    logger.info('Session deleted successfully')
    return res.status(200).json({ success: true })
  } catch (error) {
    logger.error('Session deletion error', { error })
    throw new ApiError('Failed to revoke session')
  }
}
