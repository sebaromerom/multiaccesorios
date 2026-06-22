'use client'

import { usePathname } from 'next/navigation'
import NavBar from './NavBar'

export default function PublicNavGate() {
  const pathname = usePathname()
  const hasDedicatedHeader =
    pathname === '/' ||
    pathname === '/shop' ||
    pathname === '/shop/cart' ||
    (pathname.startsWith('/shop/') && pathname !== '/shop/success') ||
    pathname.startsWith('/admin')

  if (hasDedicatedHeader) return null

  return <NavBar />
}
