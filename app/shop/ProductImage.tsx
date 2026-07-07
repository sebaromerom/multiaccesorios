'use client'
import SafeProductImage from '@/components/SafeProductImage'

interface ProductImageProps {
  productId: string
  productName: string
  initialImageUrl?: string | null
}

export default function ProductImage({ productName, initialImageUrl }: ProductImageProps) {
  return (
    <SafeProductImage
      src={initialImageUrl}
      alt={productName}
      fill
      sizes="(max-width: 760px) 42vw, (max-width: 1180px) 30vw, (max-width: 1400px) 23vw, 230px"
      loading="lazy"
      quality={62}
      style={{
        objectFit: 'contain',
        display: 'block',
        backgroundColor: '#fcfcfc',
      }}
    />
  )
}
