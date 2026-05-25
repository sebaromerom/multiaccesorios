import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  size?: string | null
}

type ProductInput = {
  id: string
  name: string
  price: number
  stock: number
}

type CartState = {
  cart: CartItem[]
  addToCart: (product: ProductInput) => void
}

// Creamos un storage seguro que implemente la interfaz StateStorage de Zustand
const customLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(name)
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(name, value)
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(name)
    }
  },
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      addToCart: (product: ProductInput) => {
        const { cart } = get()
        const existing = cart.find((item: CartItem) => item.id === product.id && !item.size)

        const quantityInCart = existing ? existing.quantity : 0
        if (quantityInCart >= product.stock) return

        let newCart: CartItem[] = []

        if (existing) {
          newCart = cart.map((item: CartItem) =>
            item.id === product.id && !item.size
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        } else {
          newCart = [
            ...cart,
            { id: product.id, name: product.name, price: product.price, quantity: 1, size: null }
          ]
        }

        set({ cart: newCart })
        window.dispatchEvent(new Event('cart-updated'))
      },
    }),
    {
      name: 'cart-storage',
      // Pasamos nuestro storage seguro y tipado sin usar 'any'
      storage: createJSONStorage(() => customLocalStorage),
    }
  )
)