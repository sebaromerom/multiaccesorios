import { prisma } from '@/lib/prisma'
import { Category } from '@prisma/client'

type ImageCandidate = {
  url: string
  title: string
  source: 'mercadolibre' | 'duckduckgo' | 'unsplash'
  score: number
}

type MercadoLibreSearchItem = {
  id: string
  title: string
  thumbnail?: string
  secure_thumbnail?: string
}

type MercadoLibreItemDetail = {
  title?: string
  pictures?: { secure_url?: string; url?: string }[]
}

type UnsplashPhoto = {
  urls: {
    regular?: string
    small?: string
  }
}

type EnrichOptions = {
  limit?: number
  overwrite?: boolean
}

export type ImageEnrichmentResult = {
  scanned: number
  updated: number
  skipped: number
  errors: string[]
}

const CATEGORY_TERMS: Record<Category, string> = {
  Carcasa: 'carcasa celular',
  Lamina: 'lamina vidrio templado celular',
  Cargador: 'cargador celular',
  Cable: 'cable usb celular',
  Audifonos: 'audifonos',
  Vapers: 'vaper',
  Computacion: 'accesorio computacion',
  Otros: 'accesorio celular',
}

const CATEGORY_FALLBACK_IMAGES: Record<Category, string> = {
  Carcasa: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80',
  Lamina: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
  Cargador: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80',
  Cable: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  Audifonos: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  Vapers: 'https://images.unsplash.com/photo-1567781769939-5b4e6dc30e66?w=600&q=80',
  Computacion: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80',
  Otros: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80',
}

const GENERIC_FALLBACK_IMAGE_IDS = [
  'photo-1601784551446-20c9e07cdbdb',
  'photo-1585771724684-38269d6639fd',
  'photo-1609091839311-d5365f9ff1c5',
  'photo-1558618666-fcd25c85cd64',
  'photo-1505740420928-5e560c06d30e',
  'photo-1567781769939-5b4e6dc30e66',
  'photo-1496181133206-80ce9b88a853',
  'photo-1512941937669-90a1b58e7e9c',
]

const STOPWORDS = new Set([
  'de',
  'del',
  'la',
  'el',
  'los',
  'las',
  'para',
  'con',
  'sin',
  'y',
  'o',
  'tipo',
  'color',
  'colores',
  'unidad',
  'unidades',
])

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s+.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getTokens(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token))
}

