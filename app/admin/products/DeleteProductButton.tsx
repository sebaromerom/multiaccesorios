'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('¿Eliminar este producto?')) return

    await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    })

    router.refresh()
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      Eliminar
    </Button>
  )
}