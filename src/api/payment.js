import request from "../utils/request";

export function createStripeSession(data) {
  return request({ url: "/payment/stripe/create", method: "post", data });
}

export function createPayPalOrder(data) {
  return request({ url: "/payment/paypal/create", method: "post", data });
}

export function getPaymentStatus(params) {
  return request({ url: "/valbri/orders/payment-status", method: "get", params });
}

export function getStripePaymentStatus(params) {
  return getPaymentStatus(params);
}
