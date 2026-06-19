import { prisma } from '@/lib/prisma'
import type { BannerPosition } from '@/lib/marketing-constants'

export function isMissingMarketingBannerTable(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const code = 'code' in error ? error.code : null
  const message = error instanceof Error ? error.message : String(error)

  return code === 'P2021' || message.includes('MarketingBanner') || message.includes('marketingBanner')
}

export async function getActiveBanner(position: BannerPosition | string) {
  const now = new Date()

  try {
    return await prisma.marketingBanner.findFirst({
      where: {
        position,
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [
          {
            OR: [{ endsAt: null }, { endsAt: { gte: now } }],
          },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })
  } catch (error) {
    if (isMissingMarketingBannerTable(error)) {
      return null
    }

    throw error
  }
}
