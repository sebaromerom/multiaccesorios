'use client'
import { useState } from 'react'

interface ProductImageProps {
  productId: string
  productName: string
  initialImageUrl?: string | null
}

export default function ProductImage({ productId, productName, initialImageUrl }: ProductImageProps) {
  const [hasError, setHasError] = useState(false)

  // 1. Construimos la URL determinista basada en el ID (Estrategia de carpetas)
  // Reemplaza esto con la URL real de tu proyecto Supabase si no usas variable de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://TU_PROYECTO_SUPABASE.supabase.co'
  const deterministicUrl = `${supabaseUrl}/storage/v1/object/public/products/${productId}/1.jpg`

  // 2. Fallback: Si da 404, usamos la URL de la BD o una imagen "Sin foto" por defecto
  const fallbackUrl = initialImageUrl || '/no-image-placeholder.jpg' 

  return (
    <img 
      src={hasError ? fallbackUrl : deterministicUrl} 
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