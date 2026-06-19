import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrementLocalOrderStock, OrderStockError } from '@/lib/orders'
import { getWebpayBaseUrl, getWebpayTransaction } from '@/lib/webpay'

function redirectTo(req: Request, path: string) {
  return NextResponse.redirect(`${getWebpayBaseUrl(req)}${path}`)
}

type WebpayReturnParams = {
  tokenWs: string | null
  tbkToken: string | null
  tbkSessionId: string | null
  tbkBuyOrder: string | null
}

function readParams(source: URLSearchParams): WebpayReturnParams {
  return {
    tokenWs: source.get('token_ws'),
    tbkToken: source.get('TBK_TOKEN'),
    tbkSessionId: source.get('TBK_ID_SESION'),
    tbkBuyOrder: source.get('TBK_ORDEN_COMPRA'),
  }
}

async function getReturnParams(req: Request): Promise<WebpayReturnParams> {
  const url = new URL(req.url)
  const queryParams = readParams(url.searchParams)
  if (queryParams.tokenWs || queryParams.tbkToken || queryParams.tbkSessionId || queryParams.tbkBuyOrder) {
    return queryParams
  }

  try {
    const formData = await req.formData()
    return {
      tokenWs: typeof formData.get('token_ws') === 'string' ? String(formData.get('token_ws')) : null,
      tbkToken: typeof formData.get('TBK_TOKEN') === 'string' ? String(formData.get('TBK_TOKEN')) : null,
      tbkSessionId: typeof formData.get('TBK_ID_SESION') === 'string' ? String(formData.get('TBK_ID_SESION')) : null,
      tbkBuyOrder: typeof formData.get('TBK_ORDEN_COMPRA') === 'string' ? String(formData.get('TBK_ORDEN_COMPRA')) : null,
    }
  } catch {
    return {
      tokenWs: null,
      tbkToken: null,
      tbkSessionId: null,
      tbkBuyOrder: null,
    }
  }
}

async function commitWebpay(req: Request) {
  const params = await getReturnParams(req)
  const token = params.tokenWs

  if (!token && !params.tbkToken && !params.tbkSessionId && !params.tbkBuyOrder) {
    return redirectTo(req, '/shop/success?payment=cancelled')
  }

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        ...(token ? [{ webpayToken: token }] : []),
        ...(params.tbkToken ? [{ webpayToken: params.tbkToken }] : []),
        ...(params.tbkBuyOrder ? [{ webpayBuyOrder: params.tbkBuyOrder }] : []),
        ...(params.tbkSessionId ? [{ webpaySessionId: params.tbkSessionId }] : []),
      ],
    },
    include: { items: true },
  })

  if (!order) {
    return redirectTo(req, '/shop/success?payment=unknown')
  }

  if (order.paymentStatus === 'paid') {
    return redirectTo(req, `/shop/success?order=${order.id}`)
  }

  if (!token) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'payment_cancelled',
        paymentStatus: 'cancelled',
        paymentProvider: 'webpay',
      },
    })

    return redirectTo(req, `/shop/success?order=${order.id}&payment=cancelled`)
  }

  const transaction = getWebpayTransaction()
  let result

  try {
    result = await transaction.commit(token)
  } catch (error) {
    console.error('Webpay commit error', error)
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'payment_failed',
        paymentStatus: 'failed',
        paymentProvider: 'webpay',
      },
    })

    return redirectTo(req, `/shop/success?order=${order.id}&payment=failed`)
  }

  const responseCode = Number(result.response_code)
  const amountMatches = Math.round(Number(result.amount ?? 0)) === Math.round(order.total)
  const buyOrderMatches = !result.buy_order || result.buy_order === order.webpayBuyOrder
  const sessionMatches = !result.session_id || result.session_id === order.webpaySessionId
  const isApproved = responseCode === 0 && amountMatches && buyOrderMatches && sessionMatches

  const paymentData = {
    paymentProvider: 'webpay',
    webpayResponseCode: Number.isNaN(responseCode) ? null : responseCode,
    webpayAuthorizationCode: result.authorization_code ?? null,
    webpayCardLastDigits: result.card_detail?.card_number ?? null,
    webpayInstallmentsNumber:
      typeof result.installments_number === 'number'
        ? result.installments_number
        : Number.isFinite(Number(result.installments_number))
          ? Number(result.installments_number)
          : null,
  }

  if (!isApproved) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        ...paymentData,
        status: 'payment_failed',
        paymentStatus: 'failed',
      },
    })

    return redirectTo(req, `/shop/success?order=${order.id}&payment=failed`)
  }

  try {
    await prisma.$transaction(async tx => {
      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          paymentStatus: { not: 'paid' },
        },
        data: {
          ...paymentData,
          status: 'paid',
          paymentStatus: 'paid',
          paidAt: new Date(),
        },
      })

      if (updated.count === 0) return

      await decrementLocalOrderStock(tx, order.items)
    })
  } catch (error) {
    if (!(error instanceof OrderStockError)) throw error

    await prisma.order.update({
      where: { id: order.id },
      data: {
        ...paymentData,
        status: 'paid_stock_review',
        paymentStatus: 'paid',
        paidAt: new Date(),
      },
    })

    return redirectTo(req, `/shop/success?order=${order.id}&payment=approved_stock_review`)
  }

  return redirectTo(
    req,
    `/shop/success?order=${order.id}&payment=approved`
  )
}

export async function GET(req: Request) {
  return commitWebpay(req)
}

export async function POST(req: Request) {
  return commitWebpay(req)
}
