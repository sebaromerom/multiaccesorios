import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = Math.min(Math.max(Number(limitArg?.split('=')[1] ?? 25), 1), 1000)

const concurrencyArg = process.argv.find((arg) => arg.startsWith('--concurrency='))
const concurrency = Math.min(Math.max(Number(concurrencyArg?.split('=')[1] ?? 6), 1), 12)

const dryRun = process.argv.includes('--dry-run')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const genericFallbackIds = [
  'photo-1601784551446-20c9e07cdbdb',
  'photo-1585771724684-38269d6639fd',
  'photo-1609091839311-d5365f9ff1c5',
  'photo-1558618666-fcd25c85cd64',
  'photo-1505740420928-5e560c06d30e',
  'photo-1567781769939-5b4e6dc30e66',
  'photo-1496181133206-80ce9b88a853',
  'photo-1512941937669-90a1b58e7e9c',
]

const categoryTerms = {
  Carcasa: 'carcasa celular',
  Lamina: 'lamina vidrio templado celular',
  Cargador: 'cargador celular',
  Cable: 'cable usb celular',
  Audifonos: 'audifonos',
  Vapers: 'vaper',
  Computacion: 'accesorio computacion',
  Otros: 'accesorio celular',
}

const stopwords = new Set([
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

function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s+.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getTokens(value) {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length >= 2 && !stopwords.has(token))
}

function scoreCandidate(productName, candidateTitle) {
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

function hasModelTokenMatch(productName, candidateTitle) {
  const productModelTokens = getTokens(productName).filter((token) => /\d/.test(token))
  if (productModelTokens.length === 0) return true

  const candidateTokens = new Set(getTokens(candidateTitle))
  return productModelTokens.some((token) => candidateTokens.has(token))
}

function isGenericImage(url) {
  if (!url) return true
  if (!url.startsWith('http')) return true
  if (url.includes('placehold')) return true
  return genericFallbackIds.some((id) => url.includes(id))
}

function buildSearchQueries(product) {
  const cleanName = normalizeText(product.name)
    .replace(/\bsku\b\s*[:#-]?\s*\w+/g, '')
    .replace(/\bcod(?:igo)?\b\s*[:#-]?\s*\w+/g, '')
    .replace(/\b(diseno|silicona|transparente|economica|economico)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const categoryTerm = product.category ? categoryTerms[product.category] : 'accesorio celular'
  const compactBrandModel = getTokens(product.name)
    .filter((token) => /[a-z]/.test(token) || /\d/.test(token))
    .join(' ')

  const accessoryQueries = []

  if (product.category === 'Carcasa') {
    const model = cleanName
      .replace(/\bcarcasas?\b/g, '')
      .replace(/\bcelular\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    accessoryQueries.push(`funda ${model}`, `case ${model}`, `carcasa ${model}`)
  }

  if (product.category === 'Lamina') {
    const model = cleanName
      .replace(/\blamina\b/g, '')
      .replace(/\bvidrio\b/g, '')
      .replace(/\bhidrogel\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    accessoryQueries.push(`protector pantalla ${model}`, `vidrio templado ${model}`, `lamina hidrogel ${model}`)
  }

  if (product.category === 'Cargador') {
    accessoryQueries.push(cleanName.replace(/\bcargador\b/g, 'charger').trim())
  }

  return [
    product.name,
    cleanName,
    compactBrandModel,
    `${cleanName} ${categoryTerm}`,
    ...accessoryQueries,
  ]
    .map((query) => query.trim())
    .filter(Boolean)
    .filter((query, index, queries) => queries.indexOf(query) === index)
}

async function findMercadoLibreImages(product, rawQuery) {
  const query = encodeURIComponent(rawQuery)
  const searchUrl = `https://api.mercadolibre.com/sites/MLC/search?q=${query}&limit=8`
  const searchRes = await fetch(searchUrl, { headers: { Accept: 'application/json' } })

  if (!searchRes.ok) return []

  const searchData = await searchRes.json()
  const results = searchData.results ?? []
  const candidates = []

  for (const item of results) {
    const detailRes = await fetch(`https://api.mercadolibre.com/items/${item.id}`, {
      headers: { Accept: 'application/json' },
    })

    const detail = detailRes.ok ? await detailRes.json() : null
    const title = detail?.title ?? item.title ?? ''
    const pictures = detail?.pictures ?? []
    const urls = pictures
      .map((picture) => picture.secure_url ?? picture.url)
      .filter((url) => url && url.startsWith('http'))

    if (urls.length === 0 && item.secure_thumbnail) {
      urls.push(item.secure_thumbnail)
    }

    urls.forEach((url, index) => {
      candidates.push({
        url,
        title,
        score: scoreCandidate(product.name, title) - index * 0.03,
      })
    })
  }

  return candidates
    .filter((candidate) => candidate.score >= 0.32)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((candidate) => candidate.url)
}

function extractDuckDuckGoVqd(html) {
  return (
    html.match(/vqd="([^"]+)/)?.[1] ??
    html.match(/vqd=([^&"']+)/)?.[1] ??
    html.match(/"vqd":"([^"]+)/)?.[1] ??
    null
  )
}

async function findDuckDuckGoImages(product, rawQuery) {
  const pageUrl = `https://duckduckgo.com/?q=${encodeURIComponent(rawQuery)}&iax=images&ia=images`
  const html = await fetch(pageUrl, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'Mozilla/5.0',
    },
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
  })

  if (!res.ok) return []

  const data = await res.json()
  const results = data.results ?? []

  return results
    .map((item) => ({
      url: item.image,
      title: item.title ?? '',
      score: scoreCandidate(product.name, item.title ?? ''),
    }))
    .filter((candidate) => {
      if (!candidate.url?.startsWith('http')) return false
      if (candidate.url.includes('.svg')) return false
      if (candidate.url.toLowerCase().includes('.pdf')) return false
      if (candidate.url.includes('data:image')) return false
      if (!hasModelTokenMatch(product.name, candidate.title)) return false
      return candidate.score >= 0.22
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((candidate) => candidate.url)
}

async function findProductImages(product) {
  for (const query of buildSearchQueries(product)) {
    const mercadoLibreImages = await findMercadoLibreImages(product, query)
    if (mercadoLibreImages.length > 0) return mercadoLibreImages

    const duckDuckGoImages = await findDuckDuckGoImages(product, query)
    if (duckDuckGoImages.length > 0) return duckDuckGoImages
  }

  return []
}

async function enrichProduct(product) {
  const alreadyHasRealImage =
    !isGenericImage(product.imageUrl) &&
    product.images.length > 0 &&
    product.images.some((image) => !isGenericImage(image.url))

  if (alreadyHasRealImage) {
    return {
      status: 'skipped',
      message: `SKIP ${product.name} | ya tiene imagen real`,
    }
  }

  const images = [...new Set(await findProductImages(product))]

  if (images.length === 0) {
    return {
      status: 'skipped',
      message: `SIN MATCH ${product.name}`,
    }
  }

  if (!dryRun) {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: { imageUrl: images[0] },
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
  }

  return {
    status: 'updated',
    message: `${dryRun ? 'DRY' : 'OK'} ${product.name}\n  -> ${images[0]}`,
  }
}

async function runWithConcurrency(items, worker, size) {
  const results = []
  let currentIndex = 0

  async function runWorker() {
    while (currentIndex < items.length) {
      const index = currentIndex
      currentIndex++
      results[index] = await worker(items[index])
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, () => runWorker())
  )

  return results
}

async function main() {
  const fallbackFilters = genericFallbackIds.map((id) => ({
    imageUrl: { contains: id },
  }))

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { imageUrl: null },
        { imageUrl: '' },
        { images: { none: {} } },
        ...fallbackFilters,
      ],
    },
    include: { images: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  console.log(`Productos reales desde Supabase: ${products.length}`)
  console.log(`Concurrencia: ${concurrency}`)

  let updated = 0
  let skipped = 0

  const results = await runWithConcurrency(
    products,
    async (product) => {
      try {
        return await enrichProduct(product)
      } catch (error) {
        return {
          status: 'skipped',
          message: `ERROR ${product.name} | ${error instanceof Error ? error.message : String(error)}`,
        }
      }
    },
    concurrency
  )

  for (const result of results) {
    console.log(result.message)

    if (result.status === 'updated') {
      updated++
    } else {
      skipped++
    }
  }

  console.log(`Listo. Actualizados: ${updated}. Omitidos: ${skipped}.`)
}

try {
  await main()
} finally {
  await prisma.$disconnect()
  await pool.end()
}
