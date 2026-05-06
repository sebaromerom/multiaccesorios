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

type Discount = {
  id: string
  name: string
  type: string
  value: number
  minQuantity: number
  active: boolean
  productId: string | null
}

type Product = {
  id: string
  name: string
}

export default function EditDiscountForm({
  discount,
  products,
}: {
  discount: Discount
  products: Product[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<string>(discount.type)
  const [productId, setProductId] = useState<string>(discount.productId ?? 'all')
  const [active, setActive] = useState<string>(discount.active ? 'true' : 'false')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const value = Number(formData.get('value'))
    const minQuantity = Number(formData.get('minQuantity'))

    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      setLoading(false)
      return
    }
    if (type !== '2x1' && value <= 0) {
      toast.error('El valor del descuento debe ser mayor a 0')
      setLoading(false)
      return
    }
    if (type === 'percentage' && value > 100) {
      toast.error('El porcentaje no puede ser mayor a 100')
      setLoading(false)
      return
    }
    if (minQuantity < 1) {
      toast.error('La cantidad mínima debe ser al menos 1')
      setLoading(false)
      return
    }

    await fetch(`/api/discounts/${discount.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        type,
        value,
        minQuantity,
        productId: productId === 'all' ? null : productId,
        active: active === 'true',
      }),
    })

    toast.success('Descuento actualizado')
    router.push('/admin/discounts')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Descuento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" defaultValue={discount.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Tipo de descuento</Label>
            <Select value={type} onValueChange={(value: string | null) => setType(value ?? 'percentage')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Porcentaje</SelectItem>
                <SelectItem value="fixed">Monto fijo</SelectItem>
                <SelectItem value="2x1">2x1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type !== '2x1' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="value">
                {type === 'percentage' ? 'Porcentaje (%)' : 'Monto ($)'}
              </Label>
              <Input id="value" name="value" type="number" step="0.01" defaultValue={discount.value} />
            </div>
          )}
          {type === '2x1' && <input type="hidden" name="value" value="0" />}
          <div className="flex flex-col gap-2">
            <Label htmlFor="minQuantity">Cantidad mínima</Label>
            <Input id="minQuantity" name="minQuantity" type="number" defaultValue={discount.minQuantity} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Producto</Label>
            <Select value={productId} onValueChange={(value: string | null) => setProductId(value ?? 'all')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Estado</Label>
            <Select value={active} onValueChange={(value: string | null) => setActive(value ?? 'true')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}