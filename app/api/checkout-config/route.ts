import { NextResponse } from 'next/server'
import { getCheckoutConfig } from '@/lib/checkout-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const config = getCheckoutConfig()

  return NextResponse.json({
    webpayEnabled: config.webpayEnabled,
    mercadoPagoEnabled: config.mercadoPagoEnabled,
    transferEnabled: config.transferEnabled,
    bankTransferDetails: config.bankTransferDetails,
    paymentLinkEnabled: config.paymentLinkEnabled,
    payOnPickupEnabled: config.payOnPickupEnabled,
    shippingEnabled: config.shippingEnabled,
  })
}
