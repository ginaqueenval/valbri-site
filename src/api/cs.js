import request from "../utils/request";

export function initCustomerSession(data) {
  return request({ url: "/cs/session/init", method: "post", data });
}

export function getCustomerSession(visitorToken) {
  return request({
    url: "/cs/session",
    method: "get",
    params: visitorToken ? { visitorToken } : {},
  });
}

export function getCustomerMessages(conversationId, visitorToken) {
  return request({
    url: `/cs/messages/${conversationId}`,
    method: "get",
    params: visitorToken ? { visitorToken } : {},
  });
}

export function sendCustomerMessage(data) {
  return request({ url: "/cs/message", method: "post", data });
}

export function sendCustomerImageMessage(data) {
  return request({
    url: "/cs/messages/image",
    method: "post",
    data,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30000,
  });
}

export function getCustomerMedia(messageId, visitorToken) {
  return request({
    url: `/cs/media/${messageId}`,
    method: "get",
    params: visitorToken ? { visitorToken } : {},
    responseType: "blob",
  });
}

export function createCustomerStreamToken(data) {
  return request({ url: "/cs/session/stream-token", method: "post", data });
}

export function markCustomerRead(conversationId, visitorToken) {
  return request({
    url: `/cs/session/read/${conversationId}`,
    method: "post",
    params: visitorToken ? { visitorToken } : {},
  });
}

export function bindCustomerPlayer(data) {
  return request({ url: "/cs/session/bind-player", method: "post", data });
}
