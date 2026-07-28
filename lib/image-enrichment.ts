import { prisma } from '@/lib/prisma'
import { Category } from '@prisma/client'
import { createSupplementalProductImages, importExternalImage, storedImageIsUsable } from '@/lib/imported-images'

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
  concurrency?: number
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

const OWN_IMAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}/storage/v1/object/public/products/`
const LOCAL_PRODUCT_IMAGE_PREFIX = '/products/'

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
  'original',
  'generico',
  'compatible',
])

const PRECISE_VARIANT_CATEGORIES = new Set<Category>([
  Category.Carcasa,
  Category.Lamina,
  Category.Audifonos,
  Category.Cargador,
])

const NO_GENERIC_FALLBACK_CATEGORIES = new Set<Category>([
  Category.Audifonos,
  Category.Cargador,
  Category.Computacion,
  Category.Vapers,
])

const COLOR_SYNONYMS: Record<string, string[]> = {
  blanco: ['white', 'blanca'],
  blanca: ['white', 'blanco'],
  negro: ['black', 'negra'],
  negra: ['black', 'negro'],
  rosado: ['pink', 'rosa'],
  rosa: ['pink', 'rosado'],
  morado: ['purple', 'lila'],
  azul: ['blue'],
  rojo: ['red'],
  verde: ['green'],
  gris: ['gray', 'grey'],
  transparente: ['clear', 'crystal', 'transparente'],
}

const CONNECTOR_SYNONYMS: Record<string, string[]> = {
  ip: ['iphone', 'lightning', 'apple'],
  typoc: ['tipo c', 'type c', 'usb c', 'usb-c'],
  tipo: ['type'],
  c: ['usb c', 'usb-c', 'type c'],
  micro: ['microusb', 'micro usb', 'usb micro'],
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s+.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeVariantValue(value: string): string {
  return normalizeText(value)
    .replace(/\biph\b/g, 'iphone')
    .replace(/\bip\b/g, 'iphone')
    .replace(/\btypo\s*c\b/g, 'tipo c')
    .replace(/\btype\s*c\b/g, 'tipo c')
    .replace(/\busb\s*c\b/g, 'usb c')
    .replace(/\busb-c\b/g, 'usb c')
    .replace(/\bto\b/g, 'a')
    .replace(/\s+/g, ' ')
    .trim()
}

function getTokens(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token))
}

function getVariantMatchTerms(variantName: string): string[] {
  const normalizedVariant = normalizeVariantValue(variantName)
  const tokens = getTokens(normalizedVariant)
  const terms = new Set<string>(tokens)

  for (const token of tokens) {
    for (const synonym of COLOR_SYNONYMS[token] ?? []) {
      terms.add(normalizeText(synonym))
    }
    for (const synonym of CONNECTOR_SYNONYMS[token] ?? []) {
      for (const synonymToken of getTokens(synonym)) {
        terms.add(synonymToken)
      }
    }
  }

  const modelMatch = normalizedVariant.match(/\b(?:iphone\s*)?\d{1,2}\s*(?:pro\s*max|pro|plus|max)?\b/)
  if (modelMatch) {
    for (const token of getTokens(modelMatch[0])) {
      terms.add(token)
    }
  }

  return [...terms].filter(Boolean)
}

function hasAnyTermMatch(terms: string[], candidateTitle: string): boolean {
  const candidate = normalizeVariantValue(candidateTitle)
  const candidateTokens = new Set(getTokens(candidate))

  return terms.some((term) => {
    const normalizedTerm = normalizeVariantValue(term)
    if (!normalizedTerm) return false
    if (candidate.includes(normalizedTerm)) return true
    return getTokens(normalizedTerm).some((token) => candidateTokens.has(token))
  })
}

function matchesCategoryIntent(category: Category | null | undefined, candidateTitle: string): boolean {
  if (!category || !PRECISE_VARIANT_CATEGORIES.has(category)) return true

  const title = normalizeText(candidateTitle)
  if (category === Category.Carcasa) {
    return /\b(carcasa|funda|case|cover|magsafe)\b/.test(title) && !/\b(lamina|vidrio|protector pantalla)\b/.test(title)
  }

  if (category === Category.Lamina) {
    return /\b(lamina|vidrio|protector|pantalla|glass|tempered|carcasa|funda|case|cover|magsafe)\b/.test(title)
  }

  if (category === Category.Audifonos) {
    return /\b(audifono|audifonos|auricular|auriculares|headphone|headphones|earbuds|airpods|tws|bluetooth)\b/.test(title)
  }

  if (category === Category.Cargador) {
    return /\b(cargador|charger|adaptador|powerbank|power bank|carga|pd|usb|tipo c|type c|wireless|inalambrico)\b/.test(title)
  }

  return true
}

function matchesVariantModelIntent(productName: string, variantName: string, candidateTitle: string): boolean {
  const product = normalizeVariantValue(productName)
  const variant = normalizeVariantValue(variantName)
  const candidate = normalizeVariantValue(candidateTitle)
  const simpleIphoneModel = variant.match(/^\d{1,2}$/)?.[0]

  if (!simpleIphoneModel || !/\biphone\b/.test(product)) return true

  const upgradedModelPattern = new RegExp(
    `\\b(?:iphone\\s*)?${simpleIphoneModel}\\s*(?:pro\\s*max|pro|max|plus|mini)\\b`
  )

  return !upgradedModelPattern.test(candidate)
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

function getBrandModelTokens(productName: string) {
  const tokens = getTokens(productName)
  const modelTokens = tokens.filter((token) => /\d/.test(token))
  const brandTokens = tokens.filter((token) =>
    /^(hoco|borofone|remax|jbl|aiwa|onikuma|monster|motomo|evotec|pioneer|ah|p47|p9)$/i.test(token)
  )
  return { brandTokens, modelTokens }
}

function hasStrongProductMatch(productName: string, candidateTitle: string) {
  const candidateTokens = new Set(getTokens(candidateTitle))
  const { brandTokens, modelTokens } = getBrandModelTokens(productName)
  const brandOk = brandTokens.length === 0 || brandTokens.some((token) => candidateTokens.has(token))
  const modelOk = modelTokens.length === 0 || modelTokens.every((token) => candidateTokens.has(token))
  return brandOk && modelOk
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

  if (category === Category.Audifonos) {
    const { brandTokens, modelTokens } = getBrandModelTokens(productName)
    const brandModel = [...brandTokens, ...modelTokens].join(' ').trim()
    if (brandModel) {
      accessoryQueries.push(brandModel, `${brandModel} audifonos`, `${brandModel} headphones`)
    }
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

function buildVariantSearchQueries(
  productName: string,
  variantName: string,
  category?: Category | null
): string[] {
  const normalizedProduct = normalizeText(productName)
    .replace(/\bsku\b\s*[:#-]?\s*\w+/g, '')
    .replace(/\bcod(?:igo)?\b\s*[:#-]?\s*\w+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const normalizedVariant = normalizeVariantValue(variantName)
  const combined = `${normalizedProduct} ${normalizedVariant}`.trim()
  const queries = new Set<string>([
    `${productName} ${variantName}`.trim(),
    combined,
    `${combined} ${category ? CATEGORY_TERMS[category] : 'accesorio celular'}`.trim(),
  ])

  if (category === Category.Carcasa) {
    const descriptor = normalizedProduct
      .replace(/\bcarcasas?\b/g, '')
      .replace(/\bcelular\b/g, '')
      .trim()
    queries.add(`carcasa ${descriptor} ${normalizedVariant}`.trim())
    queries.add(`funda ${normalizedVariant} ${descriptor}`.trim())
    queries.add(`case ${normalizedVariant} ${descriptor}`.trim())
  }

  if (category === Category.Lamina) {
    const isMagsafeCase = /\b(magsafe|carcasa|funda|case|cover)\b/.test(normalizedProduct)
    const descriptor = normalizedProduct
      .replace(/\blaminas?\b/g, '')
      .replace(/\bprotector(?:es)?\b/g, '')
      .replace(/\bpantalla\b/g, '')
      .trim()

    if (isMagsafeCase) {
      queries.add(`carcasa ${descriptor} ${normalizedVariant}`.trim())
      queries.add(`funda magsafe ${normalizedVariant} ${descriptor}`.trim())
      queries.add(`case magsafe ${normalizedVariant} ${descriptor}`.trim())
    } else {
      queries.add(`lamina ${descriptor} ${normalizedVariant}`.trim())
      queries.add(`vidrio templado ${normalizedVariant} ${descriptor}`.trim())
      queries.add(`protector pantalla ${normalizedVariant} ${descriptor}`.trim())
    }
  }

  if (category === Category.Audifonos) {
    queries.add(`audifonos ${combined}`.trim())
    queries.add(`tws ${combined}`.trim())
  }

  if (category === Category.Cargador) {
    queries.add(`cargador ${combined}`.trim())
    queries.add(`charger ${combined}`.trim())
    queries.add(`adaptador ${normalizedVariant} ${normalizedProduct}`.trim())
  }

  return [...queries]
    .map((query) => query.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
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
  const searchUrl = `https://api.mercadolibre.com/sites/MLC/search?q=${query}&limit=12`

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
    const collected: string[] = []

    for (const query of buildSearchQueries(productName, category)) {
      const mercadoLibreCandidates = await fetchMercadoLibreCandidates(productName, category, query)
      const bestCatalogMatches = mercadoLibreCandidates
        .filter((candidate) =>
          candidate.score >= (category === Category.Audifonos ? 0.28 : 0.32) &&
          matchesCategoryIntent(category, candidate.title) &&
          (category !== Category.Audifonos || hasStrongProductMatch(productName, candidate.title))
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)

      if (bestCatalogMatches.length > 0) {
        collected.push(...bestCatalogMatches.map((candidate) => candidate.url))
        if ([...new Set(collected)].length >= 4) return [...new Set(collected)].slice(0, 4)
      }

      const duckDuckGoCandidates = await fetchDuckDuckGoCandidates(productName, query)
      const strongWebMatches = duckDuckGoCandidates.filter((candidate) =>
        category !== Category.Audifonos ||
        (candidate.score >= 0.55 &&
          matchesCategoryIntent(category, candidate.title) &&
          hasStrongProductMatch(productName, `${candidate.title} ${candidate.url}`))
      )
      if (strongWebMatches.length > 0) {
        collected.push(...strongWebMatches.map((candidate) => candidate.url))
        if ([...new Set(collected)].length >= 4) return [...new Set(collected)].slice(0, 4)
      }
    }

    if (collected.length > 0) return [...new Set(collected)].slice(0, 4)

    if (!category || !NO_GENERIC_FALLBACK_CATEGORIES.has(category)) {
      const unsplashCandidates = await fetchUnsplashCandidates(productName, category)
      if (unsplashCandidates.length > 0) {
        return [...new Set(unsplashCandidates.map((candidate) => candidate.url))]
      }
    }

    return category && !NO_GENERIC_FALLBACK_CATEGORIES.has(category) ? [CATEGORY_FALLBACK_IMAGES[category]] : []
  } catch (err) {
    console.warn('Error buscando imagenes:', err)
    return category && !NO_GENERIC_FALLBACK_CATEGORIES.has(category) ? [CATEGORY_FALLBACK_IMAGES[category]] : []
  }
}

