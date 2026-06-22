import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getOrderAccountInfo, getOrderList } from "../api/order";
import OrderAccountInfoModal from "../components/OrderAccountInfoModal";
import useOrderSse from "../hooks/useOrderSse";
import {
  getPlayerOrderProgress,
  isAccountInfoMissing,
  matchesPlayerOrderTab,
  ORDER_PROGRESS_STEPS,
} from "../utils/orderProgress";
import {
  formatCoinsK,
  formatPrice,
  formatTime,
  isPaidPaymentStatus,
  isAccountInfoSubmitted,
  isPendingPaymentStatus,
} from "../utils/orderDisplay";

const ORDER_TABS = [
  { value: "", label: "all" },
  { value: "pendingPayment", label: "pendingPayment", payStatus: "0" },
  { value: "accountRequired", label: "accountRequired", payStatus: "1" },
  { value: "processing", label: "processing", payStatus: "1" },
  { value: "completed", label: "completed", payStatus: "1" },
  { value: "closed", label: "closed" },
];

const isSbcOrder = (order) => String(order?.productType || "").toLowerCase() === "sbc";

const PROGRESS_TONE_CLASS = {
  warning: {
    badge: "bg-yellow-500/10 text-yellow-300",
    fill: "from-yellow-400 to-orange-400",
    dot: "border-yellow-300 text-yellow-200 bg-[#211E14]",
  },
  danger: {
    badge: "bg-red-500/10 text-red-300",
    fill: "from-red-400 to-orange-300",
    dot: "border-red-300 text-red-200 bg-[#24171B]",
  },
  info: {
    badge: "bg-cyan-400/10 text-cyan-200",
    fill: "from-[#00FF9A] to-cyan-300",
    dot: "border-cyan-300 text-cyan-100 bg-[#10212A]",
  },
  processing: {
    badge: "bg-[#00FF9A]/10 text-[#00FF9A]",
    fill: "from-[#00FF9A] via-cyan-300 to-[#62E36E]",
    dot: "border-[#00FF9A] text-[#00FF9A] bg-[#0D241B]",
  },
  success: {
    badge: "bg-[#00FF9A]/10 text-[#00FF9A]",
    fill: "from-[#00FF9A] to-cyan-300",
    dot: "border-[#00FF9A] text-[#00FF9A] bg-[#0D241B]",
  },
  muted: {
    badge: "bg-slate-500/10 text-slate-300",
    fill: "from-slate-500 to-slate-400",
    dot: "border-slate-400 text-slate-300 bg-[#101827]",
  },
};

