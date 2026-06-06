'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

export default function SearchBar({ instant = true, initialQuery = '' }: { instant?: boolean; initialQuery?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramsString = searchParams.toString()
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    if (!instant) return

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(paramsString)

      if (query.trim()) {
        params.set('q', query.trim())
        params.delete('page')
      } else {
        params.delete('q')
      }

      const nextParams = params.toString()
      if (nextParams !== paramsString) {
        router.replace(`/shop${nextParams ? `?${nextParams}` : ''}`)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [instant, paramsString, query, router])

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
