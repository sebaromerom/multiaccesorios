import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ClearCartOnPaid from './ClearCartOnPaid'

const paymentLabel = (method?: string | null, status?: string | null) => {
  if (method === 'webpay' && status === 'paid') return 'Webpay aprobado'
  if (method === 'webpay' && status === 'failed') return 'Webpay rechazado'
  if (method === 'webpay' && status === 'cancelled') return 'Webpay cancelado'
  if (method === 'webpay' && status === 'webpay_create_failed') return 'Webpay no iniciado'
  if (method === 'webpay') return 'Webpay pendiente'
  if (status === 'pay_on_pickup') return 'Pago al retirar'
  if (status === 'payment_link_pending') return 'Link de pago pendiente'
  if (status === 'paid') return 'Pago confirmado'
  if (method === 'transfer') return 'Transferencia pendiente'
  return 'Pago pendiente'
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; payment?: string }>
}) {
  const { order: orderId, payment } = await searchParams
  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          total: true,
          paymentMethod: true,
          paymentStatus: true,
          status: true,
          paymentReference: true,
          webpayCardLastDigits: true,
        },
      })
    : null
  const headline =
    payment === 'failed'
      ? 'Pago no confirmado'
      : payment === 'cancelled'
        ? 'Pago cancelado'
        : payment === 'unknown'
          ? 'Operación no encontrada'
          : 'Gracias por tu compra'
  const kicker =
    payment === 'failed' || payment === 'cancelled' || payment === 'unknown'
      ? 'Estado del pago'
      : 'Orden confirmada'
  const message =
    payment === 'failed'
      ? 'No pudimos confirmar el pago. El pedido quedó registrado para revisión.'
      : payment === 'cancelled'
        ? 'El pago fue cancelado antes de finalizar.'
        : payment === 'unknown'
          ? 'No encontramos una orden asociada a este retorno de pago.'
          : payment === 'approved_stock_review'
            ? 'Webpay aprobó el pago. El equipo revisará el stock antes de preparar la entrega.'
            : 'Tu orden fue registrada exitosamente.'

  return (
    <div
      className="mx-auto max-w-2xl px-5 py-20 text-center"
      style={{ animation: 'fadeInUp 0.6s ease forwards', opacity: 0 }}
    >
      <p
        className="text-xs tracking-widest uppercase text-muted-foreground mb-4"
        style={{ animation: 'fadeInUp 0.5s ease 0.1s forwards', opacity: 0 }}
      >
        {kicker}
      </p>
      <h1
        className="text-6xl mb-4"
        style={{ animation: 'fadeInUp 0.5s ease 0.2s forwards', opacity: 0 }}
      >
        {headline}
      </h1>
      <p
        className="text-muted-foreground mb-12"
        style={{ animation: 'fadeInUp 0.5s ease 0.3s forwards', opacity: 0 }}
      >
        {message}
      </p>
      {order?.paymentStatus === 'paid' && <ClearCartOnPaid />}
      {order && (
        <div
          className="mb-10 rounded-[6px] border border-zinc-200 bg-white p-5 text-left"
          style={{ animation: 'fadeInUp 0.5s ease 0.35s forwards', opacity: 0 }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Operación</p>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-zinc-500">Pedido</p>
              <p className="font-mono font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-zinc-500">Total</p>
              <p className="font-bold text-red-600">${order.total.toLocaleString('es-CL')}</p>
            </div>
            <div>
              <p className="text-zinc-500">Pago</p>
              <p className="font-bold">{paymentLabel(order.paymentMethod, order.paymentStatus)}</p>
            </div>
            {order.paymentReference && (
              <div>
                <p className="text-zinc-500">Referencia</p>
                <p className="font-mono font-bold">{order.paymentReference}</p>
              </div>
            )}
            {order.webpayCardLastDigits && (
              <div>
                <p className="text-zinc-500">Tarjeta</p>
                <p className="font-mono font-bold">**** {order.webpayCardLastDigits}</p>
              </div>
            )}
          </div>
          {order.status === 'paid_stock_review' && (
            <p className="mt-4 rounded-[4px] bg-amber-50 px-3 py-3 text-xs font-semibold text-amber-900">
              El pago fue aprobado, pero el stock necesita revisión manual antes de preparar el pedido.
            </p>
          )}
          {order.paymentMethod === 'transfer' && (
            <p className="mt-4 rounded-[4px] bg-green-50 px-3 py-3 text-xs font-semibold text-green-900">
              Envía el comprobante por WhatsApp indicando tu referencia para confirmar el pedido.
            </p>
          )}
        </div>
      )}
      <div
        className="flex gap-4 justify-center"
        style={{ animation: 'fadeInUp 0.5s ease 0.4s forwards', opacity: 0 }}
      >
        <Link href="/shop">
          <Button variant="outline">Seguir comprando</Button>
        </Link>
        <Link href="/admin/orders">
          <Button>Ver órdenes</Button>
        </Link>
      </div>
    </div>
  )
}
