'use client'

/**
 * components/admin/SyncBsaleButton.tsx
 * Botón que ejecuta la sincronización Bsale → Supabase desde el panel admin.
 * Úsalo en cualquier página del admin:
 *   import SyncBsaleButton from '@/components/admin/SyncBsaleButton'
 *   <SyncBsaleButton />
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type SyncResult = {
  created: number
  updated: number
  skipped: number
  errors:  string[]
}

export default function SyncBsaleButton() {
  const [loading, setLoading] = useState(false)

  async function handleSync() {
    if (!confirm('¿Iniciar sincronización desde Bsale? Esto puede tomar unos minutos con 900+ productos.')) return

    setLoading(true)
    toast.info('Sincronizando con Bsale...')

    try {
      const res = await fetch('/api/admin/sync-bsale', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.ok) {
        toast.error(`Error: ${data.error ?? 'Error desconocido'}`)
        return
      }

      const r: SyncResult = data.result
      toast.success(
        `Sync completado — ${r.created} creados, ${r.updated} actualizados${r.skipped > 0 ? `, ${r.skipped} con error` : ''}`
      )

      if (r.errors.length > 0) {
        console.warn('Errores de sync:', r.errors)
      }
    } catch (err) {
      toast.error('Error de conexión al sincronizar')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSync}
      disabled={loading}
      variant="outline"
      className="rounded-none border-2 border-black hover:bg-black hover:text-white uppercase tracking-widest text-xs font-bold transition-all px-6 py-5"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⟳</span> Sincronizando...
        </span>
      ) : (
        '⟳ Sync Bsale'
      )}
    </Button>
  )
}
