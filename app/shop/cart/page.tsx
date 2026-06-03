'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
} from 'lucide-react'
import { useCartStore } from '@/lib/store'

type DiscountResult = {
  subtotal: number
  discount: number
  total: number
  appliedDiscounts: { name: string; amount: number }[]
}

type DeliveryType = 'retiro' | 'despacho'

const SUCURSALES = [
  { value: 'Chacabuco 479', label: 'Chacabuco 479 - Local principal' },
  { value: 'Chacabuco 456', label: 'Chacabuco 456 - Local secundario' },
]

export default function CartPage() {
  const router = useRouter()
  const cart = useCartStore((state) => state.cart)
  const [result, setResult] = useState<DiscountResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'cart' | 'checkout'>('cart')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('retiro')
  const [deliverySucursal, setDeliverySucursal] = useState(SUCURSALES[0].value)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  const clearCartState = () => useCartStore.setState({ cart: [] })

  useEffect(() => {
    if (cart.length === 0) return
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map((item) => ({ productId: item.id.split('-')[0], quantity: item.quantity })),
      }),
    })
      .then((response) => {
        if (!response.ok) {
          clearCartState()
          toast.error('Algunos productos ya no estan disponibles. El carrito fue vaciado.')
          return null
        }
        return response.json()
      })
      .then((data) => data && setResult(data))
  }, [cart])

  function updateQuantity(id: string, delta: number) {
    const updatedCart = cart
      .map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0)
    useCartStore.setState({ cart: updatedCart })
    if (updatedCart.length === 0) setResult(null)
  }

  function removeItem(id: string) {
    const updatedCart = cart.filter((item) => item.id !== id)
    useCartStore.setState({ cart: updatedCart })
    if (updatedCart.length === 0) setResult(null)
  }

  function validateCheckout() {
    if (!customerName.trim()) return toast.error('Ingresa tu nombre completo'), false
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 9) {
      return toast.error('Ingresa un telefono valido'), false
    }
    if (deliveryType === 'despacho' && !deliveryAddress.trim()) return toast.error('Ingresa tu direccion'), false
    if (deliveryType === 'despacho' && !deliveryCity.trim()) return toast.error('Ingresa la ciudad'), false
    return true
  }

  async function confirmOrder() {
    if (!result || !validateCheckout()) return
    setLoading(true)
    const response = await fetch('/api/orders', {
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
        deliveryAddress: deliveryType === 'despacho' ? deliveryAddress : null,
        deliveryCity: deliveryType === 'despacho' ? deliveryCity : null,
        deliveryNotes: deliveryNotes || null,
        items: cart.map((item) => ({
          productId: item.id.split('-')[0],
          quantity: item.quantity,
          unitPrice: item.price,
          size: item.id.includes('-') ? item.id.split('-')[1] : null,
        })),
      }),
    })
    if (!response.ok) {
      toast.error('Error al procesar la orden. Intenta nuevamente.')
      setLoading(false)
      return
    }
    clearCartState()
    setResult(null)
    router.push('/shop/success')
  }

  const fieldClass = 'h-11 w-full rounded-[4px] border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-red-600'

  return (
    <div className="cart-root">
      <style>{`
        body:has(.cart-root) .public-navbar { display: none; }
        body:has(.cart-root) main { padding: 0 !important; background: #f6f6f5; }
        .cart-root { min-height: 100vh; background: #f6f6f5; color: #171717; font-family: var(--font-inter), Inter, sans-serif; letter-spacing: 0; }
        .cart-shell { max-width: 1510px; min-height: 100vh; margin: 0 auto; background: #fff; box-shadow: 0 18px 60px rgba(15,15,15,.08); }
        .cart-header { height: 82px; display: flex; align-items: center; gap: 42px; padding: 0 52px; border-bottom: 1px solid #e5e5e5; }
        .cart-mark { width: 42px; height: 42px; border-radius: 6px; background: #e30613; color: white; display: grid; place-items: center; font-size: 27px; font-weight: 900; font-style: italic; }
        .cart-content { max-width: 1120px; margin: 0 auto; padding: 38px 24px 60px; }
        .cart-grid { display: grid; grid-template-columns: minmax(0,1fr) 340px; gap: 26px; align-items: start; }
        .cart-panel { border: 1px solid #e5e5e5; border-radius: 6px; background: #fff; }
        .cart-item { display: grid; grid-template-columns: 94px minmax(0,1fr) auto; gap: 16px; align-items: center; padding: 18px; border-bottom: 1px solid #eee; }
        .cart-item:last-child { border-bottom: 0; }
        .cart-image { width: 94px; height: 94px; border-radius: 5px; object-fit: contain; background: #f7f7f7; border: 1px solid #eee; }
        .cart-summary { position: sticky; top: 18px; }
        @media (max-width: 760px) {
          .cart-header { height: auto; min-height: 72px; padding: 12px 16px; gap: 12px; flex-wrap: wrap; }
          .cart-search { order: 3; width: 100%; }
          .cart-content { padding: 24px 12px 40px; }
          .cart-grid { grid-template-columns: 1fr; gap: 16px; }
          .cart-item { grid-template-columns: 76px minmax(0,1fr); padding: 12px; gap: 12px; }
          .cart-image { width: 76px; height: 76px; }
          .cart-item-actions { grid-column: 1 / -1; display: flex; justify-content: space-between; }
          .cart-summary { position: static; }
        }
      `}</style>

      <div className="cart-shell">
        <header className="cart-header">
          <Link href="/shop" className="flex items-center gap-3 shrink-0">
            <span className="cart-mark">m</span>
            <span className="text-sm font-extrabold leading-tight">MULTI<br />ACCESORIOS</span>
          </Link>
          <Link href="/shop" className="cart-search h-11 flex-1 max-w-2xl rounded-[5px] border border-zinc-300 flex items-center px-4 text-sm text-zinc-400 hover:border-red-300">
            <Search className="size-4 mr-3" />
            Buscar productos, marcas y mas...
          </Link>
          <div className="ml-auto flex items-center gap-2 text-sm font-bold">
            <ShoppingCart className="size-5" />
            Carrito
          </div>
        </header>

        <div className="cart-content">
          <Link href="/shop" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-red-600 mb-6">
            <ArrowLeft className="size-4" />
            Seguir comprando
          </Link>

          {cart.length === 0 ? (
            <div className="cart-panel text-center py-20 px-5">
              <ShoppingCart className="size-10 text-zinc-300 mx-auto mb-4" />
              <h1 className="text-2xl font-extrabold">Tu carrito esta vacio</h1>
              <p className="text-sm text-zinc-500 mt-2 mb-6">Agrega productos para comenzar tu pedido.</p>
              <Link href="/shop" className="inline-flex h-11 px-6 rounded-[4px] bg-red-600 hover:bg-red-700 text-white text-sm font-bold items-center">
                Ver productos
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold">{step === 'cart' ? 'Tu carrito' : 'Datos del pedido'}</h1>
                  <p className="text-xs text-zinc-500 mt-1">{cart.length} producto{cart.length === 1 ? '' : 's'} en tu pedido</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
                  <span className={`w-6 h-6 rounded-full grid place-items-center ${step === 'cart' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {step === 'cart' ? '1' : <Check className="size-3" />}
                  </span>
                  Carrito
                  <ChevronRight className="size-3 text-zinc-400" />
                  <span className={`w-6 h-6 rounded-full grid place-items-center ${step === 'checkout' ? 'bg-red-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>2</span>
                  Entrega
                </div>
              </div>

              <div className="cart-grid">
                <div>
                  {step === 'cart' ? (
                    <section className="cart-panel">
                      {cart.map((item) => (
                        <article key={item.id} className="cart-item">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt={item.name} className="cart-image" />
                          ) : (
                            <div className="cart-image grid place-items-center text-zinc-300"><PackageCheck className="size-7" /></div>
                          )}
                          <div>
                            <p className="text-sm font-bold leading-snug">{item.name}</p>
                            {item.size && <p className="text-xs text-zinc-500 mt-1">Talla: {item.size}</p>}
                            <p className="text-base font-extrabold text-red-600 mt-2">${item.price.toLocaleString('es-CL')}</p>
                          </div>
                          <div className="cart-item-actions flex flex-col items-end gap-3">
                            <button type="button" onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-red-600" aria-label="Eliminar producto">
                              <Trash2 className="size-4" />
                            </button>
                            <div className="h-9 rounded-[4px] border border-zinc-300 flex items-center">
                              <button type="button" onClick={() => updateQuantity(item.id, -1)} className="w-9 h-full grid place-items-center hover:text-red-600" aria-label="Disminuir cantidad"><Minus className="size-3" /></button>
                              <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                              <button type="button" onClick={() => updateQuantity(item.id, 1)} className="w-9 h-full grid place-items-center hover:text-red-600" aria-label="Aumentar cantidad"><Plus className="size-3" /></button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </section>
                  ) : (
                    <div className="space-y-4">
                      <section className="cart-panel p-5">
                        <h2 className="text-sm font-bold mb-4">Tus datos</h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <input className={fieldClass} placeholder="Nombre completo *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                          <input className={fieldClass} type="tel" placeholder="Telefono *" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                          <input className={`${fieldClass} sm:col-span-2`} type="email" placeholder="Email (opcional)" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                        </div>
                      </section>

                      <section className="cart-panel p-5">
                        <h2 className="text-sm font-bold mb-4">Forma de entrega</h2>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {(['retiro', 'despacho'] as DeliveryType[]).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setDeliveryType(type)}
                              className={`min-h-16 rounded-[4px] border text-xs font-bold flex items-center justify-center gap-2 ${deliveryType === type ? 'border-red-600 bg-red-50 text-red-700' : 'border-zinc-300'}`}
                            >
                              {type === 'retiro' ? <Store className="size-4" /> : <Truck className="size-4" />}
                              {type === 'retiro' ? 'Retiro en tienda' : 'Despacho Starken'}
                            </button>
                          ))}
                        </div>
                        {deliveryType === 'retiro' ? (
                          <div className="space-y-2">
                            {SUCURSALES.map((sucursal) => (
                              <label key={sucursal.value} className="flex items-center gap-3 rounded-[4px] border border-zinc-200 px-3 py-3 text-sm cursor-pointer">
                                <input type="radio" name="sucursal" checked={deliverySucursal === sucursal.value} onChange={() => setDeliverySucursal(sucursal.value)} className="accent-red-600" />
                                {sucursal.label}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="grid sm:grid-cols-2 gap-3">
                            <input className={fieldClass} placeholder="Direccion *" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                            <input className={fieldClass} placeholder="Ciudad *" value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)} />
                          </div>
                        )}
                        <input className={`${fieldClass} mt-3`} placeholder="Notas adicionales (opcional)" value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} />
                      </section>
                    </div>
                  )}
                </div>

                <aside className="cart-panel cart-summary p-5">
                  <h2 className="text-sm font-bold pb-4 border-b border-zinc-200">Resumen del pedido</h2>
                  <div className="py-4 space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-zinc-500">Subtotal</span><span className="font-semibold">${(result?.subtotal ?? 0).toLocaleString('es-CL')}</span></div>
                    {result?.appliedDiscounts.map((discount) => (
                      <div key={discount.name} className="flex justify-between text-sm text-green-600"><span>{discount.name}</span><span>-${discount.amount.toLocaleString('es-CL')}</span></div>
                    ))}
                    <div className="flex justify-between text-sm"><span className="text-zinc-500">Despacho</span><span className="font-semibold">{deliveryType === 'retiro' ? 'Gratis' : 'Por coordinar'}</span></div>
                  </div>
                  <div className="flex justify-between items-center border-t border-zinc-200 pt-4 mb-5">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-extrabold text-red-600">${(result?.total ?? 0).toLocaleString('es-CL')}</span>
                  </div>
                  {step === 'cart' ? (
                    <button type="button" onClick={() => setStep('checkout')} className="w-full h-11 rounded-[4px] bg-red-600 hover:bg-red-700 text-white text-sm font-bold">
                      Continuar con el pedido
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button type="button" onClick={confirmOrder} disabled={loading} className="w-full h-11 rounded-[4px] bg-red-600 hover:bg-red-700 disabled:bg-zinc-300 text-white text-sm font-bold">
                        {loading ? 'Procesando...' : 'Confirmar pedido'}
                      </button>
                      <button type="button" onClick={() => setStep('cart')} className="w-full h-10 text-xs font-semibold text-zinc-500 hover:text-red-600">Volver al carrito</button>
                    </div>
                  )}
                  <div className="mt-5 pt-4 border-t border-zinc-100 space-y-3 text-[11px] text-zinc-500">
                    <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-green-600" /> Compra segura y datos protegidos</p>
                    <p className="flex items-center gap-2"><Truck className="size-4 text-zinc-500" /> Envios a todo Chile</p>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