function buildSearchQuery(productName: string, category?: Category | null): string {
  const normalized = normalizeText(productName)
    .replace(/\bsku\b\s*[:#-]?\s*\w+/g, '')
    .replace(/\bcod(?:igo)?\b\s*[:#-]?\s*\w+/g, '')

  const categoryTerm = category ? CATEGORY_TERMS[category] : 'accesorio celular'
  return `${normalized} ${categoryTerm}`.trim()
}

function scoreCandidate(productName: string, candidateTitle: string): number {
  const productTokens = getTokens(productName)
  const candidateTokens = new Set(getTokens(candidateTitle))

  if (productTokens.length === 0 || candidateTokens.size === 0) return 0

  let matched = 0
  for (const token of productTokens) {
    if (candidateTokens.has(token)) matched++
  }

  const exactPhraseBonus = normalizeText(candidateTitle).includes(normalizeText(productName))
    ? 0.35
    : 0

  return matched / productTokens.length + exactPhraseBonus
}

function hasModelTokenMatch(productName: string, candidateTitle: string): boolean {
  const productModelTokens = getTokens(productName).filter((token) => /\d/.test(token))
  if (productModelTokens.length === 0) return true

  const candidateTokens = new Set(getTokens(candidateTitle))
  return productModelTokens.some((token) => candidateTokens.has(token))
}

function isUsableImageUrl(url: string | null | undefined): url is string {
  if (!url) return false
  if (!url.startsWith('http')) return false
  if (url.includes('placehold')) return false
  return true
}

function buildSearchQueries(productName: string, category?: Category | null): string[] {
  const cleanName = normalizeText(productName)
    .replace(/\bsku\b\s*[:#-]?\s*\w+/g, '')
    .replace(/\bcod(?:igo)?\b\s*[:#-]?\s*\w+/g, '')
    .replace(/\b(diseno|silicona|transparente|economica|economico)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const categoryTerm = category ? CATEGORY_TERMS[category] : 'accesorio celular'
  const compactBrandModel = getTokens(productName)
    .filter((token) => /[a-z]/.test(token) || /\d/.test(token))
    .join(' ')
  const accessoryQueries: string[] = []

  if (category === Category.Carcasa) {
    const model = cleanName
      .replace(/\bcarcasas?\b/g, '')
      .replace(/\bcelular\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    accessoryQueries.push(`funda ${model}`, `case ${model}`, `carcasa ${model}`)
  }

  if (category === Category.Lamina) {
    const model = cleanName
      .replace(/\blamina\b/g, '')
      .replace(/\bvidrio\b/g, '')
      .replace(/\bhidrogel\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    accessoryQueries.push(`protector pantalla ${model}`, `vidrio templado ${model}`, `lamina hidrogel ${model}`)
  }

  if (category === Category.Cargador) {
    accessoryQueries.push(cleanName.replace(/\bcargador\b/g, 'charger').trim())
  }

  return [
    productName,
    cleanName,
    compactBrandModel,
    `${cleanName} ${categoryTerm}`,
    ...accessoryQueries,
  ]
    .map((query) => query.trim())
    .filter(Boolean)
    .filter((query, index, queries) => queries.indexOf(query) === index)
}

function isGenericFallbackImageUrl(url: string | null | undefined): boolean {
  if (!url) return true
  if (!isUsableImageUrl(url)) return true
  return GENERIC_FALLBACK_IMAGE_IDS.some((id) => url.includes(id))
}

function needsImageEnrichment(product: {
  imageUrl: string | null
  images: { url: string }[]
}): boolean {
  if (isGenericFallbackImageUrl(product.imageUrl)) return true
  if (product.images.length === 0) return true
  return product.images.every((image) => isGenericFallbackImageUrl(image.url))
}

async function fetchMercadoLibreCandidates(
  productName: string,
  category?: Category | null,
  rawQuery?: string
): Promise<ImageCandidate[]> {
  const query = encodeURIComponent(rawQuery ?? buildSearchQuery(productName, category))
  const searchUrl = `https://api.mercadolibre.com/sites/MLC/search?q=${query}&limit=6`

  const searchRes = await fetch(searchUrl, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 * 60 * 24 },
  })

  if (!searchRes.ok) return []

  const searchData: { results?: MercadoLibreSearchItem[] } = await searchRes.json()
  const results = searchData.results ?? []

  const candidates = await Promise.all(
    results.map(async (item) => {
      const detailRes = await fetch(`https://api.mercadolibre.com/items/${item.id}`, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 60 * 60 * 24 },
      })

      let detail: MercadoLibreItemDetail | null = null
      if (detailRes.ok) {
        detail = await detailRes.json()
      }

      const detailImages =
        detail?.pictures
          ?.map((picture) => picture.secure_url ?? picture.url)
          .filter(isUsableImageUrl) ?? []

      const fallbackImage = item.secure_thumbnail ?? item.thumbnail
      const images = detailImages.length > 0
        ? detailImages
        : isUsableImageUrl(fallbackImage)
          ? [fallbackImage]
          : []

      return images.map((url, index) => ({
        url,
        title: detail?.title ?? item.title,
        source: 'mercadolibre' as const,
        score: scoreCandidate(productName, detail?.title ?? item.title) - index * 0.03,
      }))
    })
  )

  return candidates.flat()
}

function extractDuckDuckGoVqd(html: string): string | null {
  return (
    html.match(/vqd="([^"]+)/)?.[1] ??
    html.match(/vqd=([^&"']+)/)?.[1] ??
    html.match(/"vqd":"([^"]+)/)?.[1] ??
    null
  )
}

async function fetchDuckDuckGoCandidates(
  productName: string,
  rawQuery: string
): Promise<ImageCandidate[]> {
  const pageUrl = `https://duckduckgo.com/?q=${encodeURIComponent(rawQuery)}&iax=images&ia=images`
  const html = await fetch(pageUrl, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'Mozilla/5.0',
    },
    next: { revalidate: 60 * 60 * 24 },
  }).then((res) => res.text())

  const vqd = extractDuckDuckGoVqd(html)
  if (!vqd) return []

  const imagesUrl =
    `https://duckduckgo.com/i.js?l=cl-es&o=json&q=${encodeURIComponent(rawQuery)}` +
    `&vqd=${encodeURIComponent(vqd)}&f=,,,&p=1`

  const res = await fetch(imagesUrl, {
    headers: {
      Accept: 'application/json',
      Referer: pageUrl,
      'User-Agent': 'Mozilla/5.0',
    },
    next: { revalidate: 60 * 60 * 24 },
  })

  if (!res.ok) return []

  const data: { results?: { image?: string; title?: string }[] } = await res.json()

  return (data.results ?? [])
    .map((item) => ({
      url: item.image ?? '',
      title: item.title ?? '',
      source: 'duckduckgo' as const,
      score: scoreCandidate(productName, item.title ?? ''),
    }))
    .filter((candidate) => {
      if (!isUsableImageUrl(candidate.url)) return false
      if (candidate.url.includes('.svg')) return false
      if (candidate.url.toLowerCase().includes('.pdf')) return false
      if (!hasModelTokenMatch(productName, candidate.title)) return false
      return candidate.score >= 0.22
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
}

async function fetchUnsplashCandidates(
  productName: string,
  category?: Category | null
): Promise<ImageCandidate[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY

  if (!accessKey) return []

  const query = encodeURIComponent(buildSearchQuery(productName, category))
  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=4&orientation=squarish`

  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      Accept: 'application/json',
    },
    next: { revalidate: 60 * 60 * 24 },
  })

  if (!res.ok) return []

  const data: { results?: UnsplashPhoto[] } = await res.json()

  return (data.results ?? [])
    .map((photo) => photo.urls.regular ?? photo.urls.small)
    .filter(isUsableImageUrl)
    .map((imageUrl, index) => ({
      url: imageUrl,
      title: productName,
      source: 'unsplash' as const,
      score: 0.45 - index * 0.03,
    }))
}

export async function getProductImages(
  productName: string,
  category?: Category | null
): Promise<string[]> {
  try {
    for (const query of buildSearchQueries(productName, category)) {
      const mercadoLibreCandidates = await fetchMercadoLibreCandidates(productName, category, query)
      const bestCatalogMatches = mercadoLibreCandidates
        .filter((candidate) => candidate.score >= 0.32)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)

      if (bestCatalogMatches.length > 0) {
        return [...new Set(bestCatalogMatches.map((candidate) => candidate.url))]
      }

      const duckDuckGoCandidates = await fetchDuckDuckGoCandidates(productName, query)
      if (duckDuckGoCandidates.length > 0) {
        return [...new Set(duckDuckGoCandidates.map((candidate) => candidate.url))]
      }
    }

    const unsplashCandidates = await fetchUnsplashCandidates(productName, category)
    if (unsplashCandidates.length > 0) {
      return [...new Set(unsplashCandidates.map((candidate) => candidate.url))]
    }

    return category ? [CATEGORY_FALLBACK_IMAGES[category]] : []
  } catch (err) {
    console.warn('Error buscando imagenes:', err)
    return category ? [CATEGORY_FALLBACK_IMAGES[category]] : []
  }
}

export async function enrichMissingProductImages(
  options: EnrichOptions = {}
): Promise<ImageEnrichmentResult> {
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100)
  const overwrite = options.overwrite ?? false
  const fallbackImageFilters = GENERIC_FALLBACK_IMAGE_IDS.map((id) => ({
    imageUrl: { contains: id },
  }))

  const products = await prisma.product.findMany({
    where: overwrite
      ? undefined
      : {
          OR: [
            { imageUrl: null },
            { imageUrl: '' },
            { images: { none: {} } },
            ...fallbackImageFilters,
          ],
        },
    include: {
      images: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const result: ImageEnrichmentResult = {
    scanned: products.length,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  for (const product of products) {
    try {
      if (!overwrite && !needsImageEnrichment(product)) {
        result.skipped++
        continue
      }

      const images = (await getProductImages(product.name, product.category))
        .filter((url) => !isGenericFallbackImageUrl(url))

      if (images.length === 0) {
        result.skipped++
        continue
      }

      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: product.id },
          data: {
            imageUrl: images[0],
          },
        })

        await tx.productImage.deleteMany({
          where: { productId: product.id },
        })

        await tx.productImage.createMany({
          data: images.map((url, index) => ({
            productId: product.id,
            url,
            order: index,
          })),
        })
      })

      result.updated++
    } catch (err) {
      result.skipped++
      result.errors.push(`[${product.name}] ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}
