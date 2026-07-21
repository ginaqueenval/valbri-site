import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getOrderAccountInfo, getOrderList } from "../api/order";
import { getReviewByOrder } from "../api/review";
import { listRefundRequests } from "../api/refund";
import OrderAccountInfoModal from "../components/OrderAccountInfoModal";
import RefundRequestDialog from "../components/RefundRequestDialog";
import SuccessToast from "../components/SuccessToast";
import ReviewSubmitModal from "../components/ReviewSubmitModal";
import useOrderSse from "../hooks/useOrderSse";
import {
  getPlayerOrderProgress,
  isAccountInfoMissing,
  matchesPlayerOrderTab,
} from "../utils/orderProgress";
import {
  formatCoinsK,
  formatPlatform,
  formatPrice,
  formatTime,
  isAccountInfoSubmitted,
  // shouldShowDeliveryStatus anchors the same payStatus === "1" + deliveryStatus
  // visibility heuristic used by payment pages.
  // eslint-disable-next-line no-unused-vars
  shouldShowDeliveryStatus,
} from "../utils/orderDisplay";
import { ScrollReveal } from "../components/motion.jsx";
// EmptyState was a generic card-style placeholder; Orders now uses an
// Apple-style large-icon empty state inline (no border container).

const ORDER_TABS = [
  { value: "", label: "all" },
  { value: "pendingPayment", label: "pendingPayment" },
  { value: "accountRequired", label: "accountRequired" },
  { value: "processing", label: "processing" },
  { value: "completed", label: "completed" },
  { value: "closed", label: "closed" },
];

const isSbcOrder = (order) => String(order?.productType || "").toLowerCase() === "sbc";

const TONE_THEME = {
  warning: {
    text: "text-yellow-200",
    iconWrap: "border-yellow-400/26 bg-yellow-500/[0.08]",
    iconColor: "text-yellow-300",
    fill: "from-yellow-400 to-orange-300",
    actionText: "text-yellow-300 hover:text-yellow-200",
  },
  danger: {
    text: "text-red-300",
    iconWrap: "border-red-400/26 bg-red-500/[0.08]",
    iconColor: "text-red-300",
    fill: "from-red-400 to-orange-300",
    actionText: "text-red-300 hover:text-red-200",
  },
  info: {
    text: "text-cyan-200",
    iconWrap: "border-cyan-300/26 bg-cyan-400/[0.08]",
    iconColor: "text-cyan-200",
    fill: "from-cyan-300 to-[#00FF9A]",
    actionText: "text-cyan-200 hover:text-cyan-100",
  },
  processing: {
    text: "text-[#7BFFCA]",
    iconWrap: "border-[#00FF9A]/26 bg-[#00FF9A]/[0.08]",
    iconColor: "text-[#7BFFCA]",
    fill: "from-[#00FF9A] via-cyan-300 to-[#62E36E]",
    actionText: "text-[#7BFFCA] hover:text-[#00FF9A]",
  },
  success: {
    text: "text-[#7BFFCA]",
    iconWrap: "border-[#00FF9A]/26 bg-[#00FF9A]/[0.08]",
    iconColor: "text-[#7BFFCA]",
    fill: "from-[#00FF9A] to-cyan-300",
    actionText: "text-[#7BFFCA] hover:text-[#00FF9A]",
  },
  muted: {
    text: "text-[#9AA7BD]",
    iconWrap: "border-white/14 bg-white/[0.04]",
    iconColor: "text-[#9AA7BD]",
    fill: "from-slate-500 to-slate-400",
    actionText: "text-[#9AA7BD] hover:text-[#E7EDF7]",
  },
};

// === Status icons (彩色 SF Symbols 风格) ===

function ClockIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path
        d="M12 7v5.4l3.4 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocAlertIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M6 3h8.5L19 7.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path
        d="M14.5 3v4.5H19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 11v3.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.4" r="0.95" fill="currentColor" />
    </svg>
  );
}

function HourglassIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M7 3h10v3.5a5 5 0 0 1-2 4l-3 2.5 3 2.5a5 5 0 0 1 2 4V21H7v-1.5a5 5 0 0 1 2-4l3-2.5-3-2.5a5 5 0 0 1-2-4V3z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path
        d="M9 6h6M9 18h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GearIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M19.4 13.6a7.5 7.5 0 0 0 0-3.2l2-1.6-2-3.5-2.4.8a7.5 7.5 0 0 0-2.8-1.6L13.5 2h-4l-.7 2.5a7.5 7.5 0 0 0-2.8 1.6l-2.4-.8-2 3.5 2 1.6a7.5 7.5 0 0 0 0 3.2l-2 1.6 2 3.5 2.4-.8a7.5 7.5 0 0 0 2.8 1.6l.7 2.5h4l.7-2.5a7.5 7.5 0 0 0 2.8-1.6l2.4.8 2-3.5-2-1.6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function CheckCircleIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
        fill="currentColor"
        fillOpacity="0.14"
      />
      <path
        d="M8 12.5l2.6 2.6L16 9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XCircleIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path
        d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefundIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path
        d="M9 11.5l-2-2 2-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 9.5h5.5a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyReceiptIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 6h24v36l-3-2.5-3 2.5-3-2.5-3 2.5-3-2.5-3 2.5-3-2.5-3 2.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M17 16h14M17 23h14M17 30h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowRightIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        d="M3.75 10a.75.75 0 0 1 .75-.75h9.69l-3.22-3.22a.75.75 0 1 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H4.5A.75.75 0 0 1 3.75 10Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const ICON_BY_STATUS = {
  pendingPayment: ClockIcon,
  accountRequired: DocAlertIcon,
  waitingProcessing: HourglassIcon,
  processing: GearIcon,
  completed: CheckCircleIcon,
  cancelled: XCircleIcon,
  refunded: RefundIcon,
};

function StatusIcon({ statusKey, tone, dimmed = false }) {
  const Icon = ICON_BY_STATUS[statusKey] || HourglassIcon;
  const theme = TONE_THEME[tone] || TONE_THEME.info;
  const spinning = statusKey === "processing";
  return (
    <div
      className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
        dimmed ? "border-white/14 bg-white/[0.04]" : theme.iconWrap
      }`}
    >
      <Icon
        className={`h-7 w-7 ${dimmed ? "text-[#9AA7BD]" : theme.iconColor} ${
          spinning && !dimmed ? "animate-[spin_4s_linear_infinite]" : ""
        }`}
      />
    </div>
  );
}

function OrderProgressBar({ progress, tone, statusLabel, t }) {
  const theme = TONE_THEME[tone] || TONE_THEME.info;
  const total = 5;
  const currentStep = Math.max(
    1,
    Math.min(total, progress.completedStepIndexes?.length || 1),
  );
  const isProcessing = progress.statusKey === "processing";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6E7B92]">
            {t("orders.progress.stepOf", { current: currentStep, total })}
          </span>
          <span className="text-[13px] text-[#C9D3E5]">·</span>
          <span className="text-[13px] font-medium text-[#C9D3E5]">{statusLabel}</span>
        </div>
        <span className="text-[20px] font-black tracking-[-0.025em] text-[#E7EDF7] tabular-nums">
          {t("orders.progress.percent", { percent: progress.progressPercent })}
        </span>
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${theme.fill} ${
            isProcessing ? "animate-pulse" : ""
          }`}
          style={{
            width: `${progress.progressPercent}%`,
            transition: "width 0.8s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        />
      </div>
    </div>
  );
}

