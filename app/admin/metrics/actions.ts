'use server'
import { prisma } from '@/lib/prisma'

export async function getDetailedMetrics() {
  const [totalSales, orderCount, lowStock, bestSellersData, salesByCategory] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.count(),
    prisma.product.findMany({
      where: { stock: { lt: 5, gt: 0 } },
      orderBy: { stock: 'asc' },
      select: { name: true, stock: true, category: true },
      take: 20,
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 8,
    }),
    prisma.orderItem.findMany({
      include: { product: { select: { category: true } } },
    }),
  ])

  const productNames = await prisma.product.findMany({
    where: { id: { in: bestSellersData.map(b => b.productId) } },
    select: { id: true, name: true, imageUrl: true, price: true },
  })

  const categoryTotals: Record<string, number> = {}
  for (const item of salesByCategory) {
    const cat = item.product.category ?? 'Otros'
    categoryTotals[cat] = (categoryTotals[cat] ?? 0) + item.quantity * item.unitPrice
  }

  return {
    totalRevenue: totalSales._sum.total ?? 0,
    orderCount,
    avgOrderValue: (totalSales._sum.total ?? 0) / (orderCount || 1),
    lowStockAlerts: lowStock,
    bestSellers: bestSellersData.map(b => ({
      name: productNames.find(p => p.id === b.productId)?.name ?? 'Desconocido',
      imageUrl: productNames.find(p => p.id === b.productId)?.imageUrl ?? null,
      price: productNames.find(p => p.id === b.productId)?.price ?? 0,
      quantity: b._sum.quantity ?? 0,
    })),
    salesByCategory: Object.entries(categoryTotals).map(([name, value]) => ({ name, value })),
  }
}