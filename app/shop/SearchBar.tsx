'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (query.trim()) {
        params.set('q', query.trim())
        params.delete('page')
      } else {
        params.delete('q')
      }

      router.push(`/shop${params.toString() ? `?${params.toString()}` : ''}`)
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, router, searchParams])

  return (
    <div className="shop-search-control">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar productos, marcas y mas..."
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="shop-search-clear"
          type="button"
          aria-label="Limpiar busqueda"
        >
          x
        </button>
      )}
      <button className="shop-search-submit" type="button" aria-label="Buscar">
        <Search className="size-5" />
      </button>
    </div>
  )
}
