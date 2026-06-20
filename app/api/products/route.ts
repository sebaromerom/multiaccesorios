import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { adminUnauthorizedResponse, isAdminRequest } from '@/lib/admin-auth'

export async function GET() {
  if (!(await isAdminRequest())) {
    return adminUnauthorizedResponse()
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(products)
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return adminUnauthorizedResponse()
  }

  const body = await req.json()
  const name = String(body.name ?? '').trim()
  const price = Number(body.price)
  const stock = Number(body.stock)

  if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock < 0) {
    return NextResponse.json(
      { ok: false, error: 'Nombre, precio y stock del producto no son validos.' },
      { status: 400 }
    )
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: body.description,
      price,
      stock,
      imageUrl: body.imageUrl ?? null,
      category: body.category ?? null,
      images: body.images?.length > 0 ? {
        create: body.images.map((url: string, index: number) => ({
          url,
          order: index,
        }))
      } : undefined,
      variants: body.variants?.length > 0 ? {
        create: body.variants.map((v: { size: string; stock: number }) => ({
          size: String(v.size ?? '').trim(),
          stock: Math.max(0, Number(v.stock ?? 0)),
        }))
      } : undefined,
    },
  })

  return NextResponse.json(product)
}
