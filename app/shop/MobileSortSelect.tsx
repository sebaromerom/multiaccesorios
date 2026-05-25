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
    if (newValue !== 'newest') params.set('sort', newValue)
    params.set('page', '1') // Al cambiar el orden, reiniciamos a la página 1

    router.push(`/shop?${params.toString()}`)
  }

  return (
    <div className="mobile-sort-wrapper">
      <select 
        className="mobile-sort-select"
        value={currentSort}
        onChange={(e) => handleChange(e.target.value)}
      >
        <option value="newest">Más recientes</option>
        <option value="price_asc">Precio: Menor a Mayor</option>
        <option value="price_desc">Precio: Mayor a Menor</option>
        {/* ── NUEVAS OPCIONES DE ORDENAMIENTO ALFABÉTICO MÓVIL ── */}
        <option value="alpha_asc">Nombre: A a la Z</option>
        <option value="alpha_desc">Nombre: Z a la A</option>
      </select>
    </div>
  )
}