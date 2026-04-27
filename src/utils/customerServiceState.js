export function normalizeVisitorToken(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function upsertCustomerMessage(messages, nextMessage) {
  const nextId = Number(nextMessage?.id || 0);
  const filtered = Array.isArray(messages)
    ? messages.filter((item) => Number(item?.id || 0) !== nextId)
    : [];
  return [...filtered, nextMessage].sort(
    (left, right) => Number(left?.id || 0) - Number(right?.id || 0),
  );
}

export function buildCustomerStreamUrl(
  apiBaseUrl,
  conversationId,
  streamToken,
  visitorToken,
) {
  const base = (apiBaseUrl || "/api").replace(/\/$/, "");
  const params = new URLSearchParams();
  params.set("streamToken", streamToken);
  const normalizedVisitorToken = normalizeVisitorToken(visitorToken);
  if (normalizedVisitorToken) {
    params.set("visitorToken", normalizedVisitorToken);
  }
  return `${base}/cs/stream/player/${conversationId}?${params.toString()}`;
}

export function resolveCustomerVisitorToken(localVisitorToken, session) {
  return (
    normalizeVisitorToken(session?.visitorToken) ||
    normalizeVisitorToken(localVisitorToken)
  );
}

export function isCustomerSessionAccessDenied(message) {
  return String(message || "").trim() === "会话无权访问";
}

export function isCustomerSessionClosed(message) {
  return String(message || "").trim() === "会话已关闭";
}

export function normalizeCustomerServiceNotice(message, translate) {
  if (isCustomerSessionAccessDenied(message)) {
    return translate?.("cs.sessionAccessDenied") || "当前客服会话已失效，请关闭后重新打开客服窗口";
  }
  if (isCustomerSessionClosed(message)) {
    return translate?.("cs.sessionClosed") || "当前客服会话已关闭";
  }
  return message;
}
