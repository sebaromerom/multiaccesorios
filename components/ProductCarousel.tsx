'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Image = {
  id: string
  url: string
  order: number
}

export default function ProductCarousel({ images, name }: { images: Image[], name: string }) {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [direction, setDirection] = useState<'left' | 'right'>('right')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goTo = useCallback((index: number, dir: 'left' | 'right') => {
    if (index === current) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setDirection(dir)
    setPrev(current)
    setCurrent(index)
    timeoutRef.current = setTimeout(() => setPrev(null), 400)
  }, [current])

  const goPrev = useCallback(() => {
    goTo((current - 1 + images.length) % images.length, 'left')
  }, [current, images.length, goTo])

  const goNext = useCallback(() => {
    goTo((current + 1) % images.length, 'right')
  }, [current, images.length, goTo])

  useEffect(() => {
    if (images.length <= 1) return
    const interval = setInterval(goNext, 3500)
    return () => clearInterval(interval)
  }, [goNext, images.length])

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-secondary flex items-center justify-center text-muted-foreground text-xs tracking-widest uppercase">
        Sin imagen
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className="aspect-square bg-secondary overflow-hidden">
        <img src={images[0].url} alt={name} className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div className="relative aspect-square bg-secondary overflow-hidden group">
      {images.map((img, index) => {
        const isCurrent = index === current
        const isPrev = index === prev

        let transform = 'translateX(100%)'
        if (isCurrent) transform = 'translateX(0%)'
        else if (isPrev) transform = direction === 'right' ? 'translateX(-100%)' : 'translateX(100%)'
        else if (!isPrev) transform = direction === 'right' ? 'translateX(100%)' : 'translateX(-100%)'

        return (
          <div
            key={img.id}
            className="absolute inset-0"
            style={{
              transform,
              transition: isCurrent || isPrev ? 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              zIndex: isCurrent ? 2 : isPrev ? 1 : 0,
            }}
          >
            <img
              src={img.url}
              alt={`${name} ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        )
      })}

      <button
        onClick={goPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <button
        onClick={goNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index, index > current ? 'right' : 'left')}
            className="transition-all duration-300"
            style={{
              width: index === current ? '20px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: index === current ? 'var(--foreground)' : 'var(--muted-foreground)',
              opacity: index === current ? 1 : 0.5,
            }}
          />
        ))}
      </div>
    </div>
  )
}