import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div
      className="text-center py-20"
      style={{ animation: 'fadeInUp 0.6s ease forwards', opacity: 0 }}
    >
      <p
        className="text-xs tracking-widest uppercase text-muted-foreground mb-4"
        style={{ animation: 'fadeInUp 0.5s ease 0.1s forwards', opacity: 0 }}
      >
        Orden confirmada
      </p>
      <h1
        className="text-6xl mb-4"
        style={{ animation: 'fadeInUp 0.5s ease 0.2s forwards', opacity: 0 }}
      >
        Gracias por tu compra
      </h1>
      <p
        className="text-muted-foreground mb-12"
        style={{ animation: 'fadeInUp 0.5s ease 0.3s forwards', opacity: 0 }}
      >
        Tu orden fue registrada exitosamente.
      </p>
      <div
        className="flex gap-4 justify-center"
        style={{ animation: 'fadeInUp 0.5s ease 0.4s forwards', opacity: 0 }}
      >
        <Link href="/shop">
          <Button variant="outline">Seguir comprando</Button>
        </Link>
        <Link href="/admin/orders">
          <Button>Ver órdenes</Button>
        </Link>
      </div>
    </div>
  )
}