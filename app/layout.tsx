import type { Metadata } from 'next'
import { Inter, Bebas_Neue } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import NavBar from './NavBar'
import { Toaster } from '@/components/ui/sonner'

// Inicializamos las fuentes oficiales de Next.js sin usar etiquetas <link>
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const bebasNeue = Bebas_Neue({ 
  weight: '400', 
  subsets: ['latin'], 
  variable: '--font-bebas' 
})

export const metadata: Metadata = {
  title: 'CARCASAS STORE',
  description: 'Carcasas, cargadores y accessories',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${bebasNeue.variable}`}>
      {/* MAGIA CSS: Si el body detecta que adentro está la clase '.es-ruta-admin',
        le quita los paddings al <main>, borra la caja blanca y vuelve el fondo negro total.
      */}
      <body className="min-h-screen bg-background text-foreground [&:has(.es-ruta-admin)]:bg-zinc-950 [&:has(.es-ruta-admin)]:text-white antialiased m-0 p-0">
        <Providers>
          
          {/* Desaparece el NavBar público si el árbol de hijos contiene el Admin */}
          <div className="[&:-webkit-any(:has(.es-ruta-admin))]:hidden [&:has(.es-ruta-admin)]:hidden">
            <NavBar />
          </div>

          {/* Si se renderiza el Admin, neutraliza el py-12 y px-8 de la tienda pública */}
          <main className="w-full py-12 px-8 [&:has(.es-ruta-admin)]:py-0 [&:has(.es-ruta-admin)]:px-0">
            {children}
          </main>

          <Toaster />
        </Providers>
      </body>
    </html>
  )
}