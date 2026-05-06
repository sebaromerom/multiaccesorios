import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-5xl mb-8">Panel de Administracion</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { href: '/admin/products', title: 'Productos', desc: 'Gestionar productos y stock' },
          { href: '/admin/discounts', title: 'Descuentos', desc: 'Crear y gestionar descuentos' },
          { href: '/admin/orders', title: 'Ordenes', desc: 'Ver y gestionar ordenes' },
        ].map((item, index) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:bg-secondary transition-colors duration-300 cursor-pointer" style={{ animation: 'fadeInUp 0.5s ease forwards', animationDelay: `${0.1 + index * 0.1}s`, opacity: 0 }}>
              <CardHeader><CardTitle>{item.title}</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground text-sm">{item.desc}</p></CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}