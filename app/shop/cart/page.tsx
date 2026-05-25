'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type CartItem = {
  cartKey: string
  id: string
  name: string
  price: number
  quantity: number
  size: string | null
}

type DiscountResult = {
  subtotal: number
  discount: number
  total: number
  appliedDiscounts: { name: string; amount: number }[]
}

type DeliveryType = 'retiro' | 'despacho'

const SUCURSALES = [
  { value: 'Chacabuco 479', label: 'Chacabuco 479 — Local principal' },
  { value: 'Chacabuco 456', label: 'Chacabuco 456 — Local secundario' },
]

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [result, setResult] = useState<DiscountResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'cart' | 'checkout'>('cart')

  // Datos del cliente
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  // Entrega
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('retiro')
  const [deliverySucursal, setDeliverySucursal] = useState(SUCURSALES[0].value)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cart') ?? '[]')
    setCart(stored)
  }, [])

  useEffect(() => {
    if (cart.length === 0) return

    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
      }),
    })
      .then((r) => {
        if (!r.ok) {
          localStorage.removeItem('cart')
          setCart([])
          toast.error('Algunos productos ya no están disponibles. El carrito fue vaciado.')
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (data) setResult(data)
      })
  }, [cart])

  function updateQuantity(cartKey: string, delta: number) {
    const updated = cart
      .map((i) => (i.cartKey === cartKey ? { ...i, quantity: i.quantity + delta } : i))
      .filter((i) => i.quantity > 0)
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  function validateCheckout(): boolean {
    if (!customerName.trim()) {
      toast.error('Ingresa tu nombre completo')
      return false
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 9) {
      toast.error('Ingresa un teléfono válido (mínimo 9 dígitos)')
      return false
    }
    if (deliveryType === 'despacho') {
      if (!deliveryAddress.trim()) {
        toast.error('Ingresa tu dirección de despacho')
        return false
      }
      if (!deliveryCity.trim()) {
        toast.error('Ingresa la ciudad de despacho')
        return false
      }
    }
    return true
  }

  async function confirmOrder() {
    if (!result) return
    if (!validateCheckout()) return

    setLoading(true)

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        total: result.total,
        status: 'pending',
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        deliveryType,
        deliverySucursal: deliveryType === 'retiro' ? deliverySucursal : null,
        deliveryAddress:  deliveryType === 'despacho' ? deliveryAddress : null,
        deliveryCity:     deliveryType === 'despacho' ? deliveryCity : null,
        deliveryNotes:    deliveryNotes || null,
        items: cart.map((i) => ({
          productId: i.id,
          quantity:  i.quantity,
          unitPrice: i.price,
          size:      i.size,
        })),
      }),
    })

    if (!res.ok) {
      toast.error('Error al procesar la orden. Intenta nuevamente.')
      setLoading(false)
      return
    }

    localStorage.removeItem('cart')
    router.push('/shop/success')
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-20" style={{ animation: 'fadeIn 0.4s ease forwards' }}>
        <h1 className="text-5xl mb-4">Carrito vacío</h1>
        <p className="text-muted-foreground mb-8">No tienes productos en tu carrito.</p>
        <Button onClick={() => router.push('/shop')}>Ver productos</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto" style={{ animation: 'fadeIn 0.4s ease forwards' }}>

      {/* PASO 1 — CARRITO */}
      {step === 'cart' && (
        <>
          <h1
            className="text-5xl mb-8"
            style={{ animation: 'fadeInUp 0.5s ease forwards', opacity: 0 }}
          >
            Tu carrito
          </h1>

          <div className="flex flex-col gap-4 mb-8">
            {cart.map((item, index) => (
              <Card
                key={item.cartKey}
                style={{
                  animation: 'fadeInUp 0.5s ease forwards',
                  animationDelay: `${index * 0.08}s`,
                  opacity: 0,
                }}
              >
                <CardContent className="flex justify-between items-center py-4">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.size && (
                      <p className="text-xs tracking-widest uppercase text-muted-foreground">
                        Talla: {item.size}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      ${item.price.toLocaleString('es-CL')} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => updateQuantity(item.cartKey, -1)}>-</Button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <Button variant="outline" size="sm" onClick={() => updateQuantity(item.cartKey, 1)}>+</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {result && (
            <Card className="mb-6" style={{ animation: 'fadeInUp 0.5s ease 0.2s forwards', opacity: 0 }}>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${result.subtotal.toLocaleString('es-CL')}</span>
                </div>
                {result.appliedDiscounts.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm text-green-600">
                    <span>{d.name}</span>
                    <span>-${d.amount.toLocaleString('es-CL')}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>${result.total.toLocaleString('es-CL')}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={() => setStep('checkout')}
            style={{ animation: 'fadeInUp 0.5s ease 0.3s forwards', opacity: 0 }}
          >
            Continuar con el pedido →
          </Button>
        </>
      )}

      {/* PASO 2 — CHECKOUT */}
      {step === 'checkout' && (
        <>
          <div className="flex items-center gap-4 mb-8" style={{ animation: 'fadeInUp 0.4s ease forwards', opacity: 0 }}>
            <button
              onClick={() => setStep('cart')}
              className="text-sm text-muted-foreground hover:text-black transition-colors"
            >
              ← Volver al carrito
            </button>
            <h1 className="text-4xl font-bold">Datos del pedido</h1>
          </div>

          <div className="flex flex-col gap-6">

            {/* Datos personales */}
            <Card style={{ animation: 'fadeInUp 0.4s ease 0.05s forwards', opacity: 0 }}>
              <CardHeader>
                <CardTitle className="text-base uppercase tracking-widest">Tus datos</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input
                    id="name"
                    placeholder="Ej: María González"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tipo de entrega */}
            <Card style={{ animation: 'fadeInUp 0.4s ease 0.1s forwards', opacity: 0 }}>
              <CardHeader>
                <CardTitle className="text-base uppercase tracking-widest">Forma de entrega</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">

                {/* Selector retiro / despacho */}
                <div className="grid grid-cols-2 gap-3">
                  {(['retiro', 'despacho'] as DeliveryType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDeliveryType(type)}
                      className={`py-4 px-4 border-2 text-sm font-bold uppercase tracking-widest transition-all duration-200 ${
                        deliveryType === type
                          ? 'border-black bg-black text-white'
                          : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'
                      }`}
                    >
                      {type === 'retiro' ? '🏪 Retiro en tienda' : '🚚 Despacho Starken'}
                    </button>
                  ))}
                </div>

                {/* Retiro en sucursal */}
                {deliveryType === 'retiro' && (
                  <div className="flex flex-col gap-3 pt-2">
                    <Label className="text-sm font-medium">Selecciona la sucursal</Label>
                    {SUCURSALES.map((s) => (
                      <label
                        key={s.value}
                        className={`flex items-center gap-3 p-4 border-2 cursor-pointer transition-all ${
                          deliverySucursal === s.value
                            ? 'border-black bg-zinc-50'
                            : 'border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="sucursal"
                          value={s.value}
                          checked={deliverySucursal === s.value}
                          onChange={() => setDeliverySucursal(s.value)}
                          className="accent-black"
                        />
                        <div>
                          <p className="font-bold text-sm">{s.label}</p>
                          <p className="text-xs text-muted-foreground">Linares, Chile</p>
                        </div>
                      </label>
                    ))}
                    <p className="text-xs text-muted-foreground pt-1">
                      Te avisaremos por teléfono cuando tu pedido esté listo para retirar.
                    </p>
                  </div>
                )}

                {/* Despacho Starken */}
                {deliveryType === 'despacho' && (
                  <div className="flex flex-col gap-4 pt-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="address">Dirección *</Label>
                      <Input
                        id="address"
                        placeholder="Ej: Av. Principal 123, Depto 4B"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="city">Ciudad *</Label>
                      <Input
                        id="city"
                        placeholder="Ej: Santiago"
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      El costo de envío Starken se coordinará directamente con la tienda.
                    </p>
                  </div>
                )}

                {/* Notas adicionales */}
                <div className="flex flex-col gap-1.5 pt-2 border-t">
                  <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                  <Input
                    id="notes"
                    placeholder="Ej: Timbre no funciona, llamar al llegar"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resumen final */}
            {result && (
              <Card style={{ animation: 'fadeInUp 0.4s ease 0.15s forwards', opacity: 0 }}>
                <CardHeader>
                  <CardTitle className="text-base uppercase tracking-widest">Resumen del pedido</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {cart.map((item) => (
                    <div key={item.cartKey} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} {item.size ? `(${item.size})` : ''} x{item.quantity}
                      </span>
                      <span>${(item.price * item.quantity).toLocaleString('es-CL')}</span>
                    </div>
                  ))}
                  {result.appliedDiscounts.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm text-green-600">
                      <span>{d.name}</span>
                      <span>-${d.amount.toLocaleString('es-CL')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>${result.total.toLocaleString('es-CL')}</span>
                  </div>
                  {deliveryType === 'despacho' && (
                    <p className="text-xs text-muted-foreground pt-1">
                      * Costo de despacho Starken no incluido — se coordinará con la tienda.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={confirmOrder}
              disabled={loading}
              style={{ animation: 'fadeInUp 0.4s ease 0.2s forwards', opacity: 0 }}
            >
              {loading ? 'Procesando...' : 'Confirmar pedido'}
            </Button>

          </div>
        </>
      )}
    </div>
  )
}
