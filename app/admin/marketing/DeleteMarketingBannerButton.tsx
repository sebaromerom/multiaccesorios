'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function DeleteMarketingBannerButton({ id }: { id: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (deleting) return
    if (!confirm('Eliminar este banner lo quitara de las campanas visibles. Esta accion no se puede deshacer.')) return

    setDeleting(true)
    try {
      await fetch(`/api/marketing-banners/${id}`, { method: 'DELETE' })
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
