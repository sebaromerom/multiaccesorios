'use client'

import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewDiscountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<string>('percentage')
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [productId, setProductId] = useState<string>('all')

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then(setProducts)
  }, [])

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

    await fetch('/api/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        type,
        value,
        minQuantity,
        productId: productId === 'all' ? null : productId,
      }),
    })

    toast.success('Descuento creado')
    router.push('/admin/discounts')
    router.refresh()
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <h1 className="admin-page-title">Agregar descuento</h1>
          <p className="admin-page-kicker">Configura una nueva regla comercial.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Nueva Regla de Descuento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" />
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
                  <Input id="value" name="value" type="number" step="0.01" />
                </div>
              )}
              {type === '2x1' && <input type="hidden" name="value" value="0" />}
              <div className="flex flex-col gap-2">
                <Label htmlFor="minQuantity">Cantidad mínima</Label>
                <Input id="minQuantity" name="minQuantity" type="number" defaultValue={1} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Producto (opcional)</Label>
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
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Descuento'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
