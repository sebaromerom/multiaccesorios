import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

export const ADMIN_SESSION_COOKIE = 'multi_admin_session'

const SESSION_TTL_SECONDS = 60 * 60 * 8

type AdminSessionPayload = {
  role: 'admin'
  exp: number
}

function getSecret() {
  return process.env.NEXTAUTH_SECRET || process.env.ADMIN_PASSWORD || 'dev-admin-secret'
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('base64url')
}

function encode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer)
}

export function createAdminSessionToken() {
  const payload: AdminSessionPayload = {
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }
  const encodedPayload = encode(JSON.stringify(payload))
  return `${encodedPayload}.${sign(encodedPayload)}`
}

export function verifyAdminSessionToken(token?: string | null) {
  if (!token) return false

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature || !safeEqual(signature, sign(encodedPayload))) {
    return false
  }

  try {
    const payload = JSON.parse(decode(encodedPayload)) as AdminSessionPayload
    return payload.role === 'admin' && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export async function hasAdminSession() {
  const cookieStore = await cookies()
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }
}