function AccountInfoBanner({ onFill, t }) {
  return (
    <div className="relative overflow-hidden border-b border-orange-400/18">
      <div
        className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,140,80,0.18),rgba(255,90,50,0.04)_55%,rgba(255,140,80,0.14))]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,180,120,1) 0 1px, transparent 1px 16px)",
        }}
      />
      <div className="relative flex flex-wrap items-center gap-3 px-6 py-4 sm:flex-nowrap sm:gap-4 sm:px-7 sm:py-5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-orange-400/34 bg-orange-500/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <DocAlertIcon className="h-5 w-5 text-orange-200" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-black tracking-[-0.005em] text-orange-100 sm:text-[16px]">
            {t("orders.accountInfo.bannerTitle")}
          </div>
          <p className="mt-0.5 text-[12px] leading-5 text-orange-200/82 sm:text-[13px]">
            {t("orders.accountInfo.bannerSubtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={onFill}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-500/[0.18] px-3.5 py-1.5 text-[12px] font-bold text-orange-50 transition-all hover:border-orange-300/60 hover:bg-orange-500/[0.28] hover:text-white"
        >
          {t("orders.accountInfo.bannerCta")}
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

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

function OrderCard({ order, openAccountInfo, openReview, openRefund, refundEntry, reviewEntry, t }) {
  const progress = getPlayerOrderProgress(order);
  const tone = TONE_THEME[progress.tone] || TONE_THEME.info;
  const payStatusKey = String(order?.payStatus);
  const isClosed = payStatusKey === "2" || payStatusKey === "3";
  const sbcOrder = isSbcOrder(order);
  const accountMissing = isAccountInfoMissing(order);
  const accountSubmitted = isAccountInfoSubmitted(order);
  const statusLabel = t(`orders.progress.status.${progress.statusKey}`);
  const descLabel = t(`orders.progress.desc.${progress.descKey}`);
  const isCompleted =
    String(order?.payStatus) === "1" && String(order?.deliveryStatus) === "2";
  const refundEligible = useMemo(() => {
    if (String(order?.payStatus) !== "1") return false;
    if (!isCompleted) return true;
    const paidAt = new Date(String(order?.payTime || "").replace(" ", "T"));
    if (Number.isNaN(paidAt.getTime())) return false;
    // eslint-disable-next-line react-hooks/purity -- eligibility is refreshed when the order page mounts
    return Date.now() <= paidAt.getTime() + 14 * 24 * 60 * 60 * 1000;
  }, [isCompleted, order?.payStatus, order?.payTime]);
  const reviewObj =
    reviewEntry && typeof reviewEntry === "object" ? reviewEntry.review : null;
  const reviewed = isCompleted && Boolean(reviewObj);
  const auditStatus = reviewObj?.auditStatus;
  const editableExpired = useMemo(() => {
    if (!reviewObj?.editableUntil) return false;
    const until = new Date(String(reviewObj.editableUntil).replace(" ", "T"));
    if (Number.isNaN(until.getTime())) return false;
    // eslint-disable-next-line react-hooks/purity -- 单次 mount 计算编辑窗口是否过期,无需对时钟变化反应
    return until.getTime() < Date.now();
  }, [reviewObj]);

  return (
    <article
      className={`group relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,22,36,0.62),rgba(8,12,20,0.78))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition-all duration-500 hover:border-white/14 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_28px_70px_rgba(0,0,0,0.28)] ${
        isClosed ? "opacity-55" : ""
      } ${accountMissing ? "border-orange-400/40 hover:border-orange-400/50" : ""}`}
    >
      {accountMissing && (
        <AccountInfoBanner onFill={() => openAccountInfo(order)} t={t} />
      )}

      <div className="p-6 sm:p-7">
        <header className="flex items-start gap-4">
          <StatusIcon
            statusKey={progress.statusKey}
            tone={progress.tone}
            dimmed={isClosed}
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <h3
              className={`text-[22px] font-black tracking-[-0.025em] sm:text-[24px] ${
                isClosed ? "text-[#9AA7BD]" : tone.text
              }`}
            >
              {statusLabel}
            </h3>
            <p className="mt-1 text-[14px] leading-5 text-[#9AA7BD]">{descLabel}</p>
          </div>
        </header>

        <div className="mt-6">
          <OrderProgressBar
            progress={progress}
            tone={progress.tone}
            statusLabel={statusLabel}
            t={t}
          />
        </div>

        <div className="mt-7 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            {!sbcOrder && (
              <div className="text-[17px] font-bold tracking-[-0.005em] text-[#E7EDF7]">
                <span>{formatCoinsK(order.coins)}</span>
                <span className="ml-1 text-[#C9D3E5]">
                  {t("orders.coins")}
                </span>
                {order.giftCoins > 0 && (
                  <span className="text-[#9AA7BD]">
                    <span className="mx-1.5 text-[#6E7B92]">·</span>
                    <span className="font-bold text-[#C9D3E5]">
                      +{formatCoinsK(order.giftCoins)}
                    </span>
                    <span className="ml-1 text-[#9AA7BD]">{t("orders.gift")}</span>
                  </span>
                )}
              </div>
            )}
            {sbcOrder && order.packageName && (
              <div className="line-clamp-2 text-[17px] font-bold tracking-[-0.005em] text-[#E7EDF7]">
                {order.packageName}
              </div>
            )}
            <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6E7B92]">
              <span>{formatPlatform(order.platform)}</span>
              {order.quantity && order.quantity > 1 ? (
                <>
                  <span className="mx-1.5 opacity-60">·</span>
                  <span>×{order.quantity}</span>
                </>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[17px] font-bold tracking-[-0.005em] text-[#E7EDF7] tabular-nums">
              {formatPrice(order.price, order.currency)}
            </div>
            <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6E7B92]">
              {order.currency || "USD"}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
          <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#6E7B92]">
            <span className="font-mono">{order.orderNo}</span>
            <span className="opacity-50">·</span>
            <span>{formatTime(order.createTime)}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {refundEntry ? (
              <Link to="/refund-requests" className="inline-flex min-h-8 items-center text-[12px] font-bold text-[#7BFFCA] hover:text-[#00FF9A]">
                {t("refunds.orderAction.view")}
              </Link>
            ) : refundEligible ? (
              <button type="button" onClick={() => openRefund(order)} className="inline-flex min-h-8 items-center text-[12px] font-bold text-[#7BFFCA] hover:text-[#00FF9A]">
                {isCompleted ? t("refunds.orderAction.review") : t("refunds.orderAction.request")}
              </button>
            ) : null}
            {!accountMissing &&
              String(order?.payStatus) === "1" &&
              accountSubmitted && (
                <button
                  type="button"
                  onClick={() => openAccountInfo(order)}
                  title={t("orders.accountInfo.viewHint")}
                  className={`inline-flex items-center gap-1 text-[12px] font-bold transition-colors ${tone.actionText}`}
                >
                  {t("orders.accountInfo.viewAction")}
                  <ArrowRightIcon className="h-3 w-3" />
                </button>
              )}
            {isCompleted && reviewed && auditStatus === "0" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
                {t("reviews.statusPending")}
              </span>
            )}
            {isCompleted && reviewed && auditStatus === "2" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                {t("reviews.statusRejected")}
              </span>
            )}
            {isCompleted && (
              <button
                type="button"
                onClick={() => openReview(order)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-bold transition-colors ${
                  reviewed
                    ? editableExpired
                      ? "border-white/15 bg-white/[0.04] text-[#9AA7BD] hover:border-white/25 hover:text-[#E7EDF7]"
                      : "border-[#00FF9A]/25 bg-[#00FF9A]/8 text-[#7BFFCA] hover:border-[#00FF9A]/45"
                    : "border-[#FFC233]/30 bg-[#FFC233]/8 text-[#FFE08A] hover:border-[#FFC233]/55 hover:text-[#FFC233]"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27Z" />
                </svg>
                {!reviewed
                  ? t("reviews.actionReview")
                  : editableExpired
                    ? t("reviews.actionView")
                    : t("reviews.actionEditReview")}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
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
  const [reviewModal, setReviewModal] = useState({ open: false, order: null, existing: null });
  const [reviewMap, setReviewMap] = useState({});
  const [refundMap, setRefundMap] = useState({});
  const [refundDialog, setRefundDialog] = useState({ open: false, order: null });
  // EA 信息提交/修改成功后底部 Toast 提示文案;空字符串=隐藏
  const [eaToastMessage, setEaToastMessage] = useState("");
  const reviewFetchedRef = useRef(new Set());
  const pageSize = 10;
  const requestIdRef = useRef(0);

  const loadOrders = useCallback(
    async ({ silent = false } = {}) => {
      const currentId = ++requestIdRef.current;
      if (!silent) setLoading(true);
      const params = { pageNum: page, pageSize };
      if (activeTab) params.playerStatus = activeTab;
      try {
        const res = await getOrderList(params);
        if (requestIdRef.current !== currentId) return;
        const rows = res.rows || [];
        const nextRows = rows.filter((order) =>
          matchesPlayerOrderTab(order, activeTab),
        );
        setOrders(nextRows);
        setTotal(res.total || 0);
      } catch {
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
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    listRefundRequests()
      .then((response) => {
        const next = {};
        for (const item of Array.isArray(response.data) ? response.data : []) {
          if (item.orderId != null && !next[item.orderId]) next[item.orderId] = item;
        }
        setRefundMap(next);
      })
      .catch(() => setRefundMap({}));
  }, []);

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
              : String(order?.payStatus) === "0";
            return match ? applySseUpdate(order, event) : order;
          });
        }
        return prev.map((order) =>
          order.orderNo === event.orderNo
            ? applySseUpdate(order, event)
            : order,
        );
      });
      loadOrders({ silent: true });
    },
    [loadOrders],
  );

  useOrderSse(handleSseStatusChange);

  const totalPages = Math.ceil(total / pageSize);
  const missingAccountCount = orders.filter(isAccountInfoMissing).length;

  useEffect(() => {
    const toFetch = orders.filter(
      (o) =>
        String(o.payStatus) === "1" &&
        String(o.deliveryStatus) === "2" &&
        !reviewFetchedRef.current.has(o.id),
    );
    if (toFetch.length === 0) return;
    toFetch.forEach((o) => reviewFetchedRef.current.add(o.id));
    setReviewMap((prev) => {
      const next = { ...prev };
      toFetch.forEach((o) => {
        next[o.id] = "loading";
      });
      return next;
    });
    toFetch.forEach((order) => {
      getReviewByOrder(order.id)
        .then((res) => {
          setReviewMap((prev) => ({
            ...prev,
            [order.id]: res?.data
              ? { state: "reviewed", review: res.data }
              : { state: "none" },
          }));
        })
        .catch(() => {
          setReviewMap((prev) => ({ ...prev, [order.id]: { state: "none" } }));
        });
    });
  }, [orders]);

  const openReview = async (order) => {
    const entry = reviewMap[order.id];
    if (entry && typeof entry === "object") {
      setReviewModal({ open: true, order, existing: entry.review || null });
      return;
    }
    setReviewModal({ open: true, order, existing: null });
    if (entry === undefined || entry === "loading") {
      try {
        const res = await getReviewByOrder(order.id);
        const next = res?.data
          ? { state: "reviewed", review: res.data }
          : { state: "none" };
        reviewFetchedRef.current.add(order.id);
        setReviewMap((prev) => ({ ...prev, [order.id]: next }));
        if (next.review) {
          setReviewModal((prev) =>
            prev.open && prev.order?.id === order.id
              ? { ...prev, existing: next.review }
              : prev,
          );
        }
      } catch {
        setReviewMap((prev) => ({ ...prev, [order.id]: { state: "none" } }));
      }
    }
  };

  const closeReview = () => {
    setReviewModal({ open: false, order: null, existing: null });
  };

  const handleReviewSaved = (saved) => {
    const orderId = reviewModal.order?.id;
    if (orderId && saved) {
      setReviewMap((prev) => ({
        ...prev,
        [orderId]: { state: "reviewed", review: saved },
      }));
    }
  };

  const openAccountInfo = async (order) => {
    if (loadingAccountOrderId === order.id) return;
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
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:pt-14">
      <style>
        {`
          .orders-tabs::-webkit-scrollbar { display: none; }
          .orders-tabs { scrollbar-width: none; }
        `}
      </style>

      <ReviewSubmitModal
        open={reviewModal.open}
        order={reviewModal.order}
        existing={reviewModal.existing}
        onClose={closeReview}
        onSaved={handleReviewSaved}
      />

      <RefundRequestDialog
        open={refundDialog.open}
        order={refundDialog.order}
        onClose={() => setRefundDialog({ open: false, order: null })}
        onSubmitted={(request) => {
          if (request?.orderId != null) setRefundMap((current) => ({ ...current, [request.orderId]: request }));
          setEaToastMessage(t("refunds.submitted"));
        }}
      />

      <OrderAccountInfoModal
        order={activeAccountOrder}
        open={Boolean(activeAccountOrder)}
        onSaved={(orderId, meta) => {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === orderId
                ? {
                    ...order,
                    requiresAccountInfo: false,
                    accountInfoStatus: "submitted",
                  }
                : order,
            ),
          );
          setActiveAccountOrder(null);
          // Apple snackbar 同源底部 toast — 新提交与修改两套文案
          setEaToastMessage(
            meta?.isEdit
              ? t("orderAccount.editSuccess")
              : t("orderAccount.submitSuccess"),
          );
        }}
        onClose={() => setActiveAccountOrder(null)}
      />

      <SuccessToast
        message={eaToastMessage}
        duration={3000}
        onDismiss={() => setEaToastMessage("")}
      />

      <header className="reveal-up">
        <h1 className="text-[2rem] font-black leading-[1.05] tracking-[-0.035em] sm:text-[2.5rem]">
          {t("orders.title")}
        </h1>
      </header>

      <div
        role="tablist"
        className="orders-tabs reveal-up mt-7 -mx-4 flex gap-1.5 overflow-x-auto rounded-full px-4 sm:mx-0 sm:px-0"
      >
        <div className="inline-flex gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
          {ORDER_TABS.map((s) => (
            <button
              key={s.value}
              role="tab"
              aria-selected={activeTab === s.value}
              onClick={() => {
                setActiveTab(s.value);
                setPage(1);
              }}
              className={
                "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:text-sm " +
                (activeTab === s.value
                  ? "bg-[#00FF9A]/14 text-[#00FF9A] shadow-[0_0_0_1px_rgba(0,255,154,0.18)]"
                  : "text-[#9AA7BD] hover:text-[#E7EDF7]")
              }
            >
              {t(`orders.tab.${s.label}`)}
            </button>
          ))}
        </div>
      </div>

      {!loading && missingAccountCount > 0 && (
        <div className="reveal-fade mt-6 flex items-start gap-3 rounded-2xl border border-orange-400/26 bg-orange-500/[0.07] px-4 py-3.5">
          <DocAlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-orange-100">
              {t("orders.accountInfo.bannerCount", {
                count: missingAccountCount,
              })}
            </div>
            <p className="mt-0.5 text-xs text-orange-200/70">
              {t("orders.accountInfo.bannerGuide")}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5">
        {loading ? (
          <>
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-[28px] border border-white/5 bg-white/[0.02]"
              />
            ))}
          </>
        ) : orders.length === 0 ? (
          <div className="reveal-up flex flex-col items-center px-6 pb-8 pt-16 text-center sm:pt-24">
            <div className="grid h-24 w-24 place-items-center rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,154,0.14),rgba(15,22,36,0.6)_72%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_22px_50px_rgba(0,255,154,0.08)] sm:h-28 sm:w-28">
              <EmptyReceiptIcon className="h-11 w-11 text-[#7BFFCA] sm:h-12 sm:w-12" />
            </div>
            <h3 className="mt-7 text-[22px] font-black tracking-[-0.025em] text-[#E7EDF7] sm:text-[26px]">
              {t(
                `orders.empty.title.${activeTab || "all"}`,
                t("orders.empty.title.all"),
              )}
            </h3>
            <p className="mt-3 max-w-md text-[14px] leading-6 text-[#9AA7BD] sm:text-[15px]">
              {t(
                `orders.empty.desc.${activeTab || "all"}`,
                t("orders.empty.desc.all"),
              )}
            </p>
            <Link
              to="/fc26-coins"
              className="cta-primary mt-8 inline-flex items-center gap-1.5 px-6 py-3 text-sm"
            >
              {t("orders.goBuy")}
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {orders.map((order, idx) => {
              const entry = reviewMap[order.id];
              const reviewEntry =
                entry && typeof entry === "object" ? entry : null;
              return (
                <ScrollReveal key={order.id} delay={idx * 40} threshold={0.1}>
                  <OrderCard
                    order={order}
                    openAccountInfo={openAccountInfo}
                    openReview={openReview}
                    openRefund={(selectedOrder) => setRefundDialog({ open: true, order: selectedOrder })}
                    refundEntry={refundMap[order.id]}
                    reviewEntry={reviewEntry}
                    t={t}
                  />
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[#9AA7BD] transition-colors hover:border-[#00FF9A]/30 hover:text-[#E7EDF7] disabled:opacity-30"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-[#9AA7BD]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[#9AA7BD] transition-colors hover:border-[#00FF9A]/30 hover:text-[#E7EDF7] disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}
    </main>
  );
}
