"use client"

import { useState } from 'react'

interface ProductImageProps {
  productId: string
  productName: string
  initialImageUrl: string | null
}

export default function ProductImage({ productId, productName, initialImageUrl }: ProductImageProps) {
  // 1. URL fija de tu bucket público de Supabase
  const supabaseStorageUrl = `https://ylgcohlwbyunoncuruzb.supabase.co/storage/v1/object/public/products/${productId}/1.jpg`

  const isRealImage = initialImageUrl && 
                      initialImageUrl.trim() !== "" && 
                      !initialImageUrl.includes("placehold")

  // 2. Si hay una URL en la BD la usamos primero; si no, vamos directo al bucket
  const [src, setSrc] = useState<string>(
    isRealImage ? initialImageUrl! : supabaseStorageUrl
  )
  const [errorCount, setErrorCount] = useState<number>(0)

  const handleError = () => {
    if (errorCount === 0 && isRealImage) {
      // Si falló la URL guardada en la BD, intentamos directo con la estructura del bucket
      setErrorCount(1)
      setSrc(supabaseStorageUrl)
    } else {
      // Si ya falló el bucket, pasamos al estado "Sin imagen"
      setErrorCount(2)
    }
  }

  // Fallback elegante si no hay ninguna foto disponible
  if (errorCount === 2) {
    return (
      <div 
        className="img-fallback-placeholder" 
        style={{ 
          height: '100%', 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '11px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#ccc',
          fontWeight: 'bold',
          background: '#f9f9f9'
        }}
      >
        Sin imagen
      </div>
    )
  }

  return (
    <img 
      src={src} 
      alt={productName} 
      loading="lazy" 
      onError={handleError}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  )
}