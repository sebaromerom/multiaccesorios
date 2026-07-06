'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

type SafeProductImageProps = {
  src?: string | null
  alt: string
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  quality?: number
  loading?: 'eager' | 'lazy'
  className?: string
  imageClassName?: string
  fallbackClassName?: string
  style?: React.CSSProperties
  unoptimized?: boolean
}

function isUsableImageUrl(value?: string | null) {
  if (!value) return false

  const url = value.trim()

  if (!url) return false
  if (url.includes('placehold')) return false
  if (url === '/no-image-placeholder.jpg') return false

  return url.startsWith('/') || url.startsWith('https://')
}

function isExternalImage(src: string) {
  return src.startsWith('https://')
}

function ProductFallback({
  alt,
  fill,
  className = '',
}: {
  alt: string
  fill?: boolean
  className?: string
}) {
  return (
    <div
      className={`${fill ? 'absolute inset-0' : ''} ${className}`.trim()}
      role="img"
      aria-label={`${alt} sin imagen disponible`}
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: fill ? undefined : 96,
        background: '#fafafa',
      }}
    >
      <div
        style={{
          width: 'min(58%, 150px)',
          aspectRatio: '1 / 1',
          display: 'grid',
          placeItems: 'center',
          opacity: 0.78,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/multi.jpeg"
          alt=""
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'saturate(.95)',
          }}
        />
      </div>
    </div>
  )
}

export default function SafeProductImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  quality = 68,
  loading,
  className = '',
  imageClassName = '',
  fallbackClassName = '',
  style,
  unoptimized,
}: SafeProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  const safeSrc = useMemo(
    () => (isUsableImageUrl(src) ? src!.trim() : null),
    [src]
  )

  if (!safeSrc || failedSrc === safeSrc) {
    return (
      <ProductFallback
        alt={alt}
        fill={fill}
        className={`${className} ${fallbackClassName}`}
      />
    )
  }

  const shouldSkipOptimization =
    unoptimized ?? isExternalImage(safeSrc)

  return (
    <Image
      src={safeSrc}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      priority={priority}
      quality={quality}
      loading={priority ? undefined : loading}
      decoding="async"
      className={`${className} ${imageClassName}`.trim()}
      style={style}
      unoptimized={shouldSkipOptimization}
      onError={() => {
        console.warn('No se pudo cargar la imagen:', safeSrc)
        setFailedSrc(safeSrc)
      }}
    />
  )
}