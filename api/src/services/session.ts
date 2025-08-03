import {
  AuthenticatedSession,
  GuestSession,
  Session,
} from '../types/session.types'
import redisClient from '../db/redis'
import logger from '../utils/logger'

export const sessionService = {
  async getSession(sessionId: string): Promise<Session | null> {
    const session = await redisClient.get(sessionId)
    return session ? JSON.parse(session) : null
  },

  async setSession(session: Session): Promise<void> {
    await redisClient.set(session.session_id, JSON.stringify(session))
  },

  async updateSession(
    sessionId: string,
    updates: Partial<Session>
  ): Promise<Session | null> {
    const currentSession = await this.getSession(sessionId)
    if (!currentSession) return null

    let updatedSession: Session

    // Case 1: Converting from guest to authenticated session
    if (
      currentSession.is_guest &&
      (updates.is_guest === false || 'auth' in updates)
    ) {
      if (!('auth' in updates)) {
        throw new Error(
          'Authentication data required for conversion to authenticated session'
        )
      }
      updatedSession = {
        ...currentSession,
        ...updates,
        is_guest: false,
        auth: updates.auth!,
      } as AuthenticatedSession
    }
    // Case 2: Converting from authenticated to guest session
    else if (!currentSession.is_guest && updates.is_guest === true) {
      // Remove auth data when converting to guest
      const { auth, ...sessionWithoutAuth } =
        currentSession as AuthenticatedSession
      updatedSession = {
        ...sessionWithoutAuth,
        ...updates,
        is_guest: true,
      } as GuestSession
    }
    // Case 3: Updating an already authenticated session
    else if (!currentSession.is_guest && 'auth' in currentSession) {
      updatedSession = {
        ...currentSession,
        ...updates,
        is_guest: false,
        // Ensure we preserve existing auth data if not specifically being updated
        auth: 'auth' in updates ? updates.auth! : currentSession.auth,
      } as AuthenticatedSession
    }
    // Case 4: Updating a guest session while keeping it as guest
    else {
      updatedSession = {
        ...currentSession,
        ...updates,
        is_guest: true,
      } as GuestSession
    }

    logger.debug('Updated session', { currentSession, updates, updatedSession })
    await this.setSession(updatedSession)
    return updatedSession
  },

  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await redisClient.del(sessionId)
    return result === 1
  },

  async incrementMessageCount(sessionId: string): Promise<Session | null> {
    const session = await this.getSession(sessionId)
    if (!session) return null
    return await this.updateSession(sessionId, {
      message_count: session.message_count + 1,
    })
  },

  async resetMessageCount(sessionId: string): Promise<Session | null> {
    return await this.updateSession(sessionId, {
      message_count: 0,
      last_reset: new Date(),
    })
  },
}