export async function getVariantImages(
  productName: string,
  variantName: string,
  category?: Category | null
): Promise<string[]> {
  const variantTerms = getVariantMatchTerms(variantName)
  if (variantTerms.length === 0) return []

  const combinedName = `${productName} ${variantName}`.trim()
  const hasVariantToken = (title: string) => {
    return hasAnyTermMatch(variantTerms, title)
  }

  try {
    const collected: string[] = []
    for (const query of buildVariantSearchQueries(productName, variantName, category)) {
      const mercadoLibreCandidates = await fetchMercadoLibreCandidates(combinedName, category, query)
      const bestCatalogMatches = mercadoLibreCandidates
        .filter((candidate) =>
          candidate.score >= (category === Category.Audifonos ? 0.28 : 0.34) &&
          hasVariantToken(candidate.title) &&
          matchesCategoryIntent(category, candidate.title) &&
          matchesVariantModelIntent(productName, variantName, candidate.title) &&
          (category !== Category.Audifonos || hasStrongProductMatch(productName, candidate.title))
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)

      if (bestCatalogMatches.length > 0) {
        collected.push(...bestCatalogMatches.map((candidate) => candidate.url))
        if ([...new Set(collected)].length >= 4) return [...new Set(collected)].slice(0, 4)
      }

      const duckDuckGoCandidates = await fetchDuckDuckGoCandidates(combinedName, query)
      const bestWebMatches = duckDuckGoCandidates
        .filter((candidate) =>
          hasVariantToken(candidate.title) &&
          matchesCategoryIntent(category, candidate.title) &&
          matchesVariantModelIntent(productName, variantName, `${candidate.title} ${candidate.url}`) &&
          (category !== Category.Audifonos ||
            (candidate.score >= 0.55 && hasStrongProductMatch(productName, `${candidate.title} ${candidate.url}`)))
        )
        .slice(0, 6)

      if (bestWebMatches.length > 0) {
        collected.push(...bestWebMatches.map((candidate) => candidate.url))
        if ([...new Set(collected)].length >= 4) return [...new Set(collected)].slice(0, 4)
      }
    }
    if (collected.length > 0) return [...new Set(collected)].slice(0, 4)
  } catch (err) {
    console.warn('Error buscando imagenes de variante:', err)
  }

  return []
}

