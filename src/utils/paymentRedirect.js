const SAFE_PAYMENT_PROTOCOLS = new Set(["http:", "https:"]);

export function getSafePaymentRedirectUrl(paymentUrl, baseUrl = globalThis.location?.href) {
  if (typeof paymentUrl !== "string") {
    return null;
  }

  const trimmedUrl = paymentUrl.trim();
  if (!trimmedUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedUrl, baseUrl);
    return SAFE_PAYMENT_PROTOCOLS.has(parsedUrl.protocol) ? parsedUrl.href : null;
  } catch {
    return null;
  }
}
