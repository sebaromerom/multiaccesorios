"use client"

import { useState } from 'react'

interface ProductImageProps {
  productId: string
  productName: string
  initialImageUrl: string | null
}

export default function ProductImage({ productId, productName, initialImageUrl }: ProductImageProps) {
  const isRealImage = initialImageUrl && 
                      initialImageUrl.trim() !== "" && 
                      !initialImageUrl.includes("placehold")

  const [src, setSrc] = useState<string>(
    isRealImage ? initialImageUrl! : `/products/${productId}/1.jpg`
  )
  const [errorCount, setErrorCount] = useState<number>(0)

  const handleError = () => {
    if (errorCount === 0 && isRealImage) {
      // Si falló la URL principal de la BD, intentamos la local por si acaso
      setErrorCount(1)
      setSrc(`/products/${productId}/1.jpg`)
    } else {
      // Si ya falló la local o no tenía imagen real, pasamos al estado roto seguro
      setErrorCount(2)
    }
  }

  if (errorCount === 2) {
    return (
      <div className="product-no-img" style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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