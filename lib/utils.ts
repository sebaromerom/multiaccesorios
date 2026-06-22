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
  [/\baudifonos\b/gi, 'Audífonos'],
  [/\blamina\b/gi, 'Lámina'],
  [/\btelefono\b/gi, 'Teléfono'],
  [/\bpro max\b/gi, 'Pro Max'],
  [/\bpro\b/gi, 'Pro'],
  [/\bplus\b/gi, 'Plus'],
  [/(\d+(?:[.,]\d+)?)\s*mah\b/gi, '$1 mAh'],
  [/(\d+(?:[.,]\d+)?)\s*w\b/gi, '$1 W'],
  [/(\d+(?:[.,]\d+)?)\s*l\b/gi, '$1 L'],
]

export function formatProductName(value: string) {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (!trimmed || trimmed !== trimmed.toLocaleUpperCase('es-CL')) return trimmed

  let formatted = trimmed.toLocaleLowerCase('es-CL')
  formatted = formatted.charAt(0).toLocaleUpperCase('es-CL') + formatted.slice(1)

  for (const [pattern, replacement] of PRODUCT_TERM_REPLACEMENTS) {
    formatted = formatted.replace(pattern, replacement)
  }

  return formatted
}
