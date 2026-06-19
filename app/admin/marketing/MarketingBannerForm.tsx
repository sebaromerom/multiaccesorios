'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BANNER_POSITIONS } from '@/lib/marketing-constants'

type MarketingBanner = {
  id: string
  title: string
  subtitle: string | null
  eyebrow: string | null
  imageUrl: string | null
  mobileImageUrl: string | null
  href: string
  position: string
  active: boolean
  priority: number
  startsAt: Date | string | null
  endsAt: Date | string | null
}

function formatDatetimeLocal(value: Date | string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)
  return localDate.toISOString().slice(0, 16)
}

export default function MarketingBannerForm({
  banner,
}: {
  banner?: MarketingBanner
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState(banner?.position ?? 'home_hero')
  const [active, setActive] = useState(banner?.active ?? true)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      title: String(formData.get('title') ?? '').trim(),
      subtitle: String(formData.get('subtitle') ?? '').trim(),
      eyebrow: String(formData.get('eyebrow') ?? '').trim(),
      imageUrl: String(formData.get('imageUrl') ?? '').trim(),
      mobileImageUrl: String(formData.get('mobileImageUrl') ?? '').trim(),
      href: String(formData.get('href') ?? '').trim(),
      position,
      active,
      priority: Number(formData.get('priority') ?? 0),
      startsAt: String(formData.get('startsAt') ?? ''),
      endsAt: String(formData.get('endsAt') ?? ''),
    }

    if (!payload.title || !payload.href) {
      toast.error('Título y link son obligatorios')
      setLoading(false)
      return
    }

    const response = await fetch(
      banner ? `/api/marketing-banners/${banner.id}` : '/api/marketing-banners',
      {
        method: banner ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => null)
      toast.error(error?.error ?? 'No se pudo guardar el banner')
      setLoading(false)
      return
    }

    toast.success(banner ? 'Banner actualizado' : 'Banner creado')
    router.push('/admin/marketing')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{banner ? 'Editar banner' : 'Nuevo banner'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" defaultValue={banner?.title ?? ''} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input id="subtitle" name="subtitle" defaultValue={banner?.subtitle ?? ''} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eyebrow">Etiqueta superior</Label>
            <Input id="eyebrow" name="eyebrow" defaultValue={banner?.eyebrow ?? ''} placeholder="Oferta flash" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="href">Link destino</Label>
            <Input id="href" name="href" defaultValue={banner?.href ?? '/shop'} placeholder="/shop?promo=1&page=1" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Posición</Label>
              <Select value={position} onValueChange={(value: string | null) => setPosition(value ?? 'home_hero')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BANNER_POSITIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={active ? 'true' : 'false'} onValueChange={(value: string | null) => setActive(value !== 'false')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="imageUrl">Imagen desktop</Label>
            <Input id="imageUrl" name="imageUrl" defaultValue={banner?.imageUrl ?? ''} placeholder="https://..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mobileImageUrl">Imagen mobile</Label>
            <Input id="mobileImageUrl" name="mobileImageUrl" defaultValue={banner?.mobileImageUrl ?? ''} placeholder="https://..." />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Input id="priority" name="priority" type="number" defaultValue={banner?.priority ?? 0} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startsAt">Inicio</Label>
              <Input id="startsAt" name="startsAt" type="datetime-local" defaultValue={formatDatetimeLocal(banner?.startsAt ?? null)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endsAt">Término</Label>
              <Input id="endsAt" name="endsAt" type="datetime-local" defaultValue={formatDatetimeLocal(banner?.endsAt ?? null)} />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
            {loading ? 'Guardando...' : 'Guardar banner'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
