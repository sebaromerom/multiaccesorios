import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SafeProductImage from '@/components/SafeProductImage'
import DeleteMarketingBannerButton from './DeleteMarketingBannerButton'
import { BANNER_POSITIONS } from '@/lib/marketing-constants'
import { isMissingMarketingBannerTable } from '@/lib/marketing'

function positionLabel(value: string) {
  return BANNER_POSITIONS.find((item) => item.value === value)?.label ?? value
}

function dateLabel(value: Date | null) {
  return value ? value.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : 'Sin límite'
}

async function getMarketingBanners() {
  try {
    return await prisma.marketingBanner.findMany({
      orderBy: [{ position: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    })
  } catch (error) {
    if (isMissingMarketingBannerTable(error)) {
      return []
    }

    throw error
  }
}

export default async function MarketingPage() {
  const banners = await getMarketingBanners()
  const now = new Date()

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="admin-page-title">Marketing</h1>
          <p className="admin-page-kicker">Banners y campañas visibles en la tienda.</p>
        </div>
        <Link href="/admin/marketing/new">
          <Button className="w-full rounded-[4px] bg-red-600 px-5 py-5 text-xs font-bold text-white hover:bg-red-700 sm:w-auto">
            Agregar banner
          </Button>
        </Link>
      </div>

      {banners.length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-zinc-300 bg-white px-5 py-16 text-center">
          <p className="text-sm font-bold">No hay banners configurados.</p>
          <p className="mt-2 text-xs text-zinc-500">Crea el primero para activar promociones sin tocar código.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {banners.map((banner) => {
            const isInDate = (!banner.startsAt || banner.startsAt <= now) && (!banner.endsAt || banner.endsAt >= now)
            const isLive = banner.active && isInDate

            return (
              <article key={banner.id} className="grid gap-4 rounded-[6px] border border-zinc-200 bg-white p-4 md:grid-cols-[180px_1fr_auto] md:items-center">
                <div className="relative aspect-[16/9] overflow-hidden rounded-[5px] border border-zinc-200 bg-zinc-50">
                  <SafeProductImage
                    src={banner.imageUrl ?? banner.mobileImageUrl}
                    alt={banner.title}
                    fill
                    sizes="180px"
                    imageClassName="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className={`rounded-[3px] text-[10px] uppercase ${isLive ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {isLive ? 'Publicado' : banner.active ? 'Programado' : 'Inactivo'}
                    </Badge>
                    <span className="text-[11px] font-bold text-zinc-500">{positionLabel(banner.position)}</span>
                    <span className="text-[11px] font-bold text-zinc-400">Prioridad {banner.priority}</span>
                  </div>
                  <h2 className="text-base font-extrabold">{banner.title}</h2>
                  {banner.subtitle && <p className="mt-1 text-sm text-zinc-600">{banner.subtitle}</p>}
                  <p className="mt-2 truncate text-xs font-semibold text-red-600">{banner.href}</p>
                  <p className="mt-2 text-[11px] text-zinc-500">
                    {dateLabel(banner.startsAt)} - {dateLabel(banner.endsAt)}
                  </p>
                </div>
                <div className="flex gap-2 md:justify-end">
                  <Link href={`/admin/marketing/${banner.id}`}>
                    <Button variant="outline" size="sm">Editar</Button>
                  </Link>
                  <DeleteMarketingBannerButton id={banner.id} />
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
