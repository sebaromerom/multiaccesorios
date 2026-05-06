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
      <body className="min-h-screen bg-background">
        <Providers>
          <NavBar />
          <main className="max-w-4xl mx-auto py-12 px-8">
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}