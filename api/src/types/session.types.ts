import { SIWXSession } from "@reown/appkit-core"

export type GuestSession = {
  session_id: string
  is_guest: true
  message_count: number
  last_reset: Date
}

export type AuthenticatedSession = {
  session_id: string
  is_guest: false
  message_count: number
  last_reset: Date
  auth: AuthSession
}

export type Session = GuestSession | AuthenticatedSession

export interface AuthSession {
  user_id: string
  chain_id: string
  address: string
  wallet_session: SIWXSession[]
}