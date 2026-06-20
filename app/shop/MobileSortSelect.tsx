'use client'

import { useRouter } from 'next/navigation'

interface MobileSortSelectProps {
  currentSort: string
  q?: string
  cat?: string
}

export default function MobileSortSelect({ currentSort, q, cat }: MobileSortSelectProps) {
  const router = useRouter()

  const handleChange = (newValue: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (cat) params.set('cat', cat)
    if (newValue !== 'popular') params.set('sort', newValue)
    params.set('page', '1')

    router.push(`/shop?${params.toString()}`)
  }

  return (
    <div className="mobile-sort-wrapper">
      <select
        className="mobile-sort-select"
        value={currentSort}
        onChange={(event) => handleChange(event.target.value)}
      >
        <option value="popular">Popularidad</option>
        <option value="newest">Más recientes</option>
        <option value="sales">Más vendidos</option>
        <option value="price_asc">Precio: menor a mayor</option>
        <option value="price_desc">Precio: mayor a menor</option>
        <option value="alpha_asc">Nombre: A a Z</option>
        <option value="alpha_desc">Nombre: Z a A</option>
      </select>
    </div>
  )
}
