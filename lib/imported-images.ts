import crypto from 'node:crypto'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const MAX_BYTES = 8 * 1024 * 1024
const MIN_SIZE = 480
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const SIZES = [
  { key: 'thumb', size: 320 },
  { key: 'medium', size: 800 },
  { key: 'large', size: 1200 },
] as const

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
      headers: { Accept: 'image/avif,image/webp,image/png,image/jpeg;q=0.9,*/*;q=0.1' },
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

export async function importExternalImage(sourceUrl: string): Promise<ImportedImageResult | null> {
  const url = sourceUrl.trim()
  if (!url || looksLikePlaceholder(url)) return null

  const existingBySource = await prisma.importedImage.findUnique({ where: { sourceUrl: url } })
  if (existingBySource) return existingBySource

  const { buffer, contentType } = await fetchImage(url)
  const hash = crypto.createHash('sha256').update(buffer).digest('hex')

  const existingByHash = await prisma.importedImage.findUnique({ where: { hash } })
  if (existingByHash) {
    return existingByHash
  }

  const metadata = await sharp(buffer, { failOn: 'error' }).metadata()
  const width = metadata.width ?? 0
  const height = metadata.height ?? 0
  if (width < MIN_SIZE || height < MIN_SIZE) throw new Error(`Imagen pequena: ${width}x${height}`)

  const supabase = storageClient()
  const urls: Record<string, string> = {}
  for (const item of SIZES) {
    const output = await buildWebp(buffer, item.size)
    const path = `imported/${hash}/${item.key}.webp`
    const { error } = await supabase.storage.from('products').upload(path, output, {
      contentType: 'image/webp',
      upsert: true,
    })
    if (error) throw new Error(`Supabase upload: ${error.message}`)
    urls[item.key] = publicUrl(path)
  }

  const saved = await prisma.importedImage.create({
    data: {
      sourceUrl: url,
      hash,
      mimeType: contentType,
      width,
      height,
      bytes: buffer.length,
      thumbUrl: urls.thumb,
      mediumUrl: urls.medium,
      largeUrl: urls.large,
    },
  })

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

export async function migrateStoredExternalImages(limit = 25) {
  const cappedLimit = Math.min(Math.max(limit, 1), 120)
  const result = {
    scanned: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
  }

  const products = await prisma.product.findMany({
    where: { stock: { gt: 0 }, price: { gt: 0 }, category: { not: null } },
    include: {
      images: { orderBy: { order: 'asc' } },
      variants: { include: { images: { orderBy: { order: 'asc' } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: cappedLimit,
  })

  for (const product of products) {
    result.scanned++
    try {
      const productImport = canImportStoredUrl(product.imageUrl)
        ? await importExternalImage(product.imageUrl!)
        : null

      const galleryUpdates: { id: string; url: string }[] = []
      const variantGalleryUpdates: { id: string; url: string }[] = []
      for (const image of product.images) {
        if (!canImportStoredUrl(image.url)) continue
        const imported = await importExternalImage(image.url)
        if (imported) galleryUpdates.push({ id: image.id, url: imported.mediumUrl })
      }

      const variantUpdates: { id: string; imageUrl: string }[] = []
      for (const variant of product.variants) {
        const imported = canImportStoredUrl(variant.imageUrl)
          ? await importExternalImage(variant.imageUrl!)
          : null
        if (imported) variantUpdates.push({ id: variant.id, imageUrl: imported.mediumUrl })

        for (const image of variant.images) {
          if (!canImportStoredUrl(image.url)) continue
          const imageImport = await importExternalImage(image.url)
          if (imageImport) variantGalleryUpdates.push({ id: image.id, url: imageImport.mediumUrl })
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
      else result.skipped++
    } catch (error) {
      result.skipped++
      result.errors.push(`[${product.name}] ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return result
}