async function importValidImages(urls: string[], logPrefix: string, limit = 4, errors?: string[]) {
  const imported: string[] = []
  for (const url of [...new Set(urls)]) {
    if (imported.length >= limit) break
    try {
      const image = await importExternalImage(url)
      if (image) imported.push(image.mediumUrl)
    } catch (error) {
      const message = `[image-import] ${logPrefix}: ${error instanceof Error ? error.message : String(error)}`
      console.warn(message)
      errors?.push(message)
    }
  }
  return [...new Set(imported)]
}

async function ensureMinimumGallery(images: string[], logPrefix: string, errors: string[], min = 3) {
  const finalImages = [...new Set(images)]
  if (finalImages.length >= min || finalImages.length === 0) return finalImages
  try {
    const supplements = await createSupplementalProductImages(finalImages[0], min - finalImages.length)
    finalImages.push(...supplements.filter((url) => !finalImages.includes(url)))
  } catch (error) {
    errors.push(`[${logPrefix}] fallback imagenes: ${error instanceof Error ? error.message : String(error)}`)
  }
  return finalImages.slice(0, Math.max(min, finalImages.length))
}

async function imageListNeedsRepair(urls: string[]) {
  const isOwned = (url: string) =>
    (OWN_IMAGE_PREFIX && url.startsWith(OWN_IMAGE_PREFIX)) || url.startsWith(LOCAL_PRODUCT_IMAGE_PREFIX)
  const ownUrls = ownedImageUrls(urls)
  if (urls.some((url) => !isOwned(url))) return true
  if (ownUrls.length < 3) return true
  if ((await genericSourceImageUrls(ownUrls)).length > 0) return true
  const checks = await Promise.all(ownUrls.slice(0, 4).map((url) => storedImageIsUsable(url)))
  return checks.some((ok) => !ok)
}

