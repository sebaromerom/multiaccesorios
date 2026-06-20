import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = Math.min(Math.max(Number(limitArg?.split('=')[1] ?? 80), 1), 500)
const concurrencyArg = process.argv.find((arg) => arg.startsWith('--concurrency='))
const concurrency = Math.min(Math.max(Number(concurrencyArg?.split('=')[1] ?? 5), 1), 10)
const overwrite = process.argv.includes('--overwrite')
const dryRun = process.argv.includes('--dry-run')
const categoriesArg = process.argv.find((arg) => arg.startsWith('--categories='))
const categories = (categoriesArg?.split('=')[1]?.split(',') ?? ['Carcasa', 'Audifonos', 'Cargador'])
  .map((value) => value.trim())
  .filter(Boolean)

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const stopwords = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'para', 'con', 'sin', 'y', 'o',
  'tipo', 'color', 'colores', 'unidad', 'unidades', 'original', 'generico',
  'compatible',
])

const categoryTerms = {
  Carcasa: 'carcasa funda case',
  Audifonos: 'audifonos tws bluetooth',
  Cargador: 'cargador charger adaptador',
}

const colorSynonyms = {
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
  transparente: ['clear', 'crystal'],
}

const connectorSynonyms = {
  ip: ['iphone', 'lightning', 'apple'],
  typoc: ['tipo c', 'type c', 'usb c', 'usb-c'],
  c: ['usb c', 'usb-c', 'type c'],
  micro: ['micro usb', 'microusb', 'usb micro'],
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s+.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeVariant(value) {
  return normalizeText(value)
    .replace(/\biph\b/g, 'iphone')
    .replace(/\bip\b/g, 'iphone')
    .replace(/\btypo\s*c\b/g, 'tipo c')
    .replace(/\btype\s*c\b/g, 'tipo c')
    .replace(/\busb-c\b/g, 'usb c')
    .replace(/\busb\s*c\b/g, 'usb c')
    .replace(/\bto\b/g, 'a')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(value) {
  return normalizeVariant(value)
    .split(' ')
    .filter((token) => token.length >= 2 && !stopwords.has(token))
}

function variantTerms(value) {
  const terms = new Set(tokens(value))
  for (const token of [...terms]) {
    for (const synonym of colorSynonyms[token] ?? []) {
      tokens(synonym).forEach((item) => terms.add(item))
    }
    for (const synonym of connectorSynonyms[token] ?? []) {
      tokens(synonym).forEach((item) => terms.add(item))
    }
  }
  return [...terms]
}

function hasTermMatch(terms, title) {
  const normalized = normalizeVariant(title)
  const titleTokens = new Set(tokens(normalized))
  return terms.some((term) => normalized.includes(term) || titleTokens.has(term))
}

function categoryMatches(category, title) {
  const normalized = normalizeText(title)
  if (category === 'Carcasa') {
    return /\b(carcasa|funda|case|cover|magsafe)\b/.test(normalized) &&
      !/\b(lamina|vidrio|protector pantalla)\b/.test(normalized)
  }
  if (category === 'Audifonos') {
    return /\b(audifono|audifonos|auricular|auriculares|headphone|headphones|earbuds|airpods|tws|bluetooth)\b/.test(normalized)
  }
  if (category === 'Cargador') {
    return /\b(cargador|charger|adaptador|powerbank|power bank|carga|pd|usb|tipo c|type c|wireless|inalambrico)\b/.test(normalized)
  }
  return true
}

function isColorVariant(value) {
  const terms = variantTerms(value)
  return terms.some((term) => Object.prototype.hasOwnProperty.call(colorSynonyms, term))
}

function score(name, title) {
  const wanted = tokens(name)
  const found = new Set(tokens(title))
  if (!wanted.length || !found.size) return 0
  const matched = wanted.filter((token) => found.has(token)).length
  return matched / wanted.length + (normalizeText(title).includes(normalizeText(name)) ? 0.25 : 0)
}

function queries(product, variant) {
  const productName = normalizeText(product.name)
  const variantName = normalizeVariant(variant.size)
  const combined = `${productName} ${variantName}`.trim()
  const result = new Set([
    `${product.name} ${variant.size}`,
    combined,
    `${combined} ${categoryTerms[product.category] ?? ''}`.trim(),
  ])

  if (product.category === 'Carcasa') {
    const descriptor = productName.replace(/\bcarcasas?\b/g, '').replace(/\bcelular\b/g, '').trim()
    result.add(`carcasa ${descriptor} ${variantName}`.trim())
    result.add(`funda ${variantName} ${descriptor}`.trim())
    result.add(`case ${variantName} ${descriptor}`.trim())
  }

  if (product.category === 'Audifonos') {
    result.add(`audifonos ${combined}`)
    result.add(`tws ${combined}`)
  }

  if (product.category === 'Cargador') {
    result.add(`cargador ${combined}`)
    result.add(`charger ${combined}`)
    result.add(`adaptador ${variantName} ${productName}`)
  }

  return [...result].map((query) => query.replace(/\s+/g, ' ').trim()).filter(Boolean)
}

async function mercadoLibreCandidates(product, variant, query) {
  const searchUrl = `https://api.mercadolibre.com/sites/MLC/search?q=${encodeURIComponent(query)}&limit=8`
  const searchRes = await fetch(searchUrl, { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' } })
  if (!searchRes.ok) return []

  const searchData = await searchRes.json()
  const results = searchData.results ?? []
  const candidateGroups = await Promise.all(results.map(async (item) => {
    const detailRes = await fetch(`https://api.mercadolibre.com/items/${item.id}`, {
      headers: { Accept: 'application/json' },
    })
    const detail = detailRes.ok ? await detailRes.json() : null
    const title = detail?.title ?? item.title ?? ''
    const pictures = detail?.pictures ?? []
    const urls = pictures
      .map((picture) => picture.secure_url ?? picture.url)
      .filter((url) => typeof url === 'string' && url.startsWith('http'))

    if (urls.length === 0 && item.secure_thumbnail) urls.push(item.secure_thumbnail)

    return urls.map((url, index) => ({
      url,
      title,
      score: score(`${product.name} ${variant.size}`, title) - index * 0.03,
    }))
  }))

  const terms = variantTerms(variant.size)
  return candidateGroups.flat()
    .filter((candidate) =>
      candidate.url &&
      candidate.score >= 0.28 &&
      hasTermMatch(terms, candidate.title) &&
      categoryMatches(product.category, candidate.title)
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
}

function extractDuckDuckGoVqd(html) {
  return (
    html.match(/vqd="([^"]+)/)?.[1] ??
    html.match(/vqd=([^&"']+)/)?.[1] ??
    html.match(/"vqd":"([^"]+)/)?.[1] ??
    null
  )
}

async function duckDuckGoCandidates(product, variant, query) {
  const pageUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`
  const html = await fetch(pageUrl, {
    headers: { Accept: 'text/html', 'User-Agent': 'Mozilla/5.0' },
  }).then((res) => res.text())
  const vqd = extractDuckDuckGoVqd(html)
  if (!vqd) return []

  const imagesUrl =
    `https://duckduckgo.com/i.js?l=cl-es&o=json&q=${encodeURIComponent(query)}` +
    `&vqd=${encodeURIComponent(vqd)}&f=,,,&p=1`
  const res = await fetch(imagesUrl, {
    headers: { Accept: 'application/json', Referer: pageUrl, 'User-Agent': 'Mozilla/5.0' },
  })
  if (!res.ok) return []

  const data = await res.json()
  const terms = variantTerms(variant.size)
  const colorVariant = isColorVariant(variant.size)

  return (data.results ?? [])
    .map((item) => ({
      url: item.image ?? '',
      title: item.title ?? '',
      score: score(`${product.name} ${variant.size}`, item.title ?? ''),
    }))
    .filter((candidate) => {
      if (!candidate.url.startsWith('http')) return false
      if (candidate.url.includes('.svg') || candidate.url.toLowerCase().includes('.pdf')) return false
      if (!categoryMatches(product.category, candidate.title)) return false
      if (hasTermMatch(terms, `${candidate.title} ${candidate.url}`)) return true
      return colorVariant && score(product.name, candidate.title) >= 0.5
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
}

async function findVariantImages(product, variant) {
  for (const query of queries(product, variant)) {
    const matches = await mercadoLibreCandidates(product, variant, query)
    if (matches.length > 0) return [...new Set(matches.map((match) => match.url))]

    const webMatches = await duckDuckGoCandidates(product, variant, query)
    if (webMatches.length > 0) return [...new Set(webMatches.map((match) => match.url))]
  }
  return []
}

async function runWithConcurrency(items, worker, size) {
  const results = []
  let current = 0
  async function runWorker() {
    while (current < items.length) {
      const index = current
      current++
      results[index] = await worker(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, () => runWorker()))
  return results
}

async function main() {
  const variants = await prisma.productVariant.findMany({
    where: {
      product: { category: { in: categories } },
      ...(overwrite ? {} : { OR: [{ imageUrl: null }, { imageUrl: '' }, { images: { none: {} } }] }),
    },
    include: { product: true, images: true },
    orderBy: { product: { createdAt: 'desc' } },
    take: limit,
  })

  console.log(`Variantes objetivo: ${variants.length}`)
  console.log(`Categorias: ${categories.join(', ')} | overwrite=${overwrite} | dryRun=${dryRun}`)

  let updated = 0
  let skipped = 0

  const results = await runWithConcurrency(variants, async (variant) => {
    try {
      const images = await findVariantImages(variant.product, variant)
      if (images.length === 0) {
        return { status: 'skipped', message: `SIN MATCH ${variant.product.name} / ${variant.size}` }
      }

      if (!dryRun) {
        await prisma.$transaction(async (tx) => {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { imageUrl: images[0] },
          })
          await tx.productVariantImage.deleteMany({ where: { variantId: variant.id } })
          await tx.productVariantImage.createMany({
            data: images.map((url, index) => ({ variantId: variant.id, url, order: index })),
          })
        })
      }

      return {
        status: 'updated',
        message: `${dryRun ? 'DRY' : 'OK'} ${variant.product.name} / ${variant.size}\n  -> ${images[0]}`,
      }
    } catch (error) {
      return {
        status: 'skipped',
        message: `ERROR ${variant.product.name} / ${variant.size} | ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }, concurrency)

  for (const result of results) {
    console.log(result.message)
    if (result.status === 'updated') updated++
    else skipped++
  }

  console.log(`Listo. Actualizadas: ${updated}. Omitidas: ${skipped}.`)
}

try {
  await main()
} finally {
  await prisma.$disconnect()
  await pool.end()
}
