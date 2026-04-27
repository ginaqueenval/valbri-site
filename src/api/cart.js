import request from "../utils/request";

export function getCartItems() {
  return request({ url: "/valbri/cart/items", method: "get" });
}

export function getCartCount() {
  return request({ url: "/valbri/cart/items/count", method: "get" });
}

export function getCartItem(id) {
  return request({ url: `/valbri/cart/items/${id}`, method: "get" });
}

export function addCartItem(data) {
  return request({ url: "/valbri/cart/items", method: "post", data });
}

export function updateCartItemQuantity(id, data) {
  return request({ url: `/valbri/cart/items/${id}`, method: "put", data });
}

export function removeCartItem(id) {
  return request({ url: `/valbri/cart/items/${id}`, method: "delete" });
}

export function checkoutCartItem(id) {
  return request({ url: `/valbri/cart/checkout/${id}`, method: "post" });
}
