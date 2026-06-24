const PICKUP_LOCATIONS = new Set(['Chacabuco 479', 'Chacabuco 456'])

export class CheckoutValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CheckoutValidationError'
  }
}

export function validateCheckoutDetails(body: Record<string, unknown>) {
  const customerName = String(body.customerName ?? '').trim()
  const customerPhone = String(body.customerPhone ?? '').trim()
  const customerEmail = String(body.customerEmail ?? '').trim()
  const deliveryType = body.deliveryType === 'despacho' ? 'despacho' : 'retiro'
  const deliverySucursal = String(body.deliverySucursal ?? '').trim()
  const deliveryAddress = String(body.deliveryAddress ?? '').trim()
  const deliveryCity = String(body.deliveryCity ?? '').trim()
  const deliveryNotes = String(body.deliveryNotes ?? '').trim()
  const phoneDigits = customerPhone.replace(/\D/g, '')

  if (customerName.length < 2 || customerName.length > 120) {
    throw new CheckoutValidationError('Ingresa un nombre válido.')
  }
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    throw new CheckoutValidationError('Ingresa un teléfono válido.')
  }
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw new CheckoutValidationError('Ingresa un correo válido.')
  }
  if (deliveryNotes.length > 500) {
    throw new CheckoutValidationError('Las notas del pedido son demasiado extensas.')
  }
  if (deliveryType === 'retiro' && !PICKUP_LOCATIONS.has(deliverySucursal)) {
    throw new CheckoutValidationError('Selecciona una sucursal de retiro válida.')
  }
  if (deliveryType === 'despacho' && (!deliveryAddress || !deliveryCity)) {
    throw new CheckoutValidationError('Completa la dirección y ciudad de despacho.')
  }

  return {
    customerName,
    customerPhone,
    customerEmail: customerEmail || null,
    deliveryType,
    deliverySucursal: deliveryType === 'retiro' ? deliverySucursal : null,
    deliveryAddress: deliveryType === 'despacho' ? deliveryAddress : null,
    deliveryCity: deliveryType === 'despacho' ? deliveryCity : null,
    deliveryNotes: deliveryNotes || null,
  } as const
}
