import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPaymentStatus } from "../api/payment";
import {
  DELIVERY_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  formatCoinsK,
  formatPlatform,
  formatPrice,
  shouldShowDeliveryStatus,
} from "../utils/orderDisplay";

const isSbcOrder = (order) => String(order?.productType || "").toLowerCase() === "sbc";

function DetailRow({ label, value, accent = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-[#9AA7BD]">{label}</span>
      <span
        className={`min-w-0 break-words text-right font-semibold ${
          accent ? "text-[#00FF9A]" : "text-[#E7EDF7]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function PaymentCancel() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const orderNo = searchParams.get("orderNo");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const requestKey = useMemo(() => searchParams.toString(), [searchParams]);
  const hasOrderNo = Boolean(orderNo);

  useEffect(() => {
    if (!hasOrderNo) return undefined;
    let cancelled = false;
    let timer = null;
    let attempts = 0;
    const maxAttempts = 3;

    const loadStatus = async () => {
      try {
        const res = await getPaymentStatus({ orderNo });
        if (cancelled) return;
        setOrder(res.data || null);
        setError("");
      } catch (err) {
        if (cancelled) return;
        attempts += 1;
        if (attempts >= maxAttempts) {
          setOrder(null);
          setError(err.message || t("payment.confirmFailed"));
          return;
        }
        timer = window.setTimeout(loadStatus, 1500 * attempts);
      }
    };

    loadStatus();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [hasOrderNo, orderNo, requestKey, t]);

  const effectiveError = hasOrderNo ? error : t("payment.confirmMissing");

  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-14 text-center sm:pt-20">
      <div className="reveal-scale mx-auto rounded-[28px] border border-yellow-400/22 bg-[linear-gradient(180deg,rgba(15,22,36,0.78),rgba(8,12,20,0.92))] p-8 sm:p-10">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-yellow-400/12">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-8 w-8 text-yellow-300"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-black tracking-[-0.025em] text-[#E7EDF7] sm:text-3xl">
          {t("payment.cancelTitle")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#9AA7BD]">
          {t("payment.cancelDesc")}
        </p>
        {effectiveError && (
          <p className="mt-3 text-xs text-red-300">{effectiveError}</p>
        )}

        <div className="mt-7 rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-left">
          {orderNo && (
            <DetailRow
              label={t("payment.orderNo")}
              value={<span className="break-all font-mono text-xs">{orderNo}</span>}
            />
          )}
          {order?.payStatus && (
            <DetailRow
              label={t("payment.realStatus")}
              value={t(
                `orders.status.${PAYMENT_STATUS_LABEL[order.payStatus] || "pending"}`,
              )}
            />
          )}
          {shouldShowDeliveryStatus(order) && (
            <DetailRow
              label={t("payment.deliveryStatus")}
              value={t(
                `orders.delivery.${
                  DELIVERY_STATUS_LABEL[order.deliveryStatus] || "pendingDelivery"
                }`,
              )}
            />
          )}
          {order?.packageName && (
            <DetailRow label={t("checkout.package")} value={order.packageName} />
          )}
          {order?.platform && (
            <DetailRow label={t("checkout.platform")} value={formatPlatform(order.platform)} />
          )}
          {!isSbcOrder(order) && order?.coins ? (
            <DetailRow
              label={t("checkout.coins")}
              value={`${formatCoinsK(order.coins)}${
                order?.quantity > 1 ? ` ×${order.quantity}` : ""
              }`}
            />
          ) : null}
          {!isSbcOrder(order) && order?.giftCoins > 0 && (
            <DetailRow
              label={t("checkout.gift")}
              value={`+${formatCoinsK(order.giftCoins)}`}
              accent
            />
          )}
          {order?.price != null && (
            <div className="mt-2 border-t border-white/8 pt-3">
              <DetailRow
                label={t("checkout.total")}
                value={formatPrice(order.price, order.currency)}
              />
            </div>
          )}
        </div>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/orders" className="cta-primary w-full px-6 py-3 text-sm sm:w-auto">
            {t("payment.viewOrders")}
          </Link>
          <Link to="/home" className="cta-secondary w-full px-6 py-3 text-sm sm:w-auto">
            {t("payment.backHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
