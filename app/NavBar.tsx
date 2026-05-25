'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Verificamos el cambio de ruta durante el renderizado para evitar el error de ESLint.
  // El menú se mantendrá abierto mientras Next.js carga la nueva página.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  return (
    <nav className="w-full bg-[#f7f4ee] border-b border-gray-200 uppercase font-['Inter'] relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* LOGO */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl md:text-2xl font-bold tracking-wider text-black block leading-tight">
              MULTI <br className="sm:hidden" /> ACCESORIOS
            </Link>
          </div>

          {/* MENÚ ESCRITORIO */}
          <div className="hidden md:flex space-x-8 text-sm font-medium tracking-wide text-gray-700">
            <Link href="/shop" className="hover:text-black transition-colors">Tienda</Link>
            <Link href="/shop/cart" className="hover:text-black transition-colors">Carrito</Link>
            <Link href="/admin" className="hover:text-black transition-colors">Admin</Link>
          </div>

          {/* BOTÓN HAMBURGUESA MÓVIL */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="text-black hover:text-gray-600 focus:outline-none p-2"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* MENÚ DESPLEGABLE MÓVIL */}
      <div
        className={`md:hidden bg-[#f7f4ee] border-t border-gray-200 px-4 transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen 
            ? 'max-h-60 opacity-100 pt-2 pb-4 shadow-lg' 
            : 'max-h-0 opacity-0 pt-0 pb-0 pointer-events-none'
        }`}
      >
        <Link 
          href="/shop" 
          className="block text-base font-medium text-gray-700 hover:text-black py-2 transition-colors"
        >
          Tienda
        </Link>
        <Link 
          href="/shop/cart" 
          className="block text-base font-medium text-gray-700 hover:text-black py-2 transition-colors"
        >
          Carrito
        </Link>
        <Link 
          href="/admin" 
          className="block text-base font-medium text-gray-700 hover:text-black py-2 transition-colors"
        >
          Admin
        </Link>
      </div>
    </nav>
  );
}