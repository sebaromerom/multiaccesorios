import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import NavBar from './NavBar'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'CARCASAS STORE',
  description: 'Carcasas, cargadores y accesorios',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>

      {/* EXPLICACIÓN DEL TRUCO:
        Agregamos una clase personalizada 'es-ruta-admin' en el body si se renderiza el admin.
        Y abajo usamos '[&:has(.es-ruta-admin)]' para ocultar la barra y quitar el fondo blanco de la tienda de forma automática.
      */}
      <body className="min-h-screen bg-background text-foreground [&:has(.es-ruta-admin)]:bg-zinc-950 [&:has(.es-ruta-admin)]:text-white">
        <Providers>
          
          {/* Ocultamos el NavBar de la tienda si detecta que adentro del DOM está el administrador */}
          <div className="[&:has(~_main_.es-ruta-admin)]:hidden">
            <NavBar />
          </div>

          {/* Si el hijo contiene la clase '.es-ruta-admin', 
            neutralizamos los paddings ('py-0 px-0') y forzamos el color de fondo oscuro
          */}
          <main className="w-full py-12 px-8 [&:has(.es-ruta-admin)]:py-0 [&:has(.es-ruta-admin)]:px-0">
            {children}
          </main>

          <Toaster />
        </Providers>
      </body>
    </html>
  )
}