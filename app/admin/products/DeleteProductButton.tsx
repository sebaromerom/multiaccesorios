'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function DeleteProductButton({ id, compact = false }: { id: string; compact?: boolean }) {
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
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={deleting}
      className={compact ? 'h-9 w-9 rounded-[4px] p-0' : 'min-h-11 whitespace-nowrap'}
      title="Eliminar producto"
    >
      {compact ? <Trash2 className="size-4" /> : deleting ? 'Eliminando...' : 'Eliminar'}
    </Button>
  )
}
