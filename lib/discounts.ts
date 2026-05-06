type CartItem = {
  productId: string
  name: string
  price: number
  quantity: number
}

type DiscountRule = {
  id: string
  name: string
  type: string
  value: number
  minQuantity: number
  active: boolean
  productId: string | null
}

type DiscountResult = {
  subtotal: number
  discount: number
  total: number
  appliedDiscounts: { name: string; amount: number }[]
}

export function applyDiscounts(
  items: CartItem[],
  rules: DiscountRule[]
): DiscountResult {
  const activeRules = rules.filter((r) => r.active)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  let totalDiscount = 0
  const appliedDiscounts: { name: string; amount: number }[] = []

  for (const rule of activeRules) {
    const applicableItems = rule.productId
      ? items.filter((i) => i.productId === rule.productId)
      : items

    for (const item of applicableItems) {
      if (item.quantity < rule.minQuantity) continue

      let discountAmount = 0

      if (rule.type === 'percentage') {
        discountAmount = item.price * item.quantity * (rule.value / 100)
      } else if (rule.type === 'fixed') {
        discountAmount = Math.min(rule.value, item.price * item.quantity)
      } else if (rule.type === '2x1') {
        const freeItems = Math.floor(item.quantity / 2)
        discountAmount = freeItems * item.price
      }

      if (discountAmount > 0) {
        totalDiscount += discountAmount
        appliedDiscounts.push({
          name: `${rule.name} (${item.name})`,
          amount: discountAmount,
        })
      }
    }
  }

  return {
    subtotal,
    discount: totalDiscount,
    total: Math.max(0, subtotal - totalDiscount),
    appliedDiscounts,
  }
}