import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PRODUCT_TERM_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\biphone\b/gi, 'iPhone'],
  [/\bipad\b/gi, 'iPad'],
  [/\bmagsafe\b/gi, 'MagSafe'],
  [/\bbluetooth\b/gi, 'Bluetooth'],
  [/\busb\b/gi, 'USB'],
  [/\btws\b/gi, 'TWS'],
  [/\bpc\b/gi, 'PC'],
  [/\bmlab\b/gi, 'MLab'],
  [/\bhoco\b/gi, 'Hoco'],
  [/\bbaseus\b/gi, 'Baseus'],
  [/\baudifono\b/gi, 'Audífono'],
  [/\baudifonos\b/gi, 'Audífonos'],
  [/\blamina\b/gi, 'Lámina'],
  [/\btelefono\b/gi, 'Teléfono'],
  [/\bplastico\b/gi, 'plástico'],
  [/\bcamaras\b/gi, 'cámaras'],
  [/\binalambrico\b/gi, 'inalámbrico'],
  [/\bcable usb to ip\b/gi, 'Cable USB a Lightning'],
  [/\bcarcasa con esquina reforzadas\b/gi, 'Carcasa con esquinas reforzadas'],
  [/\bprotector de cámaras iphone\b/gi, 'Protector de cámaras para iPhone'],
  [/\bmetal magsafe \+ camara\b/gi, 'Carcasa MagSafe con protector de cámara'],
  [/\bpro max\b/gi, 'Pro Max'],
  [/\bpro\b/gi, 'Pro'],
  [/\bplus\b/gi, 'Plus'],
  [/(\d+(?:[.,]\d+)?)\s*mah\b/gi, '$1 mAh'],
  [/(\d+(?:[.,]\d+)?)\s*w\b/gi, '$1 W'],
  [/(\d+(?:[.,]\d+)?)\s*l\b/gi, '$1 L'],
]

export function formatProductName(value: string) {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed) return trimmed

  const isUppercase = trimmed === trimmed.toLocaleUpperCase('es-CL')
  let formatted = isUppercase ? trimmed.toLocaleLowerCase('es-CL') : trimmed
  if (isUppercase) {
    formatted = formatted.charAt(0).toLocaleUpperCase('es-CL') + formatted.slice(1)
  }

  for (const [pattern, replacement] of PRODUCT_TERM_REPLACEMENTS) {
    formatted = formatted.replace(pattern, replacement)
  }

  return formatted
}
