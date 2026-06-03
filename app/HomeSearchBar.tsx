'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function HomeSearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    router.push(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : '/shop')
  }

  return (
    <form className="shop-search-control" onSubmit={submit}>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar productos, marcas y mas..."
        aria-label="Buscar productos"
      />
      {query && (
        <button type="button" className="shop-search-clear" onClick={() => setQuery('')} aria-label="Limpiar busqueda">
          x
        </button>
      )}
      <button className="shop-search-submit" type="submit" aria-label="Buscar">
        <Search className="size-5" />
      </button>
    </form>
  )
}
