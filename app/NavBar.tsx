'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function NavBar() {
  const { data: session } = useSession()

  return (
    <nav className="border-b border-border/50 px-8 py-5 flex items-center justify-between animate-fade-in">
      <Link 
        href="/" 
        className="text-xl md:text-2xl font-light tracking-[0.2em] hover:opacity-70 transition-opacity duration-300 uppercase"
      >
        Multi Accesorios
      </Link>
      
      <div className="flex items-center gap-8">
        {[
          { href: '/shop', label: 'Tienda' },
          { href: '/shop/cart', label: 'Carrito' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="relative text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-200 group"
          >
            {item.label}
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
          </Link>
        ))}
        
        {session ? (
          <>
            <Link href="/admin" className="relative text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-200 group">
              Admin
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="relative text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-200 group"
            >
              Salir
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
            </button>
          </>
        ) : (
          <Link href="/admin/login" className="relative text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-200 group">
            Admin
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground transition-all duration-300 group-hover:w-full" />
          </Link>
        )}
      </div>
    </nav>
  )
}