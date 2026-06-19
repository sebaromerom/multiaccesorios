import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { adminUnauthorizedResponse, isAdminRequest } from '@/lib/admin-auth'

export async function GET() {
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

  const product = await prisma.product.create({
    data: {
      name: body.name,
      description: body.description,
      price: body.price,
      stock: body.stock,
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
          size: v.size,
          stock: v.stock,
        }))
      } : undefined,
    },
  })

  return NextResponse.json(product)
}
