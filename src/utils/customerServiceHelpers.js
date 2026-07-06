import {
  CUSTOMER_SERVICE_FLOATING_STORAGE_KEY,
  CUSTOMER_SERVICE_MOBILE_BREAKPOINT,
  getDefaultFloatingPosition,
  normalizeFloatingPosition,
  parseStoredFloatingPosition,
} from "./customerServiceFloating.js";
import { upsertCustomerMessage } from "./customerServiceState";
import { safeGetItem } from "./safeStorage.js";

export const VISITOR_TOKEN_KEY = "cs_visitor_token";
export const DESKTOP_BUTTON_SIZE = 60;
export const MOBILE_BUTTON_SIZE = 58;
export const DESKTOP_PADDING = 18;
export const MOBILE_PADDING = 14;
export const DESKTOP_PANEL_WIDTH = 400;
export const MAX_MESSAGE_LENGTH = 500;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const CUSTOMER_MESSAGE_WINDOW_DAYS = 1;
export const CUSTOMER_HISTORY_SCROLL_THRESHOLD = 24;
const CUSTOMER_TIME_SEPARATOR_MINUTES = 5;

export function getViewportSnapshot() {
  if (typeof window === "undefined") {
    return { width: 1440, height: 900 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

export function getLauncherConfig(viewportWidth) {
  const mobile = viewportWidth < CUSTOMER_SERVICE_MOBILE_BREAKPOINT;
  return {
    mobile,
    buttonSize: mobile ? MOBILE_BUTTON_SIZE : DESKTOP_BUTTON_SIZE,
    padding: mobile ? MOBILE_PADDING : DESKTOP_PADDING,
  };
}

export function getInitialLauncherPosition() {
  const viewport = getViewportSnapshot();
  const config = getLauncherConfig(viewport.width);
  if (typeof window === "undefined") {
    return getDefaultFloatingPosition(viewport, config);
  }
  const stored = parseStoredFloatingPosition(
    safeGetItem(CUSTOMER_SERVICE_FLOATING_STORAGE_KEY),
  );
  return normalizeFloatingPosition(stored, viewport, config);
}

export function getMessageTime(message) {
  const time = new Date(message?.createTime || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function normalizeMessageWindowPayload(payload) {
  const nextBefore =
    payload?.nextBefore == null
      ? null
      : Number.isFinite(Number(payload.nextBefore))
        ? String(payload.nextBefore)
        : String(new Date(payload.nextBefore).getTime());
  if (Array.isArray(payload)) {
    return { rows: payload, hasMore: false, nextBefore: null };
  }
  return {
    rows: Array.isArray(payload?.rows) ? payload.rows : [],
    hasMore: payload?.hasMore === true,
    nextBefore: nextBefore && nextBefore !== "NaN" ? nextBefore : null,
  };
}

export function mergeCustomerMessages(current, incoming) {
  return (incoming || []).reduce(upsertCustomerMessage, current || []);
}

function formatCustomerTimeSeparator(value, language) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "";
  }
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMessageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const timeText = date.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" });
  if (startOfMessageDay === startOfToday) {
    return timeText;
  }
  if (startOfMessageDay === startOfToday - 24 * 60 * 60 * 1000) {
    return `${String(language || "").startsWith("zh") ? "昨天" : "Yesterday"} ${timeText}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${timeText}`;
}

export function buildCustomerDisplayItems(list, language) {
  const items = [];
  let previousTime = null;
  (list || []).forEach((message) => {
    const currentTime = getMessageTime(message);
    if (
      currentTime > 0 &&
      (previousTime == null ||
        currentTime - previousTime >= CUSTOMER_TIME_SEPARATOR_MINUTES * 60 * 1000)
    ) {
      items.push({
        type: "time",
        key: `time-${message.id || currentTime}`,
        label: formatCustomerTimeSeparator(currentTime, language),
      });
    }
    items.push({ type: "message", key: message.id || `${message.senderType}-${message.createTime}`, message });
    if (currentTime > 0) {
      previousTime = currentTime;
    }
  });
  return items;
}
