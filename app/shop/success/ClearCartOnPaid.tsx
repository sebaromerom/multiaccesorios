'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/lib/store'

export default function ClearCartOnPaid() {
  useEffect(() => {
    useCartStore.setState({ cart: [] })
  }, [])

  return null
}
