'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function DeleteDiscountButton({ id }: { id: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (deleting) return
    if (!confirm('Eliminar este descuento lo desactivara para nuevas compras. Esta accion no se puede deshacer.')) return

    setDeleting(true)
    try {
      await fetch(`/api/discounts/${id}`, { method: 'DELETE' })
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
