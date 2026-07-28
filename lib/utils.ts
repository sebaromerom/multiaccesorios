import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PRODUCT_TERM_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\baudifonos?\b/gi, 'Aud\u00edfonos'],
  [/\bauriculares?\b/gi, 'Aud\u00edfonos'],
  [/\bairpods?\b/gi, 'Aud\u00edfonos Bluetooth'],
  [/\bparlantes?\b/gi, 'Parlante'],
  [/\btarjeta de memoria\b/gi, 'Tarjeta MicroSD'],
  [/\bvaporizador(?:es)?\b/gi, 'Vaper'],
  [/\bvapers?\b/gi, 'Vaper'],
  [/\bdesechable\b/gi, 'Desechable'],
  [/\btelefono\b/gi, 'Tel\u00e9fono'],
  [/\blamina\b/gi, 'L\u00e1mina'],
  [/\binalambrico\b/gi, 'Inal\u00e1mbrico'],
  [/\bwireless\b/gi, 'Inal\u00e1mbrico'],
  [/\bbluetooth\b/gi, 'Bluetooth'],
  [/\bbt\b/gi, 'Bluetooth'],
  [/\btws\b/gi, 'TWS'],
  [/\btype\s*c\b/gi, 'USB-C'],
  [/\btipo\s*c\b/gi, 'USB-C'],
  [/\busb\s*c\b/gi, 'USB-C'],
  [/\busb-c\b/gi, 'USB-C'],
  [/\busb\b/gi, 'USB'],
  [/\bmicro\s*sd\b/gi, 'MicroSD'],
  [/\bmicrosd\b/gi, 'MicroSD'],
  [/\bsd\b/gi, 'SD'],
  [/\bpc\b/gi, 'PC'],
  [/\bmagsafe\b/gi, 'MagSafe'],
  [/\biphone\b/gi, 'iPhone'],
  [/\bipad\b/gi, 'iPad'],
  [/\bpro max\b/gi, 'Pro Max'],
  [/\bpro\b/gi, 'Pro'],
  [/\bplus\b/gi, 'Plus'],
  [/\bmini\b/gi, 'Mini'],
  [/\bclase\s*(\d+)\b/gi, 'Clase $1'],
  [/(\d+(?:[.,]\d+)?)\s*(?:puff|puffs)\b/gi, '$1 Puffs'],
  [/(\d+(?:[.,]\d+)?)\s*mah\b/gi, '$1 mAh'],
  [/(\d+(?:[.,]\d+)?)\s*mbps\b/gi, '$1 Mbps'],
  [/(\d+(?:[.,]\d+)?)\s*mps\b/gi, '$1 Mbps'],
  [/(\d+(?:[.,]\d+)?)\s*w\b/gi, '$1 W'],
  [/(\d+(?:[.,]\d+)?)\s*gb\b/gi, '$1GB'],
]

const BRAND_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bhoco\b/gi, 'Hoco'],
  [/\bborofone\b/gi, 'Borofone'],
  [/\bremax\b/gi, 'Remax'],
  [/\bjbl\b/gi, 'JBL'],
  [/\bpioneer\b/gi, 'Pioneer'],
  [/\bsamsung\b/gi, 'Samsung'],
  [/\bapple\b/gi, 'Apple'],
  [/\bmaxell\b/gi, 'Maxell'],
  [/\bphilips\b/gi, 'Philips'],
  [/\bbaseus\b/gi, 'Baseus'],
  [/\bmlab\b/gi, 'MLab'],
  [/\bmotomo\b/gi, 'Motomo'],
  [/\bxiaomi\b/gi, 'Xiaomi'],
  [/\bredmi\b/gi, 'Redmi'],
  [/\bkingston\b/gi, 'Kingston'],
  [/\bsandisk\b/gi, 'SanDisk'],
  [/\badata\b/gi, 'Adata'],
  [/\bhp\b/gi, 'HP'],
]

const SMALL_WORDS = new Set(['a', 'al', 'con', 'de', 'del', 'en', 'para', 'por', 'sin', 'y'])

function titleCaseRetail(value: string) {
  return value
    .toLocaleLowerCase('es-CL')
    .split(' ')
    .map((word, index) => {
      if (!word) return word
      if (index > 0 && SMALL_WORDS.has(word)) return word
      return word.charAt(0).toLocaleUpperCase('es-CL') + word.slice(1)
    })
    .join(' ')
}

export function formatProductName(value: string) {
  let formatted = value
    .trim()
    .replace(/[_|]+/g, ' ')
    .replace(/\s*\/\s*/g, ' ')
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')

  if (!formatted) return formatted

  formatted = titleCaseRetail(formatted)

  for (const [pattern, replacement] of PRODUCT_TERM_REPLACEMENTS) {
    formatted = formatted.replace(pattern, replacement)
  }

  for (const [pattern, replacement] of BRAND_REPLACEMENTS) {
    formatted = formatted.replace(pattern, replacement)
  }

  return formatted
    .replace(/\bAud\u00edfono Bluetooth\b/g, 'Aud\u00edfonos Bluetooth')
    .replace(/\bAud\u00edfonos Bluetooth Bluetooth\b/g, 'Aud\u00edfonos Bluetooth')
    .replace(/\bVaper\s+(Fume|Smok|Geek\s*Bar|Meloso)/gi, 'Vaper Desechable $1')
    .replace(/\bVaper Desechable Desechable\b/g, 'Vaper Desechable')
    .replace(/\bTarjeta MicroSD MicroSD\b/g, 'Tarjeta MicroSD')
    .replace(/\bMicroSD SD\b/g, 'MicroSD')
    .replace(/\s+/g, ' ')
    .trim()
}
