import Link from "next/link"
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { imageUrl: { not: null } },
    take: 3,
    orderBy: { createdAt: 'desc' },
  })

  const blocks = [
    { href: '/shop', num: '01', title: 'CATÁLOGO', desc: 'Explora nuestra colección de accesorios' },
    { href: '/shop/cart', num: '02', title: 'TU CARRITO', desc: 'Revisa tu selección actual' },
    { href: '/admin', num: '03', title: 'GESTIÓN', desc: 'Panel de gestión interno' },
  ]

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-6 py-12 font-sans relative overflow-hidden">
      
      {/* Header Section */}
      <div className="mb-20 text-center animate-fade-in-up relative z-10 mt-12">
        <p className="text-red-600 text-xs tracking-[0.3em] uppercase mb-4 font-bold">LINARES, CHILE</p>
        <h1 className="text-6xl md:text-8xl mb-6 text-foreground">
          MULTI <span className="text-red-600">ACCESORIOS</span>
        </h1>
        <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase mb-3">ELEVA TU EXPERIENCIA MÓVIL</p>
      </div>

      {/* Navegación con alto contraste y rojo puro */}
      <div className="flex flex-col w-full max-w-4xl animate-fade-in-up relative z-10">
        <div className="border-t border-red-900/30">
          {blocks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              // Fondo oscuro sutil al hacer hover para resaltar el texto
              className="group w-full flex items-center justify-between py-12 border-b border-red-900/30 transition-all duration-300 hover:bg-red-950/10"
            >
              <div className="flex items-center gap-10 transition-transform duration-300 group-hover:translate-x-3">
                {/* Número en rojo vibrante */}
                <span className="text-red-600 text-sm tracking-widest uppercase font-bold">
                  Nº {item.num}
                </span>
                <div>
                  {/* Título en blanco puro para máximo contraste */}
                  <h2 className="text-3xl md:text-4xl mb-1 text-white group-hover:text-red-500 transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-sm text-neutral-400 tracking-wider font-sans">
                    {item.desc}
                  </p>
                </div>
              </div>
              
              {/* Flecha roja de alto contraste */}
              <div className="flex items-center text-red-700 group-hover:text-red-500 transition-colors duration-300">
                <span className="text-4xl font-light">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-20 w-full max-w-4xl pt-12 flex justify-between items-center text-red-900 text-xs tracking-widest uppercase relative z-10 pb-12">
         <p>📍 Chacabuco #479 / #456 · Linares, Chile</p>
         <p>Envíos a todo Chile</p>
      </div>
    </div>
  )
}