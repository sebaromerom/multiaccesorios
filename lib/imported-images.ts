import crypto from 'node:crypto'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const MAX_BYTES = 8 * 1024 * 1024
const MIN_SIZE = 400
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const SIZES = [
  { key: 'thumb', size: 320 },
  { key: 'medium', size: 800 },
  { key: 'large', size: 1200 },
] as const
const FETCH_HEADERS = {
  Accept: 'image/avif,image/webp,image/png,image/jpeg;q=0.9,*/*;q=0.1',
  Referer: 'https://www.google.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
}

export type ImportedImageResult = {
  thumbUrl: string
  mediumUrl: string
  largeUrl: string
}

function storageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false } })
}

function publicUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL')
  return `${base}/storage/v1/object/public/products/${path}`
}

function looksLikePlaceholder(url: string) {
  return /placeholder|placehold|no-image|default|logo|multi\.jpe?g/i.test(url)
}

async function fetchImage(url: string, attempt = 1): Promise<{ buffer: Buffer; contentType: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: FETCH_HEADERS,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const contentType = (res.headers.get('content-type') ?? '').split(';')[0].toLowerCase()
    if (!SUPPORTED_TYPES.has(contentType)) throw new Error(`Formato no soportado: ${contentType || 'sin content-type'}`)
    const contentLength = Number(res.headers.get('content-length') ?? 0)
    if (contentLength > MAX_BYTES) throw new Error('Imagen demasiado pesada')
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    if (buffer.length > MAX_BYTES) throw new Error('Imagen demasiado pesada')
    return { buffer, contentType }
  } catch (error) {
    if (attempt < 3) return fetchImage(url, attempt + 1)
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function buildWebp(buffer: Buffer, size: number) {
  return sharp(buffer, { failOn: 'error' })
    .rotate()
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .webp({ quality: size >= 1200 ? 78 : 74, effort: 4 })
    .toBuffer()
}

async function storedImageIsUsable(url: string) {
  try {
    const res = await fetch(url, { headers: { Accept: 'image/webp,image/*;q=0.9' } })
    if (!res.ok) return false
    const buffer = Buffer.from(await res.arrayBuffer())
    await sharp(buffer, { failOn: 'error' }).metadata()
    return true
  } catch {
    return false
  }
}

async function uploadWebpVersions(buffer: Buffer, hash: string) {
  const supabase = storageClient()
  const urls: Record<string, string> = {}

  for (const item of SIZES) {
    const output = await buildWebp(buffer, item.size)
    const path = `imported/${hash}/${item.key}.webp`
    const body = new Blob([new Uint8Array(output)], { type: 'image/webp' })
    const { error } = await supabase.storage.from('products').upload(path, body, {
      contentType: 'image/webp',
      upsert: true,
    })
    if (error) throw new Error(`Supabase upload: ${error.message}`)
    urls[item.key] = publicUrl(path)
  }

  return urls
}

export async function importExternalImage(sourceUrl: string): Promise<ImportedImageResult | null> {
  const url = sourceUrl.trim()
  if (!url || looksLikePlaceholder(url)) return null

  const existingBySource = await prisma.importedImage.findUnique({ where: { sourceUrl: url } })
  if (existingBySource && await storedImageIsUsable(existingBySource.mediumUrl)) return existingBySource

  const { buffer, contentType } = await fetchImage(url)
  const hash = crypto.createHash('sha256').update(buffer).digest('hex')

  const existingByHash = await prisma.importedImage.findUnique({ where: { hash } })
  if (existingByHash && await storedImageIsUsable(existingByHash.mediumUrl)) {
    return existingByHash
  }

  const metadata = await sharp(buffer, { failOn: 'error' }).metadata()
  const width = metadata.width ?? 0
  const height = metadata.height ?? 0
  if (width < MIN_SIZE || height < MIN_SIZE) throw new Error(`Imagen pequena: ${width}x${height}`)

  const urls = await uploadWebpVersions(buffer, hash)

  const data = {
      sourceUrl: url,
      hash,
      mimeType: contentType,
      width,
      height,
      bytes: buffer.length,
      thumbUrl: urls.thumb,
      mediumUrl: urls.medium,
      largeUrl: urls.large,
    }
  const saved = existingBySource
    ? await prisma.importedImage.update({ where: { id: existingBySource.id }, data })
    : existingByHash
      ? await prisma.importedImage.update({ where: { id: existingByHash.id }, data })
      : await prisma.importedImage.create({ data })

  return saved
}

export async function importFirstValidImage(urls: string[], logPrefix: string) {
  for (const url of [...new Set(urls)]) {
    try {
      const imported = await importExternalImage(url)
      if (imported) return imported
    } catch (error) {
      console.warn(`[image-import] ${logPrefix}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  return null
}

function isOwnSupabaseImage(url: string | null | undefined) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return Boolean(url && supabaseUrl && url.startsWith(`${supabaseUrl}/storage/v1/object/public/products/`))
}

function canImportStoredUrl(url: string | null | undefined) {
  if (!url) return false
  if (!url.startsWith('https://')) return false
  if (isOwnSupabaseImage(url)) return false
  if (looksLikePlaceholder(url)) return false
  return true
}

async function safeImportStoredUrl(url: string | null | undefined, errors: string[], label: string) {
  if (!canImportStoredUrl(url)) return null
  try {
    return await importExternalImage(url!)
  } catch (error) {
    errors.push(`[${label}] ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

export async function migrateStoredExternalImages(limit = 25, productId?: string) {
  const cappedLimit = Math.min(Math.max(limit, 1), 120)
  const result = {
    scanned: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
  }

  const products = await prisma.product.findMany({
    where: productId
      ? { id: productId }
      : { stock: { gt: 0 }, price: { gt: 0 }, category: { not: null } },
    include: {
      images: { orderBy: { order: 'asc' } },
      variants: { include: { images: { orderBy: { order: 'asc' } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: cappedLimit,
  })

  for (const product of products) {
    result.scanned++
    const productErrors: string[] = []
    try {
      let productImport = await safeImportStoredUrl(product.imageUrl, productErrors, `${product.name} / principal`)

      const galleryUpdates: { id: string; url: string }[] = []
      const variantGalleryUpdates: { id: string; url: string }[] = []
      for (const image of product.images) {
        const imported = await safeImportStoredUrl(image.url, productErrors, `${product.name} / galeria`)
        if (imported) galleryUpdates.push({ id: image.id, url: imported.mediumUrl })
        if (!productImport && imported) productImport = imported
      }

      const variantUpdates: { id: string; imageUrl: string }[] = []
      for (const variant of product.variants) {
        let imported = await safeImportStoredUrl(variant.imageUrl, productErrors, `${product.name} / ${variant.size}`)
        if (imported) variantUpdates.push({ id: variant.id, imageUrl: imported.mediumUrl })
        if (!productImport && imported) productImport = imported

        for (const image of variant.images) {
          const imageImport = await safeImportStoredUrl(image.url, productErrors, `${product.name} / ${variant.size} galeria`)
          if (imageImport) variantGalleryUpdates.push({ id: image.id, url: imageImport.mediumUrl })
          if (!imported && imageImport) {
            imported = imageImport
            variantUpdates.push({ id: variant.id, imageUrl: imageImport.mediumUrl })
          }
          if (!productImport && imageImport) productImport = imageImport
        }
      }

      await prisma.$transaction(async (tx) => {
        if (productImport) {
          await tx.product.update({ where: { id: product.id }, data: { imageUrl: productImport.mediumUrl } })
        }
        for (const image of galleryUpdates) {
          await tx.productImage.update({ where: { id: image.id }, data: { url: image.url } })
        }
        for (const image of variantGalleryUpdates) {
          await tx.productVariantImage.update({ where: { id: image.id }, data: { url: image.url } })
        }
        for (const variant of variantUpdates) {
          await tx.productVariant.update({ where: { id: variant.id }, data: { imageUrl: variant.imageUrl } })
        }
      })

      const changed = Boolean(productImport) || galleryUpdates.length > 0 || variantGalleryUpdates.length > 0 || variantUpdates.length > 0
      if (changed) result.updated++
      else {
        result.skipped++
        result.errors.push(...productErrors.slice(0, 3))
      }
    } catch (error) {
      result.skipped++
      result.errors.push(`[${product.name}] ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return result
}

export async function repairImportedImageAssets(limit = 50, productId?: string) {
  const cappedLimit = Math.min(Math.max(limit, 1), 200)
  const result = { scanned: 0, repaired: 0, skipped: 0, errors: [] as string[] }

  const products = await prisma.product.findMany({
    where: productId ? { id: productId } : { stock: { gt: 0 }, price: { gt: 0 }, category: { not: null } },
    include: {
      images: true,
      variants: { include: { images: true } },
    },
    take: cappedLimit,
  })

  const urls = new Set<string>()
  for (const product of products) {
    if (isOwnSupabaseImage(product.imageUrl)) urls.add(product.imageUrl!)
    for (const image of product.images) if (isOwnSupabaseImage(image.url)) urls.add(image.url)
    for (const variant of product.variants) {
      if (isOwnSupabaseImage(variant.imageUrl)) urls.add(variant.imageUrl!)
      for (const image of variant.images) if (isOwnSupabaseImage(image.url)) urls.add(image.url)
    }
  }

  const imports = await prisma.importedImage.findMany({
    where: {
      OR: [
        { thumbUrl: { in: [...urls] } },
        { mediumUrl: { in: [...urls] } },
        { largeUrl: { in: [...urls] } },
      ],
    },
  })

  for (const image of imports) {
    result.scanned++
    try {
      if (await storedImageIsUsable(image.mediumUrl)) {
        result.skipped++
        continue
      }
      const { buffer } = await fetchImage(image.sourceUrl)
      await uploadWebpVersions(buffer, image.hash)
      result.repaired++
    } catch (error) {
      result.errors.push(`[${image.sourceUrl}] ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return result
}
