'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function DeleteMarketingBannerButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('¿Eliminar este banner?')) return

    await fetch(`/api/marketing-banners/${id}`, {
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
