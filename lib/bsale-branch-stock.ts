const BSALE_API = 'https://api.bsale.cl/v1'

type BsaleListResponse<T> = {
  count: number
  items: T[]
}

type BsaleOffice = {
  id: number
  name: string
  address?: string
}

type BsaleVariant = {
  id: number
}

type BsaleProduct = {
  name: string
  variants: { items: BsaleVariant[] } | null
}

type BsaleStock = {
  quantityAvailable: number
  variant: { id: string }
  office: { id: string }
}

export type BranchStockSummary = {
  officeId: string
  name: string
  address?: string
  stock: number
}

const normalizeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const token = process.env.BSALE_ACCESS_TOKEN
  if (!token) return []

  const results: T[] = []
  let offset = 0
  const limit = 50

  while (true) {
    const url = `${BSALE_API}${endpoint}${endpoint.includes('?') ? '&' : '?'}limit=${limit}&offset=${offset}`
    const res = await fetch(url, {
      headers: { access_token: token, 'Content-Type': 'application/json' },
      next: { revalidate: 600 },
    })

    if (!res.ok) throw new Error(`Bsale API error ${res.status}`)

    const data = (await res.json()) as BsaleListResponse<T>
    results.push(...data.items)
    if (results.length >= data.count) break
    offset += limit
  }

  return results
}

export async function getBranchStockByProductName(names: string[]) {
  const wanted = new Set(names.map(normalizeName))
  if (wanted.size === 0) return new Map<string, BranchStockSummary[]>()

  try {
    const [offices, products, stocks] = await Promise.all([
      fetchAll<BsaleOffice>('/offices.json'),
      fetchAll<BsaleProduct>('/products.json?expand=[variants]'),
      fetchAll<BsaleStock>('/stocks.json'),
    ])

    const officeMap = new Map(
      offices.map((office) => [
        String(office.id),
        { name: office.name, address: office.address },
      ]),
    )
    const variantToProduct = new Map<string, string>()

    for (const product of products) {
      const key = normalizeName(product.name)
      if (!wanted.has(key)) continue
      for (const variant of product.variants?.items ?? []) {
        variantToProduct.set(String(variant.id), key)
      }
    }

    const byProduct = new Map<string, Map<string, number>>()

    for (const stock of stocks) {
      const productKey = variantToProduct.get(String(stock.variant.id))
      if (!productKey) continue
      const officeId = String(stock.office.id)
      const byOffice = byProduct.get(productKey) ?? new Map<string, number>()
      byOffice.set(officeId, (byOffice.get(officeId) ?? 0) + Math.max(0, stock.quantityAvailable ?? 0))
      byProduct.set(productKey, byOffice)
    }

    const result = new Map<string, BranchStockSummary[]>()
    for (const [productKey, byOffice] of byProduct.entries()) {
      result.set(
        productKey,
        [...byOffice.entries()]
          .map(([officeId, stock]) => ({
            officeId,
            name: officeMap.get(officeId)?.name ?? `Sucursal ${officeId}`,
            address: officeMap.get(officeId)?.address,
            stock,
          }))
          .sort((a, b) => a.officeId.localeCompare(b.officeId)),
      )
    }

    return result
  } catch (error) {
    console.error('No se pudo cargar stock por sucursal desde Bsale', error)
    return new Map<string, BranchStockSummary[]>()
  }
}

export async function getAllBranchStockFromBsale() {
  try {
    const [offices, products, stocks] = await Promise.all([
      fetchAll<BsaleOffice>('/offices.json'),
      fetchAll<BsaleProduct>('/products.json?expand=[variants]'),
      fetchAll<BsaleStock>('/stocks.json'),
    ])

    const officeMap = new Map(
      offices.map((office) => [
        String(office.id),
        { name: office.name, address: office.address },
      ]),
    )
    const variantToProduct = new Map<string, string>()

    for (const product of products) {
      const key = normalizeName(product.name)
      for (const variant of product.variants?.items ?? []) {
        variantToProduct.set(String(variant.id), key)
      }
    }

    const byProduct = new Map<string, Map<string, number>>()
    for (const stock of stocks) {
      const productKey = variantToProduct.get(String(stock.variant.id))
      if (!productKey) continue
      const officeId = String(stock.office.id)
      const byOffice = byProduct.get(productKey) ?? new Map<string, number>()
      byOffice.set(officeId, (byOffice.get(officeId) ?? 0) + Math.max(0, stock.quantityAvailable ?? 0))
      byProduct.set(productKey, byOffice)
    }

    return { byProduct, officeMap }
  } catch (error) {
    console.error('No se pudo cargar stock completo desde Bsale', error)
    return { byProduct: new Map<string, Map<string, number>>(), officeMap: new Map<string, { name: string; address?: string }>() }
  }
}

export { normalizeName as normalizeBsaleProductName }
