/**
 * lib/bsale-sync.ts
 * Sincronizador Bsale → Supabase
 */

import { prisma } from '@/lib/prisma'
import { Category } from '@prisma/client'
import { getProductImages } from './image-enrichment'

const BSALE_TOKEN = process.env.BSALE_ACCESS_TOKEN!
const BSALE_API = 'https://api.bsale.cl/v1'

const headers = {
  access_token: BSALE_TOKEN,
  'Content-Type': 'application/json',
}

const CATEGORY_IMAGES: Record<Category, string> = {
  Carcasa:
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80',

  Lamina:
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',

  Cargador:
    'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80',

  Cable:
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',

  Audifonos:
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',

  Vapers:
    'https://images.unsplash.com/photo-1567781769939-5b4e6dc30e66?w=400&q=80',

  Computacion:
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80',

  Otros:
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80',
}

type BsalePaged<T> = {
  count: number
  items: T[]
}

type BsaleVariant = {
  id: number
  description: string
  urlImage?: string
}

type BsaleProduct = {
  id: number
  name: string
  product_type: { name: string } | null
  variants: BsalePaged<BsaleVariant> | null
}

type BsalePriceDetail = {
  variantValueWithTaxes: number
  variant: { id: string }
}

type BsaleStock = {
  quantityAvailable: number
  variant: { id: string }
}

type BsaleListResponse<T> = {
  count: number
  limit: number
  offset: number
  items: T[]
}

async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const results: T[] = []

  let offset = 0
  const limit = 50

  while (true) {
    const url =
      `${BSALE_API}${endpoint}` +
      `${endpoint.includes('?') ? '&' : '?'}` +
      `limit=${limit}&offset=${offset}`

    const res = await fetch(url, { headers })

    if (!res.ok) {
      const txt = await res.text()

      throw new Error(
        `Bsale API error ${res.status}: ${txt}`
      )
    }

    const data: BsaleListResponse<T> = await res.json()

    results.push(...data.items)

    if (results.length >= data.count) break

    offset += limit
  }

  return results
}

function mapCategory(
  typeName: string | null | undefined
): Category {
  if (!typeName) return Category.Otros

  const t = typeName.toLowerCase()

  if (t.includes('carcas')) return Category.Carcasa

  if (
    t.includes('lamin') ||
    t.includes('vidrio') ||
    t.includes('protec')
  ) {
    return Category.Lamina
  }

  if (t.includes('cargad')) return Category.Cargador

  if (t.includes('cable')) return Category.Cable

  if (
    t.includes('audif') ||
    t.includes('auricular') ||
    t.includes('audio')
  ) {
    return Category.Audifonos
  }

  if (
    t.includes('vaper') ||
    t.includes('vaporizad')
  ) {
    return Category.Vapers
  }

  if (
    t.includes('computa') ||
    t.includes('notebook') ||
    t.includes('pc')
  ) {
    return Category.Computacion
  }

  return Category.Otros
}

export type SyncResult = {
  created: number
  updated: number
  skipped: number
  errors: string[]
}

export async function syncBsaleToSupabase(): Promise<SyncResult> {
  if (!BSALE_TOKEN) {
    throw new Error(
      'BSALE_ACCESS_TOKEN no está configurado'
    )
  }

  const result: SyncResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  console.log('🔄 Cargando precios...')
  const priceDetails =
    await fetchAll<BsalePriceDetail>(
      '/price_lists/1/details.json'
    )

  const priceMap = new Map<string, number>()

  for (const d of priceDetails) {
    priceMap.set(
      d.variant.id,
      d.variantValueWithTaxes
    )
  }

  console.log('🔄 Cargando stock...')
  const stocks =
    await fetchAll<BsaleStock>('/stocks.json')

  const stockMap = new Map<string, number>()

  for (const s of stocks) {
    const prev =
      stockMap.get(s.variant.id) ?? 0

    stockMap.set(
      s.variant.id,
      prev + (s.quantityAvailable ?? 0)
    )
  }

  console.log('🔄 Cargando productos...')

  const products =
    await fetchAll<BsaleProduct>(
      '/products.json?expand=[product_type,variants]'
    )

  console.log(
    `🛍️ ${products.length} productos encontrados`
  )

  for (const bp of products) {
    try {
      const variants =
        bp.variants?.items ?? []

      const firstVariantId = String(
        variants[0]?.id ?? ''
      )

      const price =
        priceMap.get(firstVariantId) ?? 0

      const totalStock = variants.reduce(
        (acc, v) => {
          return (
            acc +
            (stockMap.get(String(v.id)) ?? 0)
          )
        },
        0
      )

      const category = mapCategory(
        bp.product_type?.name
      )

      const bsaleImage =
        variants.find(v => v.urlImage)
          ?.urlImage ?? null

      const fallbackImage =
        CATEGORY_IMAGES[category]

      const images =
        await getProductImages(bp.name)

      const existing =
        await prisma.product.findFirst({
          where: {
            name: bp.name,
          },
        })

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },

          data: {
            price,
            stock: Math.floor(totalStock),
            category,

            imageUrl:
              images[0] ??
              bsaleImage ??
              existing.imageUrl ??
              fallbackImage,
          },
        })

        if (images.length > 0) {
          await prisma.productImage.deleteMany({
            where: {
              productId: existing.id,
            },
          })

          await prisma.productImage.createMany({
            data: images.map(
              (url, index) => ({
                productId: existing.id,
                url,
                order: index,
              })
            ),
          })
        }

        result.updated++
      } else {
        const created =
          await prisma.product.create({
            data: {
              name: bp.name,
              price,
              stock: Math.floor(totalStock),
              category,

              imageUrl:
                images[0] ??
                bsaleImage ??
                fallbackImage,
            },
          })

        if (images.length > 0) {
          await prisma.productImage.createMany({
            data: images.map(
              (url, index) => ({
                productId: created.id,
                url,
                order: index,
              })
            ),
          })
        }

        if (variants.length > 1) {
          for (const v of variants) {
            if (
              !v.description ||
              v.description === bp.name
            ) {
              continue
            }

            const variantStock =
              Math.floor(
                stockMap.get(
                  String(v.id)
                ) ?? 0
              )

            await prisma.productVariant.create({
              data: {
                productId: created.id,
                size: v.description,
                stock: variantStock,
              },
            })
          }
        }

        result.created++
      }
    } catch (err) {
      result.errors.push(
        `[${bp.name}] ${err}`
      )

      result.skipped++
    }
  }

  console.log(
    `✅ Sync completado — Creados: ${result.created} | Actualizados: ${result.updated} | Errores: ${result.skipped}`
  )

  return result
}