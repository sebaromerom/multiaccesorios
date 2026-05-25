import { prisma } from '@/lib/prisma'
import EditProductForm from './EditProductForm'
import { notFound } from 'next/navigation'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: {
      id,
    },

    include: {
      images: {
        orderBy: {
          order: 'asc',
        },
      },

      variants: {
        include: {
          images: {
            orderBy: {
              order: 'asc',
            },
          },
        },

        orderBy: {
          size: 'asc',
        },
      },
    },
  })

  if (!product) {
    notFound()
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-lg">
        <h1 className="text-5xl mb-8">
          Editar Producto
        </h1>

        <EditProductForm product={product} />
      </div>
    </div>
  )
}