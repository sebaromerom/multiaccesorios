import { prisma } from '@/lib/prisma'
import { decrementLocalOrderStock, OrderStockError } from '@/lib/orders'
import { getMercadoPagoPayment, type MercadoPagoPayment } from '@/lib/mercadopago'

export async function confirmMercadoPagoPayment(paymentId: string | number) {
  const payment = await getMercadoPagoPayment(paymentId)
  const orderId = payment.external_reference

  if (!orderId) {
    return { payment, order: null, status: 'unknown_order' as const }
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) {
    return { payment, order: null, status: 'unknown_order' as const }
  }

  if (order.paymentStatus === 'paid') {
    return { payment, order, status: 'already_paid' as const }
  }

  const amountMatches = Math.round(Number(payment.transaction_amount ?? 0)) === Math.round(order.total)
  const currencyMatches = !payment.currency_id || payment.currency_id === 'CLP'
  const isApproved = payment.status === 'approved' && amountMatches && currencyMatches
  const paymentReference = String(payment.id)

  if (!isApproved) {
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: payment.status === 'cancelled' || payment.status === 'rejected'
          ? 'payment_failed'
          : 'pending',
        paymentStatus: payment.status === 'cancelled' || payment.status === 'rejected'
          ? 'failed'
          : 'mercadopago_pending',
        paymentProvider: 'mercadopago',
        paymentReference,
      },
      include: { items: true },
    })

    return { payment, order: updatedOrder, status: 'not_approved' as const }
  }

  try {
    const updatedOrder = await prisma.$transaction(async tx => {
      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          paymentStatus: { not: 'paid' },
        },
        data: {
          status: 'paid',
          paymentStatus: 'paid',
          paymentProvider: 'mercadopago',
          paymentReference,
          paidAt: payment.date_approved ? new Date(payment.date_approved) : new Date(),
        },
      })

      if (updated.count > 0) {
        await decrementLocalOrderStock(tx, order.items)
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      })
    })

    return { payment, order: updatedOrder, status: 'approved' as const }
  } catch (error) {
    if (!(error instanceof OrderStockError)) throw error

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'paid_stock_review',
        paymentStatus: 'paid',
        paymentProvider: 'mercadopago',
        paymentReference,
        paidAt: payment.date_approved ? new Date(payment.date_approved) : new Date(),
      },
      include: { items: true },
    })

    return { payment, order: updatedOrder, status: 'approved_stock_review' as const }
  }
}

export function getMercadoPagoPaymentIdFromSearchParams(params: URLSearchParams) {
  return params.get('payment_id') ||
    params.get('collection_id') ||
    params.get('data.id') ||
    params.get('id')
}

export function mercadoPagoStatusToRedirect(status: Awaited<ReturnType<typeof confirmMercadoPagoPayment>>['status']) {
  if (status === 'approved') return 'approved'
  if (status === 'approved_stock_review') return 'approved_stock_review'
  if (status === 'not_approved') return 'failed'
  if (status === 'unknown_order') return 'unknown'
  return 'approved'
}

export type MercadoPagoConfirmation = {
  payment: MercadoPagoPayment
  order: Awaited<ReturnType<typeof prisma.order.findUnique>>
  status: Awaited<ReturnType<typeof confirmMercadoPagoPayment>>['status']
}
