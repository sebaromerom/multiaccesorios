import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildValidatedOrderPricing, OrderValidationError } from '@/lib/orders'
import { getCheckoutConfig } from '@/lib/checkout-config'
import { CheckoutValidationError, validateCheckoutDetails } from '@/lib/checkout-validation'
import { enforceRateLimit } from '@/lib/rate-limit'
import {
  assertMercadoPagoEnabled,
  createMercadoPagoPreference,
  getMercadoPagoBaseUrl,
} from '@/lib/mercadopago'

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'mercadopago-create', 10, 10 * 60_000)
  if (limited) return limited

  try {
    assertMercadoPagoEnabled()
    const body = await req.json()
    const checkoutConfig = getCheckoutConfig()

    if (body.deliveryType === 'despacho' && !checkoutConfig.shippingEnabled) {
      return NextResponse.json(
        { error: 'El despacho aun no esta habilitado. Selecciona retiro en tienda.' },
        { status: 400 }
      )
    }

    const checkoutDetails = validateCheckoutDetails(body)
    const pricing = await buildValidatedOrderPricing(prisma, body.items ?? [])

    if (pricing.total <= 0) {
      return NextResponse.json(
        { error: 'El total no es valido para Mercado Pago' },
        { status: 400 }
      )
    }

    const order = await prisma.order.create({
      data: {
        total: pricing.total,
        status: 'pending',
        paymentMethod: 'mercadopago',
        paymentStatus: 'mercadopago_pending',
        paymentProvider: 'mercadopago',
        ...checkoutDetails,
        items: {
          create: pricing.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            size: item.size,
          })),
        },
      },
    })

    try {
      const preference = await createMercadoPagoPreference({
        orderId: order.id,
        title: `Pedido Multi Accesorios #${order.id.slice(0, 8).toUpperCase()}`,
        quantity: 1,
        amount: pricing.total,
        payer: {
          name: checkoutDetails.customerName,
          email: checkoutDetails.customerEmail,
          phone: checkoutDetails.customerPhone,
        },
        baseUrl: getMercadoPagoBaseUrl(req),
      })

      const redirectUrl = preference.init_point ?? preference.sandbox_init_point

      if (!preference.id || !redirectUrl) {
        throw new Error('Mercado Pago no entrego URL de checkout')
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentReference: preference.id,
          paymentUrl: redirectUrl,
        },
      })

      return NextResponse.json({
        orderId: order.id,
        preferenceId: preference.id,
        url: redirectUrl,
      })
    } catch (error) {
      console.error('Mercado Pago create error', error)

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'payment_failed',
          paymentStatus: 'mercadopago_create_failed',
        },
      })

      return NextResponse.json(
        { error: 'No pudimos iniciar Mercado Pago. Intenta nuevamente.' },
        { status: 502 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof OrderValidationError || error instanceof CheckoutValidationError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Pedido invalido para Mercado Pago',
      },
      { status: 400 }
    )
  }
}
