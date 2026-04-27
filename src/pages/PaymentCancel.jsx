import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPaymentStatus } from "../api/payment";
import { getPlayerToken } from "../utils/request";
import {
  DELIVERY_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  formatCoinsK,
  formatPrice,
} from "../utils/orderDisplay";

export default function PaymentCancel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderNo = searchParams.get("orderNo");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const requestKey = useMemo(() => searchParams.toString(), [searchParams]);
  const hasOrderNo = Boolean(orderNo);

  useEffect(() => {
    if (!hasOrderNo) {
      return;
    }
    if (!getPlayerToken()) {
      navigate("/login", {
        state: { redirectTo: `/payment/cancel?${requestKey}` },
      });
      return;
    }
    let cancelled = false;

    const loadStatus = async () => {
      try {
        const res = await getPaymentStatus({ orderNo });
        if (cancelled) {
          return;
        }
        setOrder(res.data || null);
        setError("");
      } catch (err) {
        if (cancelled) {
          return;
        }
        setOrder(null);
        setError(err.message || t("payment.confirmFailed"));
      }
    };

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [hasOrderNo, navigate, orderNo, requestKey, t]);

  const effectiveError = hasOrderNo ? error : t("payment.confirmMissing");

  return (
    <main className="mx-auto max-w-6xl px-4 py-20 text-center">
      <div className="mx-auto max-w-md rounded-3xl border border-white/5 bg-[#0B1220]/60 p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-8 w-8 text-yellow-400"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold">{t("payment.cancelTitle")}</h1>
        <p className="mt-3 text-sm text-[#9AA7BD]">{t("payment.cancelDesc")}</p>
        {effectiveError && <p className="mt-3 text-xs text-red-300">{effectiveError}</p>}
        <div className="mt-5 space-y-2 rounded-2xl border border-white/5 bg-white/5 p-4 text-left text-sm">
          {orderNo && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#9AA7BD]">{t("payment.orderNo")}</span>
              <span className="font-mono text-xs text-[#E7EDF7]">{orderNo}</span>
            </div>
          )}
          {order?.payStatus ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#9AA7BD]">{t("payment.realStatus")}</span>
              <span className="font-semibold text-[#E7EDF7]">
                {t(`orders.status.${PAYMENT_STATUS_LABEL[order.payStatus] || "pending"}`)}
              </span>
            </div>
          ) : null}
          {order?.deliveryStatus ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#9AA7BD]">{t("payment.deliveryStatus")}</span>
              <span className="font-semibold text-[#E7EDF7]">
                {t(
                  `orders.delivery.${DELIVERY_STATUS_LABEL[order.deliveryStatus] || "pendingDelivery"}`,
                )}
              </span>
            </div>
          ) : null}
          {order?.packageName ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#9AA7BD]">{t("checkout.package")}</span>
              <span className="text-right font-semibold text-[#E7EDF7]">{order.packageName}</span>
            </div>
          ) : null}
          {order?.platform ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#9AA7BD]">{t("checkout.platform")}</span>
              <span className="font-semibold text-[#E7EDF7]">{order.platform}</span>
            </div>
          ) : null}
          {order?.coins ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#9AA7BD]">{t("checkout.coins")}</span>
              <span className="font-semibold text-[#E7EDF7]">
                {formatCoinsK(order.coins)}
                {order?.quantity > 1 ? ` ×${order.quantity}` : ""}
              </span>
            </div>
          ) : null}
          {order?.giftCoins > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#9AA7BD]">{t("checkout.gift")}</span>
              <span className="font-semibold text-[#00FF9A]">+{formatCoinsK(order.giftCoins)}</span>
            </div>
          ) : null}
          {order?.price != null ? (
            <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-2">
              <span className="text-[#9AA7BD]">{t("checkout.total")}</span>
              <span className="font-semibold text-[#E7EDF7]">
                {formatPrice(order.price, order.currency)}
              </span>
            </div>
          ) : null}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/orders"
            className="rounded-xl border border-[#00FF9A]/30 px-6 py-3 text-sm text-[#00FF9A] hover:bg-[#00FF9A]/10"
          >
            {t("payment.viewOrders")}
          </Link>
          <Link
            to="/home"
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm hover:border-[#00FF9A]/30"
          >
            {t("payment.backHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
