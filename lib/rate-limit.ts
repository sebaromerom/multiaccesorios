import { NextResponse } from 'next/server'

type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitStore = Map<string, RateLimitEntry>

const globalForRateLimit = globalThis as unknown as {
  checkoutRateLimit?: RateLimitStore
}

const store = globalForRateLimit.checkoutRateLimit ?? new Map<string, RateLimitEntry>()

if (process.env.NODE_ENV !== 'production') {
  globalForRateLimit.checkoutRateLimit = store
}

function getClientId(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  return forwardedFor?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
}

export function enforceRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now()
  const key = `${scope}:${getClientId(request)}`
  const current = store.get(key)

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un momento y vuelve a intentar.' },
      {
        status: 429,
        headers: { 'Retry-After': retryAfter.toString() },
      }
    )
  }

  current.count += 1
  return null
}
