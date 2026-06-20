import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import MarketingBannerForm from '../MarketingBannerForm'
import { requireAdminPage } from '@/lib/admin-auth'

export default async function EditMarketingBannerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminPage()

  const { id } = await params
  const banner = await prisma.marketingBanner.findUnique({ where: { id } })

  if (!banner) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="admin-page-title">Editar banner</h1>
        <p className="admin-page-kicker">Ajusta contenido, fechas y ubicación de la campaña.</p>
      </div>
      <MarketingBannerForm banner={banner} />
    </div>
  )
}
