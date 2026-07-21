import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPaymentStatus } from "../api/payment";
import OrderAccountInfoModal from "../components/OrderAccountInfoModal";
import useOrderSse from "../hooks/useOrderSse";
import {
  DELIVERY_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  formatCoinsK,
  formatPlatform,
  formatPrice,
  shouldShowDeliveryStatus,
} from "../utils/orderDisplay";
import { isAccountInfoMissing } from "../utils/orderProgress";

const needsAccountInfo = (order) =>
  order?.requiresAccountInfo === true ||
  order?.accountInfoStatus === "missing" ||
  isAccountInfoMissing(order);

const isSbcOrder = (order) => String(order?.productType || "").toLowerCase() === "sbc";

const STATE_TONE = {
  paid: {
    ring: "border-[#00FF9A]/24 shadow-[0_0_44px_rgba(0,255,154,0.14)]",
    bg: "bg-[#00FF9A]/10",
    text: "text-[#00FF9A]",
    iconPath: (
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    ),
  },
  pending: {
    ring: "border-yellow-400/24",
    bg: "bg-yellow-400/12",
    text: "text-yellow-300",
    iconPath: (
      <path
        fillRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 5.25a.75.75 0 01.75.75v3.44l2.03 1.22a.75.75 0 11-.78 1.28l-2.39-1.44a.75.75 0 01-.36-.64V8.25a.75.75 0 01.75-.75z"
        clipRule="evenodd"
      />
    ),
  },
  error: {
    ring: "border-red-400/24",
    bg: "bg-red-500/12",
    text: "text-red-300",
    iconPath: (
      <path
        fillRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
        clipRule="evenodd"
      />
    ),
  },
  checking: {
    ring: "border-cyan-400/24",
    bg: "bg-cyan-400/12",
    text: "text-cyan-200",
    iconPath: (
      <path
        fillRule="evenodd"
        d="M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zm.75 4.5a.75.75 0 00-1.5 0v5.19l-1.72 1.72a.75.75 0 101.06 1.06l1.94-1.94a.75.75 0 00.22-.53V6.75z"
        clipRule="evenodd"
      />
    ),
  },
};

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

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderNo = searchParams.get("orderNo");
  const [order, setOrder] = useState(null);
  const [viewState, setViewState] = useState("checking");
  const [error, setError] = useState("");
  const [accountInfoCompletedKey, setAccountInfoCompletedKey] = useState("");
  const [accountInfoDismissedKey, setAccountInfoDismissedKey] = useState("");
  const requestKey = useMemo(() => searchParams.toString(), [searchParams]);
  const hasPaymentReference = Boolean(sessionId || orderNo);
  // paidRef:仅当 payStatus === "1" 真正终态到达时为 true,SSE 监听才退场。
  // 旧版用单一 settledRef 同时表达「停轮询」+「封 SSE」,导致初始轮询超时切 pending
  // 后再也收不到后端推送的 paid 状态,UI 永远卡 pending。
  const paidRef = useRef(false);
  const fetchOnceRef = useRef(null);

  useEffect(() => {
    if (!hasPaymentReference) return undefined;

    let cancelled = false;
    let timer = null;
    let attempts = 0;
    const maxAttempts = 10;
    const intervalMs = 1500;
    paidRef.current = false;

    const fetchStatus = async () => {
      try {
        const res = await getPaymentStatus({
          sessionId: sessionId || undefined,
          orderNo: orderNo || undefined,
        });
        if (cancelled) return { settled: true };
        const nextOrder = res.data || null;
        setOrder(nextOrder);
        // 统一走 String(...) 包裹与项目其他 payStatus 判断对齐,
        // 防御后端字段类型未来变化 / 管理端裸 SQL 修改时混入数字 1。
        if (String(nextOrder?.payStatus) === "1") {
          setViewState("paid");
          paidRef.current = true; // 真终态,SSE 可退场
          return { settled: true };
        }
        return { settled: false };
      } catch (err) {
        if (cancelled) return { settled: true };
        return { settled: false, error: err };
      }
    };

    fetchOnceRef.current = fetchStatus;

    const pollStatus = async () => {
      const result = await fetchStatus();
      if (cancelled || result.settled) return;
      attempts += 1;
      if (attempts >= maxAttempts) {
        // 轮询超时切 pending / error 后,SSE 仍继续监听 —— webhook 后到时可自愈
        if (result.error) {
          setViewState("error");
          setError(result.error.message || t("payment.confirmFailed"));
        } else {
          setViewState("pending");
        }
        return;
      }
      timer = window.setTimeout(pollStatus, intervalMs);
    };

    // Reset state for a new payment confirmation cycle, then kick off polling.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(null);
    setViewState("checking");
    setError("");
    pollStatus();

    return () => {
      cancelled = true;
      fetchOnceRef.current = null;
      if (timer) window.clearTimeout(timer);
    };
  }, [hasPaymentReference, orderNo, requestKey, sessionId, t]);

  const handleSseEvent = useCallback(
    (event) => {
      // 只有真正 paid 终态才忽略后续推送;pending / error 仍允许 SSE 触发重拉。
      if (paidRef.current || !fetchOnceRef.current) return;
      // fallback 兜底事件:SSE 长连断开重连时由 hook 主动触发,
      // 旧版直接 return 会让兜底救援链失效 —— 改为全量重拉。
      if (event.fallback) {
        fetchOnceRef.current();
        return;
      }
      if (event.bulk) {
        const targetSet = Array.isArray(event.orderNos)
          ? new Set(event.orderNos)
          : null;
        if (orderNo && targetSet && !targetSet.has(orderNo)) return;
      } else if (orderNo && event.orderNo && event.orderNo !== orderNo) {
        return;
      }
      fetchOnceRef.current();
    },
    [orderNo],
  );

  useOrderSse(handleSseEvent);

  const effectiveViewState = hasPaymentReference ? viewState : "error";
  const effectiveError = hasPaymentReference
    ? error
    : t("payment.confirmMissing");
  const accountInfoOpen =
    effectiveViewState === "paid" &&
    needsAccountInfo(order) &&
    accountInfoCompletedKey !== requestKey &&
    accountInfoDismissedKey !== requestKey;

  const tone = STATE_TONE[effectiveViewState] || STATE_TONE.checking;
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

  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-14 text-center sm:pt-20">
      <OrderAccountInfoModal
        order={order}
        open={accountInfoOpen}
        onSaved={() => {
          setAccountInfoCompletedKey(requestKey);
          setAccountInfoDismissedKey("");
          setOrder((prev) =>
            prev
              ? {
                  ...prev,
                  requiresAccountInfo: false,
                  accountInfoStatus: "submitted",
                }
              : prev,
          );
        }}
        onClose={() => setAccountInfoDismissedKey(requestKey)}
      />

      <div
        className={`reveal-scale mx-auto rounded-[28px] border bg-[linear-gradient(180deg,rgba(15,22,36,0.78),rgba(8,12,20,0.92))] p-8 sm:p-10 ${tone.ring}`}
      >
        <div
          className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full ${tone.bg} ${
            effectiveViewState === "checking" ? "animate-pulse" : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`h-8 w-8 ${tone.text}`}
          >
            {tone.iconPath}
          </svg>
        </div>
        <h1 className="text-2xl font-black tracking-[-0.025em] text-[#E7EDF7] sm:text-3xl">
          {t(titleKey)}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#9AA7BD]">{t(descKey)}</p>
        {effectiveError && (
          <p className="mt-3 text-xs text-red-300">{effectiveError}</p>
        )}

        <div className="mt-7 rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-left">
          {(order?.orderNo || orderNo) && (
            <DetailRow
              label={t("payment.orderNo")}
              value={
                <span className="break-all font-mono text-xs">
                  {order?.orderNo || orderNo}
                </span>
              }
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
            <DetailRow
              label={t("checkout.package")}
              value={order.packageName}
            />
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
                accent
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
