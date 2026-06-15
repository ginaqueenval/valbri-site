import request from "../utils/request";

export function createOrder(data) {
  return request({ url: "/valbri/orders", method: "post", data });
}

export function getOrderList(params, { signal } = {}) {
  return request({ url: "/valbri/orders", method: "get", params, signal });
}

export function getOrderDetail(id) {
  return request({ url: `/valbri/orders/${id}`, method: "get" });
}

export function getOrderAccountInfo(id) {
  return request({ url: `/valbri/orders/${id}/account-info`, method: "get" });
}

export function saveOrderAccountInfo(id, data) {
  return request({ url: `/valbri/orders/${id}/account-info`, method: "post", data });
}

export function createOrderStreamToken() {
  return request({
    url: "/valbri/orders/stream-token",
    method: "post",
    skipSessionExpiredPrompt: true,
  });
}
