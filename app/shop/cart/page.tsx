'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Banknote,
  Check,
  ChevronRight,
  CreditCard,
  Landmark,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
  Zap,
} from 'lucide-react'
import { useCartStore } from '@/lib/store'
import SafeProductImage from '@/components/SafeProductImage'
import BrandLogo from '@/components/BrandLogo'

type DiscountResult = {
  subtotal: number
  discount: number
  total: number
  appliedDiscounts: { name: string; amount: number }[]
}

type DeliveryType = 'retiro' | 'despacho'
type PaymentMethod = 'transfer' | 'pay_on_pickup' | 'payment_link' | 'webpay'

const SUCURSALES = [
  { value: 'Chacabuco 479', label: 'Chacabuco 479 - Local principal' },
  { value: 'Chacabuco 456', label: 'Chacabuco 456 - Local secundario' },
]

const PAYMENT_METHODS: {
  value: PaymentMethod
  title: string
  detail: string
  icon: typeof Landmark
}[] = [
  {
    value: 'webpay',
    title: 'Webpay',
    detail: 'Paga online con tarjeta por Transbank.',
    icon: CreditCard,
  },
  {
    value: 'transfer',
    title: 'Transferencia',
    detail: 'Reserva el pedido y paga con comprobante.',
    icon: Landmark,
  },
  {
    value: 'pay_on_pickup',
    title: 'Pago al retirar',
    detail: 'Paga en tienda al retirar tu compra.',
    icon: Banknote,
  },
  {
    value: 'payment_link',
    title: 'Link de pago',
    detail: 'Te enviamos un link para pagar online.',
    icon: CreditCard,
  },
]

