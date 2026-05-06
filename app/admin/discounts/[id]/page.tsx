import { prisma } from '@/lib/prisma'
import EditDiscountForm from './EditDiscountForm'
import { notFound } from 'next/navigation'

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const discount = await prisma.discountRule.findUnique({
    where: { id },
  })

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
  })

  if (!discount) notFound()

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-lg">
        <h1 className="text-5xl mb-8">Editar Descuento</h1>
        <EditDiscountForm discount={discount} products={products} />
      </div>
    </div>
  )
}