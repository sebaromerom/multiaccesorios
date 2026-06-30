import { NextResponse } from 'next/server'

export async function proxy() {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/products/:path*',
    '/api/discounts/:path*',
    '/api/marketing-banners/:path*',
  ],
}
