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
