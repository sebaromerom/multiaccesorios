'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export default function ProductCarousel({
  images,
  name,
}: {
  images: string[] | null | undefined
  name: string
}) {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [direction, setDirection] = useState<'left' | 'right'>('right')

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const safeImages = images && images.length > 0 ? images : []

  const goTo = useCallback(
    (index: number, dir: 'left' | 'right') => {
      if (index === current) return
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setDirection(dir)
      setPrev(current)
      setCurrent(index)
      timeoutRef.current = setTimeout(() => setPrev(null), 400)
    },
    [current]
  )

  const goPrev = useCallback(() => {
    if (safeImages.length === 0) return
    goTo((current - 1 + safeImages.length) % safeImages.length, 'left')
  }, [current, safeImages.length, goTo])

  const goNext = useCallback(() => {
    if (safeImages.length === 0) return
    goTo((current + 1) % safeImages.length, 'right')
  }, [current, safeImages.length, goTo])

  useEffect(() => {
    if (safeImages.length <= 1) return
    const interval = setInterval(goNext, 3500)
    return () => clearInterval(interval)
  }, [goNext, safeImages.length])

  // SIN IMAGEN
  if (safeImages.length === 0) {
    return (
      <div className="aspect-square bg-zinc-100 rounded-lg flex items-center justify-center text-xs uppercase tracking-widest text-zinc-400">
        Sin imagen
      </div>
    )
  }

  // UNA IMAGEN
  if (safeImages.length === 1) {
    return (
      <div className="relative aspect-square bg-zinc-100 overflow-hidden rounded-lg">
        <img
          src={safeImages[0]}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
    )
  }

  return (
    <div className="relative aspect-square bg-zinc-100 overflow-hidden rounded-lg group">
      {safeImages.map((url, index) => {
        const isCurrent = index === current
        const isPrev    = index === prev

        let transform = 'translateX(100%)'
        if (isCurrent) {
          transform = 'translateX(0%)'
        } else if (isPrev) {
          transform = direction === 'right' ? 'translateX(-100%)' : 'translateX(100%)'
        } else {
          transform = direction === 'right' ? 'translateX(100%)' : 'translateX(-100%)'
        }

        return (
          <div
            key={`${url}-${index}`}
            className="absolute inset-0"
            style={{
              transform,
              transition: isCurrent || isPrev ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              zIndex: isCurrent ? 2 : isPrev ? 1 : 0,
            }}
          >
            <img
              src={url}
              alt={`${name} ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        )
      })}

      {/* PREV */}
      <button
        onClick={goPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* NEXT */}
      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* DOTS */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {safeImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index, index > current ? 'right' : 'left')}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === current ? 'w-6 bg-black' : 'w-1.5 bg-black/30'
            }`}
          />
        ))}
      </div>
    </div>
  )
}