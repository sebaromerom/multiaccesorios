import type { Metadata } from 'next'
import { Inter, Bebas_Neue } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import NavBar from './NavBar'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
})

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://multiaccesorios.vercel.app'
const siteDescription =
  'Accesorios tech, carcasas, láminas, cargadores, cables, audio y vapers con retiro en Linares y despacho a todo Chile.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Multi Accesorios | Accesorios tech en Linares',
    template: '%s | Multi Accesorios',
  },
  description: siteDescription,
  applicationName: 'Multi Accesorios',
  keywords: ['Multi Accesorios', 'accesorios tech', 'carcasas', 'láminas', 'cargadores', 'Linares'],
  openGraph: {
    title: 'Multi Accesorios',
    description: siteDescription,
    url: siteUrl,
    siteName: 'Multi Accesorios',
    locale: 'es_CL',
    type: 'website',
    images: [{ url: '/multi.jpeg', width: 1600, height: 1280, alt: 'Multi Accesorios' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Multi Accesorios',
    description: siteDescription,
    images: ['/multi.jpeg'],
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/multi.jpeg',
    apple: '/multi.jpeg',
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Multi Accesorios',
  url: siteUrl,
  image: `${siteUrl}/multi.jpeg`,
  areaServed: ['Linares', 'Chile'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Linares',
    addressCountry: 'CL',
  },
  paymentAccepted: ['Webpay', 'Transferencia', 'Pago al retirar'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${bebasNeue.variable}`}>
      <body className="min-h-screen bg-background text-foreground [&:has(.es-ruta-admin)]:bg-zinc-950 [&:has(.es-ruta-admin)]:text-white antialiased m-0 p-0">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <Providers>
          <div className="public-navbar [&:-webkit-any(:has(.es-ruta-admin))]:hidden [&:has(.es-ruta-admin)]:hidden">
            <NavBar />
          </div>

          <main className="w-full py-12 px-8 [&:has(.es-ruta-admin)]:py-0 [&:has(.es-ruta-admin)]:px-0">
            {children}
          </main>

          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
