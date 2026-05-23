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

export function buildCustomerMediaUrl(apiBaseUrl, messageId, visitorToken) {
  const base = (apiBaseUrl || "/api").replace(/\/$/, "");
  const params = new URLSearchParams();
  const normalizedVisitorToken = normalizeVisitorToken(visitorToken);
  if (normalizedVisitorToken) {
    params.set("visitorToken", normalizedVisitorToken);
  }
  const query = params.toString();
  return `${base}/cs/media/${messageId}${query ? `?${query}` : ""}`;
}

export function resolveCustomerVisitorToken(localVisitorToken, session) {
  return (
    normalizeVisitorToken(session?.visitorToken) ||
    normalizeVisitorToken(localVisitorToken)
  );
}

const SESSION_ACCESS_DENIED_PATTERNS = ["会话无权访问", "session access denied"];
const SESSION_CLOSED_PATTERNS = ["会话已关闭", "session closed"];

export function isCustomerSessionAccessDenied(message) {
  const normalized = String(message || "").trim().toLowerCase();
  return SESSION_ACCESS_DENIED_PATTERNS.some((p) => normalized === p);
}

export function isCustomerSessionClosed(message) {
  const normalized = String(message || "").trim().toLowerCase();
  return SESSION_CLOSED_PATTERNS.some((p) => normalized === p);
}

export function normalizeCustomerServiceNotice(message, translate) {
  if (isCustomerSessionAccessDenied(message)) {
    return translate?.("cs.sessionAccessDenied") || message;
  }
  if (isCustomerSessionClosed(message)) {
    return translate?.("cs.sessionClosed") || message;
  }
  return message;
}
