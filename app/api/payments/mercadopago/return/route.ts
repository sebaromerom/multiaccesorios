import { NextResponse } from 'next/server'
import { getMercadoPagoBaseUrl } from '@/lib/mercadopago'
import {
  confirmMercadoPagoPayment,
  getMercadoPagoPaymentIdFromSearchParams,
  mercadoPagoStatusToRedirect,
} from '../confirm'

function redirectTo(req: Request, path: string) {
  return NextResponse.redirect(`${getMercadoPagoBaseUrl(req)}${path}`)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const paymentId = getMercadoPagoPaymentIdFromSearchParams(url.searchParams)
  const fallbackOrderId = url.searchParams.get('external_reference')

  if (!paymentId) {
    return redirectTo(
      req,
      fallbackOrderId
        ? `/shop/success?order=${fallbackOrderId}&payment=unknown`
        : '/shop/success?payment=unknown'
    )
  }

  try {
    const result = await confirmMercadoPagoPayment(paymentId)
    const payment = mercadoPagoStatusToRedirect(result.status)
    const orderId = result.order?.id ?? fallbackOrderId

    return redirectTo(
      req,
      orderId
        ? `/shop/success?order=${orderId}&payment=${payment}`
        : `/shop/success?payment=${payment}`
    )
  } catch (error) {
    console.error('Mercado Pago return error', error)
    return redirectTo(
      req,
      fallbackOrderId
        ? `/shop/success?order=${fallbackOrderId}&payment=failed`
        : '/shop/success?payment=failed'
    )
  }
}
