'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'sales', label: 'Más vendidos' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'alpha_asc', label: 'Nombre: A a Z' },
  { value: 'alpha_desc', label: 'Nombre: Z a A' },
]

export default function SortSelect({ value, mobile = false }: { value: string; mobile?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (nextValue === 'newest') params.delete('sort')
    else params.set('sort', nextValue)
    params.delete('page')
    router.push(`/shop${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <select
      aria-label="Ordenar productos"
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      className={mobile ? 'mobile-sort-select' : 'shop-sort-select'}
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  )
}
