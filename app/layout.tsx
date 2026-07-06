import type { Metadata } from 'next'
import { Inter, Bebas_Neue } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import PublicNavGate from './PublicNavGate'
import { Toaster } from '@/components/ui/sonner'
import { getCheckoutConfig } from '@/lib/checkout-config'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
})

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://multiaccesorios.cl'
const logoUrl = `${siteUrl}/multi.jpeg`
const phone = '+56927109764'
const instagramUrl = 'https://www.instagram.com/multiaccesorios_cl/'
const checkoutConfig = getCheckoutConfig()
const paymentAccepted = [
  ...(checkoutConfig.mercadoPagoEnabled ? ['Mercado Pago'] : []),
  ...(checkoutConfig.webpayEnabled ? ['Webpay'] : []),
  ...(checkoutConfig.transferEnabled ? ['Transferencia'] : []),
  ...(checkoutConfig.payOnPickupEnabled ? ['Pago al retirar'] : []),
]
const siteDescription =
  'Accesorios tech, audio, carga oficial, PC, vapers y novedades con retiro en Linares y despacho a todo Chile.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Multi Accesorios Linares | Accesorios tech y servicio técnico',
    template: '%s | Multi Accesorios',
  },
  description: siteDescription,
  applicationName: 'Multi Accesorios',
  authors: [{ name: 'Multiaccesorios Linares SpA' }],
  keywords: [
    'Multi Accesorios',
    'accesorios celulares Linares',
    'audio Linares',
    'carga oficial',
    'accesorios PC',
    'servicio técnico celulares Linares',
    'Chacabuco 479',
    'Chacabuco 456',
  ],
  openGraph: {
    title: 'Multi Accesorios Linares | Accesorios y servicio técnico',
    description: siteDescription,
    url: siteUrl,
    siteName: 'Multi Accesorios',
    locale: 'es_CL',
    type: 'website',
    images: [{ url: '/multi.jpeg', width: 1600, height: 1280, alt: 'Multi Accesorios' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Multi Accesorios Linares',
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

const localBusinessJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'MobilePhoneStore',
    '@id': `${siteUrl}/#sucursal-1`,
    name: 'Multi Accesorios Linares - Sucursal 1',
    url: siteUrl,
    image: logoUrl,
    telephone: phone,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Chacabuco 479',
      addressLocality: 'Linares',
      addressRegion: 'Maule',
      postalCode: '3581417',
      addressCountry: 'CL',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -35.846925,
      longitude: -71.596092,
    },
    hasMap: 'https://maps.app.goo.gl/jicd2cJFi37D6Qs96',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '19:00',
    },
    sameAs: [instagramUrl],
    paymentAccepted,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'MobilePhoneStore',
    '@id': `${siteUrl}/#servicio-tecnico`,
    name: 'Multi Accesorios Linares - Servicio Técnico',
    url: siteUrl,
    image: logoUrl,
    telephone: phone,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Chacabuco 456',
      addressLocality: 'Linares',
      addressRegion: 'Maule',
      postalCode: '3581412',
      addressCountry: 'CL',
    },
    hasMap: 'https://maps.app.goo.gl/uRC2hoVc8ssf1TTU7',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '19:00',
    },
    sameAs: [instagramUrl],
    paymentAccepted,
  },
]

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
            __html: JSON.stringify(localBusinessJsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <Providers>
          <div className="public-navbar">
            <PublicNavGate />
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
