import request from "../utils/request";

export function getPublishedPolicies() {
  return request({ url: "/legal/policies", method: "get" });
}

export function getPublishedPolicy(type) {
  return request({ url: `/legal/policies/${type}`, method: "get" });
}

export function getLegalAcceptanceStatus() {
  return request({ url: "/player/legal/status", method: "get" });
}

export function acceptCurrentPolicies(data) {
  return request({ url: "/player/legal/accept", method: "post", data });
}
