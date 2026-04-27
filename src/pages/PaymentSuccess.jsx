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

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderNo = searchParams.get("orderNo");
  const [order, setOrder] = useState(null);
  const [viewState, setViewState] = useState("checking");
  const [error, setError] = useState("");
  const requestKey = useMemo(() => searchParams.toString(), [searchParams]);
  const hasPaymentReference = Boolean(sessionId || orderNo);

  useEffect(() => {
    if (!hasPaymentReference) {
      return;
    }
    if (!getPlayerToken()) {
      navigate("/login", {
        state: { redirectTo: `/payment/success?${requestKey}` },
      });
      return;
    }

    let cancelled = false;
    let timer = null;
    let attempts = 0;
    const maxAttempts = 10;
    const intervalMs = 1500;

    const pollStatus = async () => {
      try {
        const res = await getPaymentStatus({
          sessionId: sessionId || undefined,
          orderNo: orderNo || undefined,
        });
        if (cancelled) {
          return;
        }
        const nextOrder = res.data || null;
        setOrder(nextOrder);
        if (nextOrder?.payStatus === "1") {
          setViewState("paid");
          return;
        }
        attempts += 1;
        if (attempts >= maxAttempts) {
          setViewState("pending");
          return;
        }
        timer = window.setTimeout(pollStatus, intervalMs);
      } catch (err) {
        if (cancelled) {
          return;
        }
        attempts += 1;
        if (attempts >= maxAttempts) {
          setViewState("error");
          setError(err.message || t("payment.confirmFailed"));
          return;
        }
        timer = window.setTimeout(pollStatus, intervalMs);
      }
    };

    const startPolling = async () => {
      setOrder(null);
      setViewState("checking");
      setError("");
      await pollStatus();
    };

    startPolling();

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [hasPaymentReference, navigate, orderNo, requestKey, sessionId, t]);

  const effectiveViewState = hasPaymentReference ? viewState : "error";
  const effectiveError = hasPaymentReference ? error : t("payment.confirmMissing");

  const titleKey =
    effectiveViewState === "paid"
      ? "payment.successTitle"
      : effectiveViewState === "pending"
        ? "payment.pendingTitle"
        : effectiveViewState === "error"
          ? "payment.confirmFailedTitle"
          : "payment.confirmingTitle";
  const descKey =
    effectiveViewState === "paid"
      ? "payment.successDesc"
      : effectiveViewState === "pending"
        ? "payment.pendingDesc"
        : effectiveViewState === "error"
          ? "payment.confirmFailedDesc"
          : "payment.confirmingDesc";
  const accentClass =
    effectiveViewState === "paid"
      ? "border-[#00FF9A]/15"
      : effectiveViewState === "pending"
        ? "border-yellow-500/20"
        : effectiveViewState === "error"
          ? "border-red-500/20"
          : "border-cyan-400/20";
  const badgeClass =
    effectiveViewState === "paid"
      ? "bg-[#00FF9A]/10 text-[#00FF9A]"
      : effectiveViewState === "pending"
        ? "bg-yellow-500/10 text-yellow-300"
        : effectiveViewState === "error"
          ? "bg-red-500/10 text-red-300"
          : "bg-cyan-400/10 text-cyan-300";

  return (
    <main className="mx-auto max-w-6xl px-4 py-20 text-center">
      <div className={`mx-auto max-w-md rounded-3xl border bg-[#0B1220]/60 p-8 ${accentClass}`}>
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            effectiveViewState === "paid"
              ? "bg-[#00FF9A]/10"
              : effectiveViewState === "pending"
                ? "bg-yellow-500/10"
                : effectiveViewState === "error"
                  ? "bg-red-500/10"
                  : "bg-cyan-400/10"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`h-8 w-8 ${
              effectiveViewState === "paid"
                ? "text-[#00FF9A]"
                : effectiveViewState === "pending"
                  ? "text-yellow-400"
                  : effectiveViewState === "error"
                    ? "text-red-400"
                    : "text-cyan-300"
            }`}
          >
            {effectiveViewState === "paid" ? (
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            ) : effectiveViewState === "pending" ? (
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 5.25a.75.75 0 01.75.75v3.44l2.03 1.22a.75.75 0 11-.78 1.28l-2.39-1.44a.75.75 0 01-.36-.64V8.25a.75.75 0 01.75-.75z"
                clipRule="evenodd"
              />
            ) : effectiveViewState === "error" ? (
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zm.75 4.5a.75.75 0 00-1.5 0v5.19l-1.72 1.72a.75.75 0 101.06 1.06l1.94-1.94a.75.75 0 00.22-.53V6.75z"
                clipRule="evenodd"
              />
            )}
          </svg>
        </div>
        <div className={`mx-auto mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
          {effectiveViewState === "paid"
            ? t("orders.status.paid")
            : effectiveViewState === "pending"
              ? t("orders.status.pending")
              : effectiveViewState === "error"
                ? t("payment.confirmFailedShort")
                : t("payment.confirmingShort")}
        </div>
        <h1 className="text-2xl font-extrabold">{t(titleKey)}</h1>
        <p className="mt-3 text-sm text-[#9AA7BD]">
          {t(descKey)}
        </p>
        {effectiveError && (
          <p className="mt-3 text-xs text-red-300">{effectiveError}</p>
        )}
        <div className="mt-5 space-y-2 rounded-2xl border border-white/5 bg-white/5 p-4 text-left text-sm">
          {order?.orderNo || orderNo ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#9AA7BD]">{t("payment.orderNo")}</span>
              <span className="font-mono text-xs text-[#E7EDF7]">{order?.orderNo || orderNo}</span>
            </div>
          ) : null}
          {sessionId && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#9AA7BD]">{t("payment.sessionId")}</span>
              <span className="font-mono text-xs text-[#E7EDF7]">{sessionId.slice(0, 20)}...</span>
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
              <span className="font-semibold text-[#00FF9A]">
                {formatPrice(order.price, order.currency)}
              </span>
            </div>
          ) : null}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/orders"
            className="rounded-xl bg-[#00FF9A] px-6 py-3 text-sm font-semibold text-[#070A0F] hover:bg-[#00D47E]"
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
