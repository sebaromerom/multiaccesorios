'use client'
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
    <img 
      src={hasError ? fallbackUrl : primaryUrl} 
      alt={productName}
      onError={() => setHasError(true)}
      loading="lazy"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
        backgroundColor: '#fcfcfc' // Fondo sutil mientras carga
      }}
    />
  )
}
