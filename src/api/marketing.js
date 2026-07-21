import request from "../utils/request";

function unsubscribeUrl(token) {
  return `/marketing/unsubscribe/${encodeURIComponent(token)}`;
}

export function confirmMarketingUnsubscribe(token) {
  return request({ url: unsubscribeUrl(token), method: "get" });
}

export function unsubscribeMarketing(token) {
  return request({ url: unsubscribeUrl(token), method: "post" });
}
