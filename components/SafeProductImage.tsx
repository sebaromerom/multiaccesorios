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

function isOwnStorageImage(src: string) {
  return src.includes('.supabase.co/storage/v1/object/public/products/')
}

function withRetryToken(src: string) {
  const separator = src.includes('?') ? '&' : '?'
  return `${src}${separator}retry=1`
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
        background: '#fff',
      }}
    >
      <div
        style={{
          width: 'min(42%, 96px)',
          aspectRatio: '1 / 1',
          display: 'grid',
          placeItems: 'center',
          opacity: 0.12,
          border: '1px solid #d4d4d8',
          borderRadius: 12,
        }}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
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
  const [failedImage, setFailedImage] = useState<{ base: string; src: string } | null>(null)
  const [retryImage, setRetryImage] = useState<{ base: string; src: string } | null>(null)

  const safeSrc = useMemo(
    () => (isUsableImageUrl(src) ? src!.trim() : null),
    [src]
  )
  const retrySrc = retryImage?.base === safeSrc ? retryImage.src : null
  const activeSrc = retrySrc ?? safeSrc
  const hasFailed = Boolean(
    safeSrc &&
      activeSrc &&
      failedImage?.base === safeSrc &&
      failedImage.src === activeSrc
  )

  if (!safeSrc || !activeSrc || hasFailed) {
    return (
      <ProductFallback
        alt={alt}
        fill={fill}
        className={`${className} ${fallbackClassName}`}
      />
    )
  }

  const shouldSkipOptimization =
    unoptimized ?? isExternalImage(activeSrc)

  return (
    <Image
      src={activeSrc}
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
        if (safeSrc && isOwnStorageImage(safeSrc) && !retrySrc) {
          setRetryImage({ base: safeSrc, src: withRetryToken(safeSrc) })
          return
        }

        console.warn('No se pudo cargar la imagen:', activeSrc)
        setFailedImage({ base: safeSrc, src: activeSrc })
      }}
    />
  )
}
