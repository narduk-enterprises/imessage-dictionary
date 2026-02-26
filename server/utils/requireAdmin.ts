import { getAuthSession } from './auth'
import type { H3Event } from 'h3'

/**
 * Require the current user to be an authenticated admin.
 * Throws 401 if not authenticated, 403 if not admin.
 */
export async function requireAdmin(event: H3Event) {
  const sessionId = getCookie(event, 'session')
  if (!sessionId) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const result = await getAuthSession(sessionId)
  if (!result) {
    throw createError({ statusCode: 401, message: 'Invalid or expired session' })
  }
  if (!result.user.isAdmin) {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }
  return result.user
}
