import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import AuthButton from '@/components/AuthButton'

export const revalidate = 0

export default async function Home() {
  const session = await getServerSession(authOptions)

  const activeRules = await prisma.discountRule.findMany({
    where: {
      active: true,
      minQuantity: 1,
      productId: { not: null },
    },
    include: {
      product: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
  })

  const ofertasDestacadas = activeRules
    .map((rule) => {
      const prod = rule.product
      if (!prod) return null

      let precioConDescuento = prod.price
      let etiquetaBadge = ''

      if (rule.type === 'percentage') {
        precioConDescuento = prod.price * (1 - rule.value / 100)
        etiquetaBadge = `-${rule.value}%`
      } else if (rule.type === 'fixed') {
        precioConDescuento = Math.max(0, prod.price - rule.value)
        etiquetaBadge = 'OFERTA'
      } else if (rule.type === '2x1') {
        etiquetaBadge = '2X1'
      }

      return {
        id: prod.id,
        name: prod.name,
        precioOriginal: prod.price,
        precioOferta: precioConDescuento,
        badge: etiquetaBadge,
        tipo: rule.type,
      }
    })
    .filter(Boolean)

  return (
    <div className="w-full min-h-screen bg-[#FAF9F5] text-zinc-900 font-sans flex flex-col justify-between overflow-x-hidden antialiased relative">

      {/* BOTÓN ADMIN */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <AuthButton 
          isLoggedIn={!!session} 
          isAdmin={session?.user?.role === 'admin'} 
        />
      </div>

      {/* HERO SECTION */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-16 py-20 md:py-28 flex flex-col items-center justify-center text-center relative">
        <div className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 80px, #000 80px, #000 81px)`,
          }}
        />

        <div className="relative mb-14">
          <div className="absolute inset-0 bg-zinc-900 rounded-[2.5rem] translate-x-3 translate-y-3 opacity-90" />
          <div className="relative w-40 h-40 md:w-48 md:h-48 bg-red-600 rounded-[2.5rem] flex items-center justify-center border border-zinc-900">
            <span 
              className="text-white text-[7rem] md:text-[9rem] font-normal leading-none select-none pr-2 pt-2"
              style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}
            >
              m
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 mb-14">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-[0.25em] uppercase text-zinc-900">
              MULTI
            </h1>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-[0.25em] uppercase text-red-600">
              ACCESORIOS
            </h1>
          </div>
          
          <div className="flex items-center gap-4 text-zinc-400 mt-2">
            <span className="w-8 h-[1px] bg-zinc-300" />
            <p className="text-[9px] tracking-[0.4em] uppercase font-medium">
              Linares, Chile — Est. 2020
            </p>
            <span className="w-8 h-[1px] bg-zinc-300" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-10">
          <Link href="/shop">
            <button className="group flex items-center gap-6 bg-zinc-900 text-white px-10 py-5 text-[10px] tracking-[0.3em] uppercase font-semibold border border-zinc-900 hover:bg-red-600 hover:border-red-600 transition-all duration-300 shadow-[5px_5px_0px_0px_rgba(220,38,38,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 rounded-sm">
              Ver Catálogo
              <span className="group-hover:translate-x-1 transition-transform duration-300 text-sm">→</span>
            </button>
          </Link>
          
          <p className="max-w-sm text-zinc-400 text-[10px] leading-relaxed uppercase tracking-[0.15em] font-medium">
            Atención personalizada en el corazón de Linares. <br />
            Tecnología y estilo para tu smartphone.
          </p>
        </div>
      </main>

      {/* SECCIÓN DE OFERTAS */}
      {ofertasDestacadas.length > 0 && (
        <section className="max-w-7xl mx-auto w-full px-6 md:px-16 pb-24">
          <div className="border-t border-zinc-300 pt-12 mb-10 flex justify-between items-end">
            <div>
              <p className="text-red-600 text-[9px] tracking-[0.3em] uppercase font-bold mb-1.5">
                Promociones Activas
              </p>
              <h2 className="text-xl md:text-2xl font-semibold uppercase tracking-[0.15em] text-zinc-800">
                Liquidación del Maule
              </h2>
            </div>
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-400 hidden sm:block">
              Actualizado directo en tienda %
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {ofertasDestacadas.map((prod) => (
              <Link key={prod!.id} href={`/shop?id=${prod!.id}`}>
                <div className="group relative bg-white border-2 border-zinc-950 p-6 min-h-[250px] flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 hover:bg-[#FCFBF9] transition-all duration-200 cursor-pointer rounded-sm overflow-hidden">
                  
                  <div className="flex justify-between items-start w-full">
                    <span className="font-mono text-[9px] tracking-widest text-zinc-400 font-bold uppercase">
                      [ Disponible ]
                    </span>
                    <span className="bg-red-600 text-white font-bold text-[9px] px-2 py-0.5 uppercase tracking-widest rounded-sm border border-zinc-950 transform rotate-1 group-hover:rotate-0 transition-transform duration-150 shrink-0">
                      {prod!.badge}
                    </span>
                  </div>

                  <div className="my-6">
                    <h3 className="font-sans text-xs md:text-[13px] font-semibold uppercase tracking-wider text-zinc-800 group-hover:text-red-600 transition-colors duration-150 leading-snug line-clamp-3">
                      {prod!.name}
                    </h3>
                  </div>

                  <div className="border-t border-zinc-200 pt-4 flex items-center justify-between w-full">
                    <div className="flex flex-col justify-end">
                      {prod!.tipo === '2x1' ? (
                        <span className="text-xs font-bold tracking-widest text-red-600 uppercase">Lleva 2 paga 1</span>
                      ) : (
                        <>
                          <span className="text-[10px] text-zinc-400 line-through font-medium tracking-wide mb-0.5 leading-none">
                            ${prod!.precioOriginal.toLocaleString('es-CL')}
                          </span>
                          <span className="text-xl font-bold tracking-tight text-zinc-950 leading-none">
                            ${prod!.precioOferta.toLocaleString('es-CL')}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-800">
                        Ver
                      </span>
                      <span className="text-sm font-light text-zinc-800 group-hover:translate-x-1 transition-transform duration-150">
                        →
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-0 left-0 w-[3px] h-full bg-red-600 scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-top" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* BENTO CATEGORÍAS */}
      <section className="max-w-7xl mx-auto w-full px-6 md:px-16 pb-28">
        <div className="border-t border-zinc-300 pt-12 mb-10">
          <p className="text-[9px] tracking-[0.3em] uppercase text-zinc-400 font-bold mb-1.5">Acceso Directo</p>
          <h2 className="text-xl md:text-2xl font-semibold uppercase tracking-[0.15em] text-zinc-800">
            Categorías principales
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { cat: 'Carcasa',    emoji: '📱', label: 'Carcasas',    num: '01' },
            { cat: 'Lamina',     emoji: '🛡️', label: 'Láminas',     num: '02' },
            { cat: 'Audifonos',  emoji: '🎧', label: 'Audífonos',    num: '03' },
            { cat: 'Cargador',   emoji: '⚡', label: 'Cargadores',   num: '04' },
            { cat: 'Cable',      emoji: '🔌', label: 'Cables',       num: '05' },
            { cat: 'Vapers',     emoji: '💨', label: 'Vapers',       num: '06' },
            { cat: 'Computacion', emoji: '💻', label: 'Computación',  num: '07' },
            { cat: 'Otros',      emoji: '✨', label: 'Otros',        num: '08' },
          ].map((item) => (
            <Link key={item.cat} href={`/shop?cat=${item.cat}`}>
              <div className="group relative bg-white border border-black/40 p-6 flex flex-col justify-between aspect-[4/3] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden rounded-sm">
                
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] tracking-widest text-zinc-400">
                    {item.num}
                  </span>
                  <span className="text-lg grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110">
                    {item.emoji}
                  </span>
                </div>

                <div className="mt-auto flex items-baseline justify-between">
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 group-hover:text-red-600 transition-colors duration-150">
                    {item.label}
                  </h3>
                  <span className="font-light text-zinc-300 group-hover:text-zinc-800 group-hover:translate-x-0.5 transition-all duration-200 text-sm leading-none">
                    →
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FOOTER IMPECABLE Y CORREGIDO SIN ERRORES SINTÁCTICOS ── */}
      <footer className="w-full bg-zinc-950 text-[#FAF9F5] py-16 px-6 md:px-16 border-t border-zinc-900 mt-auto">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 items-start pb-12 border-b border-zinc-800/60">
            
            {/* Columna 1: Ciudad y Región */}
            <div className="space-y-2">
              <span className="font-mono text-[9px] tracking-[0.3em] text-red-500 uppercase font-bold block">
                📍 Puntos de Venta
              </span>
              <h3 className="text-2xl font-semibold uppercase tracking-[0.15em] text-white">
                Linares <span className="text-zinc-600">CHILE</span>
              </h3>
              <p className="text-zinc-400 text-[10px] uppercase tracking-[0.2em]">
                Región del Maule
              </p>
            </div>

            {/* Columna 2: Sucursal Plaza */}
            <div className="space-y-2.5 md:border-l md:border-zinc-800/80 md:pl-8">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-zinc-500">[ 01 ]</span>
                <span className="text-[9px] font-bold tracking-[0.25em] text-zinc-400 uppercase bg-zinc-900 px-2 py-0.5 rounded-sm border border-zinc-800">
                  Frente a la Plaza
                </span>
              </div>
              <div>
                <p className="text-zinc-300 font-mono text-[11px] uppercase tracking-wider">
                  Chacabuco 479
                </p>
              </div>
            </div>

            {/* Columna 3: Sucursal Peatonal */}
            <div className="space-y-2.5 md:border-l md:border-zinc-800/80 md:pl-8">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-zinc-500">[ 02 ]</span>
                <span className="text-[9px] font-bold tracking-[0.25em] text-emerald-500 uppercase bg-emerald-950/30 px-2 py-0.5 rounded-sm border border-emerald-900/40">
                  Paseo Peatonal
                </span>
              </div>
              <div>
                <p className="text-zinc-300 font-mono text-[11px] uppercase tracking-wider">
                  Chacabuco 456
                </p>
              </div>
            </div>

          </div>

          {/* Fila de Créditos Inferior */}
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-zinc-500 text-[9px] uppercase tracking-[0.25em] font-medium">
            <p>© {new Date().getFullYear()} Multi Accesorios. Todos los derechos reservados.</p>
            <p className="text-zinc-600 font-mono">Designed for Brutalism & Speed</p>
          </div>

        </div>
      </footer>

    </div>
  )
}