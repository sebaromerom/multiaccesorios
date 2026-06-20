import { prisma } from '@/lib/prisma'
import EditProductForm from './EditProductForm'
import { notFound } from 'next/navigation'
import { requireAdminPage } from '@/lib/admin-auth'

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireAdminPage()

  const { id } = await params
  
  // 🎒 RESOLVEMOS LOS FILTROS Y LOS PREPARAMOS PARA EL FORMULARIO
  const resolvedSearchParams = await searchParams
  const returnQueryString = new URLSearchParams(
    resolvedSearchParams as Record<string, string>
  ).toString()

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

        {/* Le pasamos la mochila de filtros (returnQuery) al formulario */}
        <EditProductForm product={product} returnQuery={returnQueryString} />
      </div>
    </div>
  )
}
