export const MAX_CART_QTY = 10;

export function clampCartQuantity(nextQuantity) {
  return Math.max(1, Math.min(MAX_CART_QTY, Number(nextQuantity) || 1));
}

export function updateCartItemsQuantity(items, itemId, quantity) {
  return items.map((item) =>
    item.id === itemId ? { ...item, quantity: clampCartQuantity(quantity) } : item,
  );
}
