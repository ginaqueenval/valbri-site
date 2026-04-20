import request from "../utils/request";

export function createStripeSession(data) {
  return request({ url: "/payment/stripe/create", method: "post", data });
}
