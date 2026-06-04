'use client'
import Image from 'next/image'
import { useState } from 'react'

interface ProductImageProps {
  productId: string
  productName: string
  initialImageUrl?: string | null
}

export default function ProductImage({ productId, productName, initialImageUrl }: ProductImageProps) {
  const [hasError, setHasError] = useState(false)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://TU_PROYECTO_SUPABASE.supabase.co'
  const deterministicUrl = `${supabaseUrl}/storage/v1/object/public/products/${productId}/1.jpg`

  const primaryUrl = initialImageUrl || deterministicUrl
  const fallbackUrl = '/no-image-placeholder.jpg'

  return (
    <Image
      src={hasError ? fallbackUrl : primaryUrl}
      alt={productName}
      fill
      sizes="(max-width: 760px) 45vw, (max-width: 1180px) 30vw, (max-width: 1400px) 24vw, 260px"
      quality={72}
      onError={() => setHasError(true)}
      loading="lazy"
      decoding="async"
      style={{
        objectFit: 'cover',
        display: 'block',
        backgroundColor: '#fcfcfc',
      }}
    />
  )
}
