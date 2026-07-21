import request from "../utils/request";

const baseUrl = "/player/privacy-preferences";

export function getPrivacyPreferences() {
  return request({ url: baseUrl, method: "get" });
}

export function updatePrivacyPreferences(data) {
  return request({ url: baseUrl, method: "put", data });
}
