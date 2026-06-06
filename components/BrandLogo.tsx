import Image from 'next/image'

type BrandLogoProps = {
  className?: string
  alt?: string
  priority?: boolean
  sizes?: string
}

export default function BrandLogo({
  className = '',
  alt = 'Multi Accesorios',
  priority = false,
  sizes = '56px',
}: BrandLogoProps) {
  return (
    <span className={`brand-logo ${className}`.trim()}>
      <Image
        src="/multi.jpeg"
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        style={{ objectFit: 'contain' }}
      />
    </span>
  )
}
