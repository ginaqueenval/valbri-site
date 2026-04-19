import request from "../utils/request";

export function createOrder(data) {
  return request({ url: "/valbri/orders", method: "post", data });
}

export function getOrderList(params) {
  return request({ url: "/valbri/orders", method: "get", params });
}

export function getOrderDetail(id) {
  return request({ url: `/valbri/orders/${id}`, method: "get" });
}