function ownedImageUrls(urls: string[]) {
  const isOwned = (url: string) =>
    (OWN_IMAGE_PREFIX && url.startsWith(OWN_IMAGE_PREFIX)) || url.startsWith(LOCAL_PRODUCT_IMAGE_PREFIX)
  return [...new Set(urls.filter(isOwned))]
}

async function genericSourceImageUrls(urls: string[]) {
  if (urls.length === 0) return []
  const imports = await prisma.importedImage.findMany({
    where: {
      mediumUrl: { in: urls },
      sourceUrl: { contains: 'images.unsplash.com' },
    },
    select: { mediumUrl: true },
  })
  return imports.map((image) => image.mediumUrl)
}

async function ownedProductImageUrls(urls: string[]) {
  const ownUrls = ownedImageUrls(urls)
  const genericUrls = new Set(await genericSourceImageUrls(ownUrls))
  return ownUrls.filter((url) => !genericUrls.has(url))
}

async function replaceVariantImages(variantId: string, images: string[]) {
  await prisma.$transaction(async (tx) => {
    await tx.productVariant.update({ where: { id: variantId }, data: { imageUrl: images[0] } })
    await tx.productVariantImage.deleteMany({ where: { variantId } })
    await tx.productVariantImage.createMany({
      data: images.map((url, order) => ({ variantId, url, order })),
    })
  })
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

      const candidateUrls = (await getProductImages(product.name, product.category))
        .filter((url) => !isGenericFallbackImageUrl(url))

      if (candidateUrls.length === 0) {
        result.skipped++
        continue
      }

      const images = await importValidImages(candidateUrls, product.name, 4)
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

export async function enrichMissingVariantImages(
  options: EnrichOptions = {}
): Promise<ImageEnrichmentResult> {
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100)
  const overwrite = options.overwrite ?? false
  const concurrency = Math.min(Math.max(options.concurrency ?? 6, 1), 8)
  const candidateLimit = Math.min(limit * 4, 400)

  const variants = await prisma.productVariant.findMany({
    where: overwrite
      ? undefined
      : {
          imageUrl: null,
          images: { none: {} },
        },
    include: {
      images: true,
      product: true,
    },
    orderBy: { product: { createdAt: 'desc' } },
    take: candidateLimit,
  })

  const result: ImageEnrichmentResult = {
    scanned: variants.length,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  let currentIndex = 0

  async function runWorker() {
    while (currentIndex < variants.length) {
      const variant = variants[currentIndex]
      currentIndex++

      try {
      const candidateUrls = await getVariantImages(
          variant.product.name,
          variant.size,
          variant.product.category
        )

        if (candidateUrls.length === 0) {
          result.skipped++
          continue
        }

      const images = await importValidImages(candidateUrls, `${variant.product.name} / ${variant.size}`)
        if (images.length === 0) {
          result.skipped++
          continue
        }

        await prisma.$transaction(async (tx) => {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { imageUrl: images[0] },
          })

          await tx.productVariantImage.deleteMany({
            where: { variantId: variant.id },
          })

          await tx.productVariantImage.createMany({
            data: images.map((url, index) => ({
              variantId: variant.id,
              url,
              order: index,
            })),
          })
        })

        result.updated++
      } catch (err) {
        result.skipped++
        result.errors.push(
          `[${variant.product.name} / ${variant.size}] ${err instanceof Error ? err.message : String(err)}`
        )
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, variants.length) }, () => runWorker())
  )

  return result
}

