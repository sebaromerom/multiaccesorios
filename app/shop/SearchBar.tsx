'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

export default function SearchBar({ instant = true }: { instant?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  useEffect(() => {
    if (!instant) return

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
  }, [instant, query, router, searchParams])

  function submitSearch() {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    router.push(`/shop${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="shop-search-control">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') submitSearch()
        }}
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
      <button className="shop-search-submit" type="button" aria-label="Buscar" onClick={submitSearch}>
        <Search className="size-5" />
      </button>
    </div>
  )
}
