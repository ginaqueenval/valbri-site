import request from "../utils/request";

const baseUrl = "/player/privacy-requests";

export function createPrivacyRequest(data) {
  return request({ url: baseUrl, method: "post", data });
}

export function listPrivacyRequests() {
  return request({ url: baseUrl, method: "get" });
}

export function getPrivacyRequest(id) {
  return request({ url: `${baseUrl}/${id}`, method: "get" });
}

export function cancelPrivacyRequest(id) {
  return request({ url: `${baseUrl}/${id}/cancel`, method: "post" });
}