function OrderProgress({ order }) {
  const { t } = useTranslation();
  const progress = getPlayerOrderProgress(order);
  const toneClass = PROGRESS_TONE_CLASS[progress.tone] || PROGRESS_TONE_CLASS.info;
  const completedSteps = new Set(progress.completedStepIndexes);

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-4 sm:px-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-extrabold ${toneClass.badge}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {t(`orders.progress.status.${progress.statusKey}`)}
        </span>
        <span className="text-sm font-semibold text-[#9AA7BD]">
          {t("orders.progress.percent", { percent: progress.progressPercent })}
        </span>
      </div>

      <div className="block w-full sm:hidden">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${toneClass.fill} ${
              progress.tone === "processing" ? "animate-pulse" : ""
            }`}
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>
      </div>

      <div className="relative hidden h-[5.5rem] w-full sm:block">
        <div className="absolute top-4 left-4 right-4 h-1.5 -translate-y-1/2 rounded-full bg-white/10" />
        <div
          className={`absolute top-4 left-4 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r ${toneClass.fill} ${
            progress.tone === "processing" ? "animate-pulse" : ""
          }`}
          style={{ width: `calc((100% - 2rem) * ${progress.progressPercent / 100})` }}
        />
        {ORDER_PROGRESS_STEPS.map((stepKey, index) => {
          const completed = completedSteps.has(index);
          const leftPos = `calc(1rem + (100% - 2rem) * ${index / 4})`;
          const isFirst = index === 0;
          const isLast = index === ORDER_PROGRESS_STEPS.length - 1;
          const labelClass =
            "absolute top-10 whitespace-nowrap text-sm font-extrabold " +
            (isFirst
              ? "left-0 text-left"
              : isLast
                ? "right-0 text-right"
                : "-translate-x-1/2") +
            " " +
            (completed ? "text-[#E7EDF7]" : "text-[#748197]");
          const labelStyle = isFirst || isLast ? undefined : { left: leftPos };
          return (
            <div key={stepKey}>
              <div
                className={
                  "absolute top-0 z-10 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full border text-sm font-extrabold shadow-[0_0_0_4px_rgba(15,23,42,0.95)] " +
                  (completed
                    ? toneClass.dot
                    : "border-white/15 bg-[#101827] text-[#9AA7BD]")
                }
                style={{ left: leftPos }}
              >
                {index + 1}
              </div>
              <div className={labelClass} style={labelStyle}>
                {t(`orders.progress.steps.${stepKey}`)}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-[#9AA7BD]">
        {t(`orders.progress.desc.${progress.descKey}`)}
      </p>
    </div>
  );
};

function applySseUpdate(order, event) {
  const next = { ...order };
  if (Object.prototype.hasOwnProperty.call(event, "payStatus")) {
    next.payStatus = event.payStatus;
  }
  if (Object.prototype.hasOwnProperty.call(event, "deliveryStatus")) {
    next.deliveryStatus = event.deliveryStatus;
  }
  return next;
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        d="M4 9.5v5h3.2l4.3 3.3V6.2L7.2 9.5H4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M15.2 8.4a5 5 0 0 1 0 7.2M17.6 6a8.4 8.4 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Orders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const [activeAccountOrder, setActiveAccountOrder] = useState(null);
  const [loadingAccountOrderId, setLoadingAccountOrderId] = useState(null);
  const pageSize = 10;
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const loadOrders = useCallback(
    async ({ silent = false, signal } = {}) => {
      const currentId = ++requestIdRef.current;
      if (!silent) {
        setLoading(true);
      }
      const params = { pageNum: page, pageSize };
      if (activeTab) {
        params.playerStatus = activeTab;
      }
      try {
        const res = await getOrderList(params, { signal });
        if (requestIdRef.current !== currentId) return;
        const rows = res.rows || [];
        const nextRows = rows.filter((order) =>
          matchesPlayerOrderTab(order, activeTab),
        );
        setOrders(nextRows);
        setTotal(res.total || 0);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        if (requestIdRef.current !== currentId) return;
        if (!silent) {
          setOrders([]);
          setTotal(0);
        }
      } finally {
        if (requestIdRef.current === currentId && !silent) {
          setLoading(false);
        }
      }
    },
    [page, activeTab],
  );

  useEffect(() => {
    // Cancel any in-flight request from previous render
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    loadOrders({ signal: controller.signal });
    return () => { controller.abort(); };
  }, [loadOrders]);

  const handleSseStatusChange = useCallback(
    (event) => {
      if (event.fallback) {
        loadOrders({ silent: true });
        return;
      }
      setOrders((prev) => {
        if (event.bulk) {
          const targetSet =
            Array.isArray(event.orderNos) && event.orderNos.length > 0
              ? new Set(event.orderNos)
              : null;
          return prev.map((order) => {
            const match = targetSet
              ? targetSet.has(order.orderNo)
              : isPendingPaymentStatus(order.payStatus);
            return match ? applySseUpdate(order, event) : order;
          });
        }
        return prev.map((order) =>
          order.orderNo === event.orderNo ? applySseUpdate(order, event) : order,
        );
      });
      loadOrders({ silent: true });
    },
    [loadOrders],
  );

  useOrderSse(handleSseStatusChange);

  const totalPages = Math.ceil(total / pageSize);

  const openAccountInfo = async (order) => {
    if (loadingAccountOrderId === order.id) {
      return;
    }
    if (!isAccountInfoSubmitted(order)) {
      setActiveAccountOrder(order);
      return;
    }

    setLoadingAccountOrderId(order.id);
    try {
      const res = await getOrderAccountInfo(order.id);
      setActiveAccountOrder({ ...order, accountInfo: res.data || null });
    } catch {
      setActiveAccountOrder(order);
    } finally {
      setLoadingAccountOrderId(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl overflow-x-hidden px-4 py-12 pb-28 sm:pb-12">
      <style>
        {`
          @keyframes orderAccountMarquee {
            0% { transform: translate(0, 0); }
            94.7% { transform: translate(-100%, 0); }
            100% { transform: translate(-100%, 0); }
          }
          .order-account-marquee {
            padding-left: 100%;
            animation: orderAccountMarquee 19s linear infinite;
          }
          @keyframes orderAccountPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(251,146,60,0.45); border-color: rgba(253,186,116,0.25); }
            50% { box-shadow: 0 0 8px 2px rgba(251,146,60,0.35); border-color: rgba(253,186,116,0.6); }
          }
          .order-account-pulse {
            animation: orderAccountPulse 2s ease-in-out infinite;
          }
          .orders-tab-scroll {
            scrollbar-width: none;
          }
          .orders-tab-scroll::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <OrderAccountInfoModal
        order={activeAccountOrder}
        open={Boolean(activeAccountOrder)}
        onSaved={(orderId) => {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === orderId
                ? { ...order, requiresAccountInfo: false, accountInfoStatus: "submitted" }
                : order,
            ),
          );
          setActiveAccountOrder(null);
        }}
        onClose={() => setActiveAccountOrder(null)}
      />
      <h1 className="text-3xl font-extrabold">{t("orders.title")}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
        {t("orders.subtitle")}
      </p>

      <div className="orders-tab-scroll mt-6 flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {ORDER_TABS.map((s) => (
          <button
            key={s.value}
            onClick={() => {
              setActiveTab(s.value);
              setPage(1);
            }}
            className={
              "shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold border sm:px-4 sm:py-2.5 sm:text-sm " +
              (activeTab === s.value
                ? "border-[#00FF9A]/40 bg-[#00FF9A]/10 text-[#00FF9A]"
                : "border-white/10 bg-white/5 text-[#E7EDF7] hover:border-[#00FF9A]/30")
            }
          >
            {t(`orders.tab.${s.label}`)}
          </button>
        ))}
      </div>

      {!loading && orders.filter(isAccountInfoMissing).length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-4 py-3">
          <SpeakerIcon />
          <div className="flex-1">
            <span className="text-sm font-semibold text-orange-200">
              {t("orders.accountInfo.bannerCount", { count: orders.filter(isAccountInfoMissing).length })}
            </span>
            <p className="mt-1 text-xs text-orange-300/70">
              {t("orders.accountInfo.bannerGuide")}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#9AA7BD]">
            {t("orders.loading")}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 py-12 text-center">
            <div className="text-sm text-[#9AA7BD]">
              {t("orders.empty")}
              <Link
                to="/fc26-coins"
                className="ml-1 text-[#00FF9A] hover:underline"
              >
                {t("orders.goBuy")}
              </Link>
            </div>
          </div>
        ) : (
          orders.map((o) => {
            const accountMissing = isAccountInfoMissing(o);
            const accountSubmitted = isAccountInfoSubmitted(o);
            const sbcOrder = isSbcOrder(o);
            return (
              <div
                key={o.id}
                className={
                  "overflow-hidden rounded-2xl border bg-[#0B1220]/60 p-4 sm:p-6 " +
                  (accountMissing
                    ? "border-orange-400/50 shadow-[0_0_0_1px_rgba(251,146,60,0.18),0_0_34px_rgba(251,146,60,0.08)]"
                    : "border-white/5 hover:border-white/10")
                }
              >
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 max-w-full flex-1">
                    {accountMissing && (
                      <div className="mb-3 flex w-full max-w-full items-center gap-2 overflow-hidden rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-red-300 sm:w-1/2">
                        <SpeakerIcon />
                        <div className="relative h-4 min-w-0 flex-1 overflow-hidden">
                          <span className="order-account-marquee absolute left-0 top-0 whitespace-nowrap text-xs font-semibold leading-4">
                            {t("orders.accountInfo.warning")}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex max-w-full flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-[#9AA7BD]">
                        {o.orderNo}
                      </span>
                      {isPaidPaymentStatus(o.payStatus) && (
                        <button
                          type="button"
                          onClick={() => openAccountInfo(o)}
                          title={
                            accountSubmitted
                              ? t("orders.accountInfo.viewHint")
                              : t("orders.accountInfo.fillHint")
                          }
                          className={
                            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-bold transition-colors " +
                            (accountSubmitted
                              ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-200 hover:border-cyan-300/45"
                              : "order-account-pulse border-orange-300/25 bg-orange-500/10 text-orange-300 hover:border-orange-300/55")
                          }
                        >
                          <span>
                            {t(
                              `orders.accountInfo.${
                                accountSubmitted ? "submitted" : "missing"
                              }`,
                            )}
                          </span>
                          <span className="grid h-4 w-4 place-items-center rounded-full border border-current text-[10px] leading-none">
                            i
                          </span>
                          <span className="text-xs opacity-85">
                            {accountSubmitted
                              ? t("orders.accountInfo.viewAction")
                              : t("orders.accountInfo.fillAction")}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      {o.packageName && (
                        <span className="text-xl font-extrabold">
                          {o.packageName}
                        </span>
                      )}
                      <span className="text-base font-bold text-[#9AA7BD]">{o.platform}</span>
                      {o.quantity && o.quantity > 1 && (
                        <span className="rounded-md bg-[#00FF9A]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#00FF9A]">
                          ×{o.quantity}
                        </span>
                      )}
                    </div>

                    {!sbcOrder && (
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-base text-[#9AA7BD]">
                        <span>
                          {formatCoinsK(o.coins)} {t("orders.coins")}
                        </span>
                        {o.giftCoins > 0 && (
                          <span className="font-extrabold text-[#00FF9A]">
                            +{formatCoinsK(o.giftCoins)} {t("orders.gift")}
                          </span>
                        )}
                      </div>
                    )}

                    <OrderProgress order={o} />
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1">
                    <div className="text-xl font-extrabold sm:text-2xl">
                      {formatPrice(o.price, o.currency)}
                    </div>
                    <div className="text-sm text-[#9AA7BD] sm:text-base">
                      {formatTime(o.createTime)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm disabled:opacity-30"
          >
            ‹
          </button>
          <span className="text-sm text-[#9AA7BD]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}
    </main>
  );
}
