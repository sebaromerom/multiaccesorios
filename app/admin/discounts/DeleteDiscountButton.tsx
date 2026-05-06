'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function DeleteDiscountButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('¿Eliminar este descuento?')) return

    await fetch(`/api/discounts/${id}`, {
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