import { getCheckoutConfig } from '@/lib/checkout-config'

const MERCADOPAGO_API = 'https://api.mercadopago.com'

export type MercadoPagoPreferenceResponse = {
  id: string
  init_point?: string
  sandbox_init_point?: string
}

export type MercadoPagoPayment = {
  id: number
  status: string
  status_detail?: string
  external_reference?: string
  transaction_amount?: number
  currency_id?: string
  payment_method_id?: string
  payment_type_id?: string
  date_approved?: string
}

export class MercadoPagoApiError extends Error {
  status: number
  details: unknown

  constructor(status: number, message: string, details: unknown) {
    super(message)
    this.name = 'MercadoPagoApiError'
    this.status = status
    this.details = details
  }
}

function getAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()
  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no esta configurado')
  }

  return token
}

export function getMercadoPagoBaseUrl(req?: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (appUrl?.startsWith('https://')) return appUrl.replace(/\/$/, '')
  if (req) return new URL(req.url).origin
  return 'http://localhost:3000'
}

export function assertMercadoPagoEnabled() {
  if (!getCheckoutConfig().mercadoPagoEnabled) {
    throw new Error('Mercado Pago no esta habilitado para este ambiente')
  }
}

export async function createMercadoPagoPreference(input: {
  orderId: string
  title: string
  quantity: number
  amount: number
  payer?: {
    name?: string | null
    email?: string | null
    phone?: string | null
  }
  baseUrl: string
}) {
  const notificationUrl = `${input.baseUrl}/api/payments/mercadopago/webhook`
  const returnUrl = `${input.baseUrl}/api/payments/mercadopago/return`

  const response = await fetch(`${MERCADOPAGO_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          id: input.orderId,
          title: input.title,
          quantity: input.quantity,
          unit_price: input.amount,
          currency_id: 'CLP',
        },
      ],
      payer: {
        name: input.payer?.name || undefined,
        email: input.payer?.email || undefined,
        phone: input.payer?.phone
          ? { number: input.payer.phone }
          : undefined,
      },
      external_reference: input.orderId,
      metadata: {
        order_id: input.orderId,
      },
      back_urls: {
        success: returnUrl,
        failure: returnUrl,
        pending: returnUrl,
      },
      auto_return: 'approved',
      notification_url: notificationUrl,
      statement_descriptor: 'MULTI ACCESORIOS',
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new MercadoPagoApiError(
      response.status,
      data?.message ?? data?.error ?? 'Mercado Pago no pudo crear la preferencia',
      data,
    )
  }

  return data as MercadoPagoPreferenceResponse
}

export async function getMercadoPagoPayment(paymentId: string | number) {
  const response = await fetch(`${MERCADOPAGO_API}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new MercadoPagoApiError(
      response.status,
      data?.message ?? data?.error ?? 'No pudimos consultar el pago en Mercado Pago',
      data,
    )
  }

  return data as MercadoPagoPayment
}
