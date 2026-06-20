import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminUnauthorizedResponse, isAdminRequest } from '@/lib/admin-auth'
import { isMissingMarketingBannerTable } from '@/lib/marketing'

function parseOptionalDate(value: unknown) {
  if (!value || typeof value !== 'string') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function bannerDataFromBody(body: Record<string, unknown>) {
  return {
    title: String(body.title ?? '').trim(),
    subtitle: body.subtitle ? String(body.subtitle).trim() : null,
    eyebrow: body.eyebrow ? String(body.eyebrow).trim() : null,
    imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
    mobileImageUrl: body.mobileImageUrl ? String(body.mobileImageUrl).trim() : null,
    href: String(body.href ?? '/shop').trim(),
    position: String(body.position ?? 'home_hero').trim(),
    active: Boolean(body.active ?? true),
    priority: Number(body.priority ?? 0),
    startsAt: parseOptionalDate(body.startsAt),
    endsAt: parseOptionalDate(body.endsAt),
  }
}

export async function GET() {
  if (!(await isAdminRequest())) {
    return adminUnauthorizedResponse()
  }

  try {
    const banners = await prisma.marketingBanner.findMany({
      orderBy: [{ position: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(banners)
  } catch (error) {
    if (isMissingMarketingBannerTable(error)) {
      return NextResponse.json([])
    }

    throw error
  }
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return adminUnauthorizedResponse()
  }

  const body = await req.json().catch(() => ({}))
  const data = bannerDataFromBody(body)

  if (!data.title || !data.href || !data.position) {
    return NextResponse.json(
      { ok: false, error: 'Título, link y posición son obligatorios.' },
      { status: 400 }
    )
  }

  const banner = await prisma.marketingBanner.create({ data })
  return NextResponse.json(banner)
}
