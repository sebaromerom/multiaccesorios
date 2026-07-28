import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { isAdminBypassEnabled } from '@/lib/admin-auth'
import { getCheckoutConfig, getEnabledPaymentMethods } from '@/lib/checkout-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    const checkout = getCheckoutConfig()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
    const adminReady = Boolean(
      process.env.ADMIN_USERNAME?.trim() &&
      process.env.ADMIN_PASSWORD?.trim() &&
      process.env.NEXTAUTH_SECRET?.trim()
    )
    const checks = {
      database: 'ok',
      appUrl: appUrl?.startsWith('https://') ? 'ok' : 'missing',
      adminCredentials: adminReady ? 'ok' : 'missing',
      adminBypass: isAdminBypassEnabled() ? 'unsafe' : 'off',
      mercadoPago: checkout.mercadoPagoEnabled ? 'enabled' : 'disabled',
      checkoutMethods: getEnabledPaymentMethods(checkout),
      shipping: checkout.shippingEnabled ? 'enabled' : 'disabled',
    }

    return NextResponse.json(
      {
        status: Object.values(checks).includes('missing') || checks.adminBypass === 'unsafe'
          ? 'attention'
          : 'ok',
        checks,
        timestamp: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json(
      {
        status: 'unavailable',
        checks: { database: 'error' },
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    )
  }
}
