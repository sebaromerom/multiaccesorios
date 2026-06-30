const enabled = (value: string | undefined) => value?.trim().toLowerCase() === 'true'

function hasValues(...values: Array<string | undefined>) {
  return values.every((value) => Boolean(value?.trim()))
}

export function getCheckoutConfig() {
  const nodeProduction = process.env.NODE_ENV === 'production'
  const webpayMode = (process.env.WEBPAY_ENV ?? 'integration').trim().toLowerCase()
  const webpayProductionReady =
    webpayMode === 'production' &&
    hasValues(
      process.env.WEBPAY_COMMERCE_CODE,
      process.env.WEBPAY_API_KEY,
      process.env.NEXT_PUBLIC_APP_URL
    ) &&
    process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')
  const mercadoPagoEnabled =
    enabled(process.env.CHECKOUT_ENABLE_MERCADOPAGO) &&
    hasValues(
      process.env.MERCADOPAGO_ACCESS_TOKEN,
      process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
      process.env.NEXT_PUBLIC_APP_URL
    ) &&
    process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')
  const transferEnabled =
    enabled(process.env.CHECKOUT_ENABLE_TRANSFER) &&
    hasValues(
      process.env.BANK_ACCOUNT_HOLDER,
      process.env.BANK_NAME,
      process.env.BANK_ACCOUNT_TYPE,
      process.env.BANK_ACCOUNT_NUMBER,
      process.env.BANK_ACCOUNT_RUT
    )

  return {
    webpayEnabled: nodeProduction
      ? webpayProductionReady
      : webpayMode === 'integration' || webpayProductionReady,
    mercadoPagoEnabled,
    transferEnabled,
    bankTransferDetails: transferEnabled
      ? {
          accountHolder: process.env.BANK_ACCOUNT_HOLDER!,
          bankName: process.env.BANK_NAME!,
          accountType: process.env.BANK_ACCOUNT_TYPE!,
          accountNumber: process.env.BANK_ACCOUNT_NUMBER!,
          rut: process.env.BANK_ACCOUNT_RUT!,
        }
      : null,
    paymentLinkEnabled: enabled(process.env.CHECKOUT_ENABLE_PAYMENT_LINK),
    payOnPickupEnabled: process.env.CHECKOUT_ENABLE_PAY_ON_PICKUP !== 'false',
    shippingEnabled: false,
  }
}

export type CheckoutConfig = ReturnType<typeof getCheckoutConfig>

export function getEnabledPaymentMethods(config = getCheckoutConfig()) {
  return [
    ...(config.webpayEnabled ? ['webpay'] as const : []),
    ...(config.mercadoPagoEnabled ? ['mercadopago'] as const : []),
    ...(config.transferEnabled ? ['transfer'] as const : []),
    ...(config.payOnPickupEnabled ? ['pay_on_pickup'] as const : []),
    ...(config.paymentLinkEnabled ? ['payment_link'] as const : []),
  ]
}
