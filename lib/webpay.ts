import {
  Environment,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
  Options,
  WebpayPlus,
} from 'transbank-sdk'
import { getCheckoutConfig } from '@/lib/checkout-config'

export function getWebpayTransaction() {
  if (!getCheckoutConfig().webpayEnabled) {
    throw new Error('Webpay no está habilitado para este ambiente')
  }

  const mode = (process.env.WEBPAY_ENV ?? 'integration').trim().toLowerCase()
  const commerceCode =
    process.env.WEBPAY_COMMERCE_CODE ??
    IntegrationCommerceCodes.WEBPAY_PLUS
  const apiKey =
    process.env.WEBPAY_API_KEY ??
    IntegrationApiKeys.WEBPAY
  const environment =
    mode === 'production'
      ? Environment.Production
      : Environment.Integration

  return new WebpayPlus.Transaction(
    new Options(commerceCode, apiKey, environment)
  )
}

export function getWebpayBaseUrl(req: Request) {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    new URL(req.url).origin
  )

  return baseUrl.replace(/\/+$/, '')
}

export function buildWebpayIds(orderId: string) {
  const shortId = orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-12)
  const stamp = Date.now().toString(36).toUpperCase()

  return {
    buyOrder: `MA${stamp}${shortId}`.slice(0, 26),
    sessionId: `S${stamp}${shortId}`.slice(0, 61),
  }
}
