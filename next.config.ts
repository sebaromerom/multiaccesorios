import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 👇 AGREGA ESTO AQUÍ EN LA RAÍZ
  allowedDevOrigins: ['192.168.56.1', 'localhost:3000'],
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**.placehold.co',
      },
      {
        protocol: 'https',
        hostname: '**.bsale.cl',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.mlstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
}

export default nextConfig
