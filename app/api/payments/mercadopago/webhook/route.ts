import { NextResponse } from 'next/server'
import {
  confirmMercadoPagoPayment,
  getMercadoPagoPaymentIdFromSearchParams,
} from '../confirm'

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    let paymentId = getMercadoPagoPaymentIdFromSearchParams(url.searchParams)

    if (!paymentId) {
      const body = await req.json().catch(() => null)
      paymentId = body?.data?.id ? String(body.data.id) : null
    }

    if (!paymentId) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    await confirmMercadoPagoPayment(paymentId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Mercado Pago webhook error', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const paymentId = getMercadoPagoPaymentIdFromSearchParams(url.searchParams)

  if (paymentId) {
    await confirmMercadoPagoPayment(paymentId)
  }

  return NextResponse.json({ ok: true })
}
