import type { Prisma } from '@prisma/client'
import { applyDiscounts } from '@/lib/discounts'

export type OrderStockItem = {
  productId: string
  quantity: number
  size?: string | null
}

export type OrderItemInput = OrderStockItem & {
  unitPrice?: number
}

type OrderProductClient = Pick<Prisma.TransactionClient, 'product' | 'discountRule'>

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrderValidationError'
  }
}

export class OrderStockError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrderStockError'
  }
}

export async function buildValidatedOrderPricing(
  client: OrderProductClient,
  items: OrderItemInput[]
) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderValidationError('El carrito está vacío')
  }

  const normalizedItems = Array.from(
    items.reduce((acc, item) => {
      const normalizedItem = {
        productId: String(item.productId ?? ''),
        quantity: Number(item.quantity ?? 0),
        size: item.size ? String(item.size) : null,
      }
      const key = `${normalizedItem.productId}::${normalizedItem.size ?? ''}`
      const existing = acc.get(key)

      acc.set(key, {
        ...normalizedItem,
        quantity: (existing?.quantity ?? 0) + normalizedItem.quantity,
      })

      return acc
    }, new Map<string, OrderStockItem>()).values()
  )

  if (normalizedItems.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1)) {
    throw new OrderValidationError('Hay productos invalidos en el carrito')
  }

  const productIds = [...new Set(normalizedItems.map((item) => item.productId))]
  const products = await client.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  })

  const pricedItems = normalizedItems.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId)
    if (!product) throw new OrderValidationError('Producto no encontrado')

    const variant = item.size
      ? product.variants.find((candidate) => candidate.size === item.size)
      : null
    if (item.size && !variant) throw new OrderValidationError('Variante no encontrada')

    const availableStock = variant ? variant.stock : product.stock
    if (item.quantity > availableStock) {
      throw new OrderValidationError('Stock insuficiente para completar el pedido')
    }

    return {
      productId: item.productId,
      name: item.size ? `${product.name} (${item.size})` : product.name,
      unitPrice: product.price,
      quantity: item.quantity,
      size: item.size,
    }
  })

  const rules = await client.discountRule.findMany({ where: { active: true } })
  const discountResult = applyDiscounts(
    pricedItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.unitPrice,
      quantity: item.quantity,
    })),
    rules
  )

  return {
    ...discountResult,
    total: Math.round(discountResult.total),
    subtotal: Math.round(discountResult.subtotal),
    discount: Math.round(discountResult.discount),
    items: pricedItems,
  }
}

export async function decrementLocalOrderStock(
  tx: Prisma.TransactionClient,
  items: OrderStockItem[]
) {
  for (const item of items) {
    if (item.size) {
      const variantUpdate = await tx.productVariant.updateMany({
        where: {
          productId: item.productId,
          size: item.size,
          stock: { gte: item.quantity },
        },
        data: { stock: { decrement: item.quantity } },
      })

      if (variantUpdate.count !== 1) {
        throw new OrderStockError('Stock insuficiente en una variante')
      }
    }

    const productUpdate = await tx.product.updateMany({
      where: {
        id: item.productId,
        stock: { gte: item.quantity },
      },
      data: { stock: { decrement: item.quantity } },
    })

    if (productUpdate.count !== 1) {
      throw new OrderStockError('Stock insuficiente en un producto')
    }
  }
}
