import { NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminCookieOptions,
} from '@/lib/admin-session'
import { enforceRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const rateLimited = enforceRateLimit(req, 'admin-login', 8, 60_000)
  if (rateLimited) return rateLimited

  if (!process.env.ADMIN_USERNAME?.trim() || !process.env.ADMIN_PASSWORD?.trim()) {
    return NextResponse.json({ ok: false, error: 'Admin no configurado' }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const username = String(body?.username ?? '')
  const password = String(body?.password ?? '')

  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'Credenciales invalidas' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), getAdminCookieOptions())
  return response
}
