'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (deleting) return
    if (!confirm('Eliminar este producto tambien quitara sus imagenes, variantes y descuentos asociados. Esta accion no se puede deshacer.')) return

    setDeleting(true)
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="min-h-11 whitespace-nowrap">
      {deleting ? 'Eliminando...' : 'Eliminar'}
    </Button>
  )
}