export default function CartPage() {
  const router = useRouter()
  const cart = useCartStore((state) => state.cart)
  const [result, setResult] = useState<DiscountResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingCart, setCheckingCart] = useState(false)
  const [step, setStep] = useState<'cart' | 'checkout'>('cart')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('retiro')
  const [deliverySucursal, setDeliverySucursal] = useState(SUCURSALES[0].value)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer')

  const clearCartState = () => useCartStore.setState({ cart: [] })
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0)
  const localSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const subtotal = result?.subtotal ?? localSubtotal
  const total = result?.total ?? localSubtotal
  const canContinue = cart.length > 0 && Boolean(result) && !checkingCart
  const phoneDigits = customerPhone.replace(/\D/g, '')
  const checkoutIssues = [
    !customerName.trim() ? 'Falta tu nombre' : null,
    phoneDigits.length < 9 ? 'Falta un teléfono válido' : null,
    deliveryType === 'despacho' && !deliveryAddress.trim() ? 'Falta la dirección' : null,
    deliveryType === 'despacho' && !deliveryCity.trim() ? 'Falta la ciudad' : null,
  ].filter((issue): issue is string => Boolean(issue))
  const checkoutReady = Boolean(result) && checkoutIssues.length === 0 && !loading
  const paymentActionLabel =
    paymentMethod === 'webpay' ? 'Pagar con Webpay' :
    paymentMethod === 'pay_on_pickup' ? 'Reservar pedido' :
    paymentMethod === 'payment_link' ? 'Solicitar link de pago' :
    'Confirmar pedido'
  const paymentNextStep =
    paymentMethod === 'webpay' ? 'Serás redirigido a Transbank.' :
    paymentMethod === 'pay_on_pickup' ? 'Pagas al retirar en tienda.' :
    paymentMethod === 'payment_link' ? 'Te enviaremos el link al teléfono indicado.' :
    'Te indicaremos los datos para transferir.'

  useEffect(() => {
    if (cart.length === 0) {
      return
    }
    let cancelled = false

    async function validateCart() {
      await Promise.resolve()
      if (cancelled) return
      setCheckingCart(true)

      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map((item) => ({
              productId: item.productId ?? item.id.split('-')[0],
              quantity: item.quantity,
              size: item.size ?? null,
            })),
          }),
        })

        if (!response.ok) {
          clearCartState()
          toast.error('Algunos productos ya no estan disponibles. El carrito fue vaciado.')
          return
        }

        const data = await response.json()
        if (!cancelled) {
          setResult(data)
        }
      } catch {
        if (!cancelled) {
          toast.error('No pudimos validar el carrito. Intenta nuevamente.')
          setResult(null)
        }
      } finally {
        if (!cancelled) setCheckingCart(false)
      }
    }

    validateCart()

    return () => {
      cancelled = true
    }
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
      return toast.error('Ingresa un teléfono válido'), false
    }
    if (deliveryType === 'despacho' && !deliveryAddress.trim()) return toast.error('Ingresa tu dirección'), false
    if (deliveryType === 'despacho' && !deliveryCity.trim()) return toast.error('Ingresa la ciudad'), false
    return true
  }

  function goToCheckout() {
    if (!canContinue) return
    setStep('checkout')
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  async function confirmOrder() {
    if (!result || !validateCheckout()) return
    setLoading(true)
    const payload = {
      total: result.total,
      status: 'pending',
      paymentMethod,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      deliveryType,
      deliverySucursal: deliveryType === 'retiro' ? deliverySucursal : null,
      deliveryAddress: deliveryType === 'despacho' ? deliveryAddress : null,
      deliveryCity: deliveryType === 'despacho' ? deliveryCity : null,
      deliveryNotes: deliveryNotes || null,
      items: cart.map((item) => ({
        productId: item.productId ?? item.id.split('-')[0],
        quantity: item.quantity,
        unitPrice: item.price,
        size: item.size ?? null,
      })),
    }

    let order

    try {
      const response = await fetch(
        paymentMethod === 'webpay'
          ? '/api/payments/webpay/create'
          : '/api/orders',
        {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        toast.error(errorBody?.error ?? 'Error al procesar la orden. Intenta nuevamente.')
        setLoading(false)
        return
      }

      order = await response.json()
    } catch {
      toast.error('No pudimos conectar con el servidor. Intenta nuevamente.')
      setLoading(false)
      return
    }

    if (paymentMethod === 'webpay') {
      if (!order.url || !order.token) {
        toast.error('Webpay no entregó los datos de redirección. Intenta nuevamente.')
        setLoading(false)
        return
      }

      const form = document.createElement('form')
      form.method = 'POST'
      form.action = order.url

      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = 'token_ws'
      input.value = order.token
      form.appendChild(input)
      document.body.appendChild(form)
      form.submit()
      return
    }

    clearCartState()
    setResult(null)
    router.push(`/shop/success?order=${order.id}`)
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
        .cart-mark { position: relative; width: 42px; height: 42px; border-radius: 6px; background: #fff; display: block; overflow: hidden; flex: 0 0 auto; }
        .cart-content { max-width: 1120px; margin: 0 auto; padding: 38px 24px 60px; }
        .cart-grid { display: grid; grid-template-columns: minmax(0,1fr) 340px; gap: 26px; align-items: start; }
        .cart-panel { border: 1px solid #e5e5e5; border-radius: 6px; background: #fff; }
        .cart-item { display: grid; grid-template-columns: 94px minmax(0,1fr) auto; gap: 16px; align-items: center; padding: 18px; border-bottom: 1px solid #eee; }
        .cart-item:last-child { border-bottom: 0; }
        .cart-image { position: relative; width: 94px; height: 94px; border-radius: 5px; overflow: hidden; background: #f7f7f7; border: 1px solid #eee; }
        .cart-summary { position: sticky; top: 18px; }
        .cart-trust-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 14px 0 20px; }
        .cart-trust-item { min-height: 48px; border: 1px solid #ececec; border-radius: 6px; display: flex; align-items: center; gap: 9px; padding: 9px 11px; color: #444; font-size: 11px; font-weight: 800; }
        .cart-trust-item svg { flex: 0 0 auto; }
        .cart-summary-cta { width: 100%; height: 48px; border-radius: 5px; background: #e30613; color: #fff; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; font-weight: 900; }
        .cart-summary-cta:disabled { background: #d4d4d8; cursor: not-allowed; }
        .cart-summary-note { margin-top: 8px; text-align: center; color: #71717a; font-size: 11px; font-weight: 600; }
        @media (max-width: 760px) {
          .cart-header { height: auto; min-height: 72px; padding: 12px 16px; gap: 12px; flex-wrap: wrap; }
          .cart-search { order: 3; width: 100%; }
          .cart-content { padding: 20px 12px 120px; }
          .cart-grid { grid-template-columns: 1fr; gap: 16px; }
          .cart-item { grid-template-columns: 76px minmax(0,1fr); padding: 12px; gap: 12px; }
          .cart-image { width: 76px; height: 76px; }
          .cart-item-actions { grid-column: 1 / -1; display: flex; justify-content: space-between; }
          .cart-summary { position: fixed; left: 0; right: 0; top: auto; bottom: 0; z-index: 30; border-radius: 10px 10px 0 0; border-left: 0; border-right: 0; border-bottom: 0; padding: 12px 14px 14px !important; box-shadow: 0 -12px 30px rgba(0,0,0,.10); }
          .cart-summary h2, .cart-summary .cart-summary-lines, .cart-summary .cart-summary-trust { display: none; }
          .cart-summary-total { border-top: 0 !important; padding-top: 0 !important; margin-bottom: 10px !important; }
          .cart-trust-row { grid-template-columns: 1fr; margin: 10px 0 14px; }
          .cart-trust-item { min-height: 42px; }
        }
      `}</style>

      <div className="cart-shell">
        <header className="cart-header">
          <Link href="/shop" className="flex items-center gap-3 shrink-0">
            <BrandLogo className="cart-mark" priority sizes="42px" />
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
              <h1 className="text-2xl font-extrabold">Tu carrito está vacío</h1>
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
                  <p className="text-xs text-zinc-500 mt-1">{itemCount} producto{itemCount === 1 ? '' : 's'} en tu pedido</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
                  <span className={`w-6 h-6 rounded-full grid place-items-center ${step === 'cart' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {step === 'cart' ? '1' : <Check className="size-3" />}
                  </span>
                  Carrito
                  <ChevronRight className="size-3 text-zinc-400" />
                  <span className={`w-6 h-6 rounded-full grid place-items-center ${step === 'checkout' ? 'bg-red-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>2</span>
                  Entrega y pago
                </div>
              </div>

              <div className="cart-trust-row">
                <div className="cart-trust-item"><ShieldCheck className="size-4 text-green-600" /> Pago y datos protegidos</div>
                <div className="cart-trust-item"><Truck className="size-4 text-red-600" /> Retiro en Linares o despacho</div>
                <div className="cart-trust-item"><PackageCheck className="size-4 text-zinc-600" /> Stock validado antes de pagar</div>
              </div>

              <div className="cart-grid">
                <div>
                  {step === 'cart' ? (
                    <section className="cart-panel">
                      {cart.map((item) => (
                        <article key={item.id} className="cart-item">
                          <div className="cart-image">
                            <SafeProductImage
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="76px"
                              imageClassName="object-contain"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold leading-snug">{item.name}</p>
                            {item.size && <p className="text-xs text-zinc-500 mt-1">Variante: {item.size}</p>}
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
                          <input className={fieldClass} placeholder="Nombre completo *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} autoComplete="name" />
                          <input className={fieldClass} type="tel" inputMode="tel" placeholder="Teléfono *" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} autoComplete="tel" />
                          <input className={`${fieldClass} sm:col-span-2`} type="email" inputMode="email" placeholder="Email (opcional)" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} autoComplete="email" />
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
                            <input className={fieldClass} placeholder="Dirección *" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} autoComplete="street-address" />
                            <input className={fieldClass} placeholder="Ciudad *" value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)} autoComplete="address-level2" />
                          </div>
                        )}
                        <input className={`${fieldClass} mt-3`} placeholder="Notas adicionales (opcional)" value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} />
                      </section>

                      <section className="cart-panel p-5">
                        <h2 className="text-sm font-bold mb-4">Método de pago</h2>
                        <div className="grid gap-3">
                          {PAYMENT_METHODS.map((method) => {
                            const Icon = method.icon

                            return (
                              <button
                                key={method.value}
                                type="button"
                                onClick={() => setPaymentMethod(method.value)}
                                className={`rounded-[4px] border px-3 py-3 text-left flex items-start gap-3 ${paymentMethod === method.value ? 'border-red-600 bg-red-50 text-red-700' : 'border-zinc-300 hover:border-zinc-400'}`}
                              >
                                <Icon className="size-5 mt-0.5 shrink-0" />
                                <span>
                                  <span className="block text-sm font-bold">{method.title}</span>
                                  <span className="block text-xs text-zinc-500 mt-1">{method.detail}</span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                        {paymentMethod === 'transfer' && (
                          <div className="mt-4 rounded-[4px] border border-green-200 bg-green-50 px-3 py-3 text-xs text-green-900">
                            <p className="font-bold">Datos de transferencia</p>
                            <p className="mt-1">Multi Accesorios SpA - Banco por definir</p>
                            <p>Envía el comprobante por WhatsApp indicando el número de pedido.</p>
                          </div>
                        )}
                        {paymentMethod === 'payment_link' && (
                          <div className="mt-4 rounded-[4px] border border-blue-200 bg-blue-50 px-3 py-3 text-xs text-blue-900">
                            <p className="font-bold">Link de pago manual</p>
                            <p className="mt-1">El pedido queda pendiente y el equipo envía el link al teléfono registrado.</p>
                          </div>
                        )}
                        {paymentMethod === 'webpay' && (
                          <div className="mt-4 rounded-[4px] border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-900">
                            <p className="font-bold">Pago seguro por Transbank</p>
                            <p className="mt-1">Te redirigiremos a Webpay para completar el pago. El stock local se descuenta solo si Webpay aprueba la transacción.</p>
                          </div>
                        )}
                        <div className="mt-4 rounded-[4px] border border-zinc-200 bg-zinc-50 px-3 py-3 text-xs text-zinc-700">
                          <p className="font-bold">Después de confirmar</p>
                          <p className="mt-1">{paymentNextStep} El pedido queda registrado para preparación.</p>
                        </div>
                      </section>
                    </div>
                  )}
                </div>

                <aside className="cart-panel cart-summary p-5">
                  <h2 className="text-sm font-bold pb-4 border-b border-zinc-200">Resumen del pedido</h2>
                  <div className="cart-summary-lines py-4 space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-zinc-500">Subtotal</span><span className="font-semibold">${subtotal.toLocaleString('es-CL')}</span></div>
                    {result?.appliedDiscounts.map((discount) => (
                      <div key={discount.name} className="flex justify-between text-sm text-green-600"><span>{discount.name}</span><span>-${discount.amount.toLocaleString('es-CL')}</span></div>
                    ))}
                    <div className="flex justify-between text-sm"><span className="text-zinc-500">Despacho</span><span className="font-semibold">{deliveryType === 'retiro' ? 'Gratis' : 'Por coordinar'}</span></div>
                    {step === 'checkout' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Pago</span>
                        <span className="font-semibold text-right">
                          {PAYMENT_METHODS.find((method) => method.value === paymentMethod)?.title}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="cart-summary-total flex justify-between items-center border-t border-zinc-200 pt-4 mb-5">
                    <span>
                      <span className="block font-bold">Total</span>
                      {checkingCart && <span className="block text-[11px] font-semibold text-zinc-500">Validando stock...</span>}
                    </span>
                    <span className="text-xl font-extrabold text-red-600">${total.toLocaleString('es-CL')}</span>
                  </div>
                  {step === 'cart' ? (
                    <button type="button" onClick={goToCheckout} disabled={!canContinue} className="cart-summary-cta">
                      <Zap className="size-4" />
                      {checkingCart ? 'Validando carrito...' : 'Ir a entrega y pago'}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button type="button" onClick={confirmOrder} disabled={!checkoutReady} className="cart-summary-cta">
                        {loading ? 'Procesando...' : checkoutIssues[0] ?? paymentActionLabel}
                      </button>
                      <button type="button" onClick={() => setStep('cart')} className="w-full h-10 text-xs font-semibold text-zinc-500 hover:text-red-600">Volver al carrito</button>
                    </div>
                  )}
                  <p className="cart-summary-note">{step === 'cart' ? 'Sin cobros hasta confirmar entrega y pago.' : checkoutIssues[0] ?? paymentNextStep}</p>
                  <div className="cart-summary-trust mt-5 pt-4 border-t border-zinc-100 space-y-3 text-[11px] text-zinc-500">
                    <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-green-600" /> Compra segura y datos protegidos</p>
                    <p className="flex items-center gap-2"><Truck className="size-4 text-zinc-500" /> Envíos a todo Chile</p>
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
