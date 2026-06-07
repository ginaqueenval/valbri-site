export const PAYMENT_STATUS_LABEL = {
  0: "pending",
  1: "paid",
  2: "cancelled",
  3: "refunded",
};

export const DELIVERY_STATUS_LABEL = {
  0: "pendingDelivery",
  1: "delivering",
  2: "completed",
};

export const normalizePaymentStatus = (value) => String(value ?? "0");

export const normalizeDeliveryStatus = (value) => String(value ?? "");

export const getPaymentStatusLabel = (value) =>
  PAYMENT_STATUS_LABEL[normalizePaymentStatus(value)] || "pending";

export const getDeliveryStatusLabel = (value) =>
  DELIVERY_STATUS_LABEL[normalizeDeliveryStatus(value)] || "pendingDelivery";

export const isPaidPaymentStatus = (value) => normalizePaymentStatus(value) === "1";

export const isPendingPaymentStatus = (value) =>
  normalizePaymentStatus(value) === "0";

export const formatCoinsK = (value) => {
  if (!value) return "0";
  if (value < 1000) return String(value);
  const k = Math.round(value / 1000);
  return k.toLocaleString("en-US") + "K";
};

export const formatPrice = (value, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(value || 0);

export const shouldShowDeliveryStatus = (order) => {
  const deliveryStatus = order?.deliveryStatus;
  return (
    isPaidPaymentStatus(order?.payStatus) &&
    deliveryStatus !== undefined &&
    deliveryStatus !== null &&
    deliveryStatus !== ""
  );
};

export const isAccountInfoSubmitted = (order) =>
  order?.accountInfoStatus === "submitted";

export const formatTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  const dateText = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timeText = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return `${dateText} ${timeText}`;
};
