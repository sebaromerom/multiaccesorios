'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type EnrichImagesResult = {
  scanned: number
  updated: number
  skipped: number
  errors: string[]
}

export default function EnrichImagesButton() {
  const [loading, setLoading] = useState(false)

  async function handleEnrichImages() {
    if (!confirm('Buscar imagenes para productos sin foto? Se procesaran hasta 25 productos por vez.')) return

    setLoading(true)
    toast.info('Buscando imagenes de productos...')

    try {
      const res = await fetch('/api/admin/enrich-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 25, overwrite: false }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        toast.error(`Error: ${data.error ?? 'Error desconocido'}`)
        return
      }

      const result: EnrichImagesResult = data.result
      toast.success(
        `Imagenes listas: ${result.updated} actualizados, ${result.skipped} omitidos`
      )

      if (result.errors.length > 0) {
        console.warn('Errores enriqueciendo imagenes:', result.errors)
      }

      window.location.reload()
    } catch (err) {
      toast.error('Error de conexion al buscar imagenes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleEnrichImages}
      disabled={loading}
      variant="outline"
      className="rounded-none border-2 border-black hover:bg-black hover:text-white uppercase tracking-widest text-xs font-bold transition-all px-6 py-5"
    >
      {loading ? 'Buscando imagenes...' : 'Buscar imagenes'}
    </Button>
  )
}