export async function repairCategoryProductImages(category: Category, limit = 30): Promise<ImageEnrichmentResult> {
  const products = await prisma.product.findMany({
    where: { category, stock: { gt: 0 }, price: { gt: 0 } },
    include: { images: { orderBy: { order: 'asc' } } },
    orderBy: { name: 'asc' },
    take: Math.min(Math.max(limit, 1), 120),
  })
  const result: ImageEnrichmentResult = { scanned: 0, updated: 0, skipped: 0, errors: [] }

  for (const product of products) {
    result.scanned++
    const current = [product.imageUrl, ...product.images.map((image) => image.url)].filter(isUsableImageUrl)
    if (!(await imageListNeedsRepair(current))) {
      result.skipped++
      continue
    }

    try {
      const candidates = await getProductImages(product.name, product.category)
      const images = await importValidImages(candidates, product.name, 4, result.errors)
      const finalImages = await ensureMinimumGallery(
        images.length > 0 ? images : await ownedProductImageUrls(current),
        product.name,
        result.errors
      )
      if (finalImages.length < 3) {
        result.skipped++
        result.errors.push(`[${product.name}] imagenes insuficientes: candidatas=${candidates.length}, importadas=${images.length}, finales=${finalImages.length}`)
        continue
      }
      if (finalImages.length === 0) {
        await prisma.$transaction(async (tx) => {
          await tx.product.update({ where: { id: product.id }, data: { imageUrl: null } })
          await tx.productImage.deleteMany({ where: { productId: product.id } })
        })
        result.updated++
        continue
      }

      await prisma.$transaction(async (tx) => {
        await tx.product.update({ where: { id: product.id }, data: { imageUrl: finalImages[0] } })
        await tx.productImage.deleteMany({ where: { productId: product.id } })
        await tx.productImage.createMany({
          data: finalImages.map((url, order) => ({ productId: product.id, url, order })),
        })
      })
      result.updated++
    } catch (error) {
      result.skipped++
      result.errors.push(`[${product.name}] ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return result
}

export async function repairCategoryVariantImages(category: Category, limit = 30): Promise<ImageEnrichmentResult> {
  const products = await prisma.product.findMany({
    where: { category, stock: { gt: 0 }, price: { gt: 0 } },
    include: { variants: { include: { images: { orderBy: { order: 'asc' } } } } },
    orderBy: { name: 'asc' },
    take: Math.min(Math.max(limit, 1), 120),
  })
  const result: ImageEnrichmentResult = { scanned: 0, updated: 0, skipped: 0, errors: [] }

  for (const product of products) {
    for (const variant of product.variants) {
      result.scanned++
      const current = [variant.imageUrl, ...variant.images.map((image) => image.url)].filter(isUsableImageUrl)
      if (!(await imageListNeedsRepair(current))) {
        result.skipped++
        continue
      }

      try {
        const candidates = await getVariantImages(product.name, variant.size, product.category)
        const images = await importValidImages(candidates, `${product.name} / ${variant.size}`, 4, result.errors)
        const finalImages = await ensureMinimumGallery(
          images.length > 0 ? images : await ownedProductImageUrls(current),
          `${product.name} / ${variant.size}`,
          result.errors
        )
        if (images.length === 0) {
          const ownImages = finalImages
          if (ownImages.length >= 3) {
            await replaceVariantImages(variant.id, ownImages)
            result.updated++
            continue
          }
          result.skipped++
          result.errors.push(`[${product.name} / ${variant.size}] imagenes insuficientes: candidatas=${candidates.length}, importadas=0, finales=${ownImages.length}`)
          continue
        }
        if (finalImages.length < 3) {
          result.skipped++
          result.errors.push(`[${product.name} / ${variant.size}] imagenes insuficientes: candidatas=${candidates.length}, importadas=${images.length}, finales=${finalImages.length}`)
          continue
        }

        await replaceVariantImages(variant.id, finalImages)
        result.updated++
      } catch (error) {
        result.skipped++
        result.errors.push(`[${product.name} / ${variant.size}] ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  return result
}
