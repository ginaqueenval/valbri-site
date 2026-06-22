import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPackageList } from "../api/package";
import { getSbcPackageList } from "../api/sbcPackage";
import { addCartItem } from "../api/cart";
import { getStoredPlayerToken as getPlayerToken } from "../utils/playerAuth.js";
import {
  getPackageQuantity,
  resetPackageQuantity,
  updatePackageQuantity,
} from "./fc26State";
import {
  COIN_PRODUCT_TYPE,
  SBC_PRODUCT_TYPE,
  buildCartItemPayload,
  getDefaultPlatform,
  getPlatformDisplayMeta,
  getPlatformsForProductType,
  getProductTypeDisplayMeta,
} from "./fc26ProductTypes";
import { formatCoinsK, formatPrice } from "../utils/orderDisplay";
import { resolveNoteTag, sortPackages } from "../utils/packageDisplay";
import NoteBadge from "../components/NoteBadge.jsx";
import PurchaseNotesSection from "../components/PurchaseNotesSection.jsx";
// 玩家评价 section 已迁移至首页(HomeReviewsSection),Fc26 套餐页不再展示
// 购买须知 section 从首页移入,以"看完套餐 → 阅须知 → 加购"贴近实际决策动线

// Outgoing layer lifetime must cover the slowest staggered card-out animation.
// Last card delay (~108ms) + duration (380ms) ≈ 490ms, padded for safety.
const CROSSFADE_MS = 520;

const PLATFORM_SHORT = {
  PlayStation: "PS",
  Xbox: "XBOX",
  PC: "PC",
  "PS/Xbox": "PS/XBOX",
};

function CoinIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        fill="currentColor"
        opacity="0.18"
      />
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M8 4.6v6.8M5.4 6.4c.7-.7 1.6-1.1 2.6-1.1 1.2 0 2 .55 2 1.5 0 .85-.6 1.25-1.7 1.5-1.45.32-2.2.78-2.2 1.55 0 1 .8 1.6 2 1.6 1 0 1.9-.4 2.6-1.1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SbcSelectorIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="9" cy="9" r="8" fill="currentColor" opacity="0.16" />
      <circle cx="9" cy="9" r="7.2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="9" cy="6.5" r="2.1" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M4.4 12.9c.8-2 2.4-3.1 4.6-3.1s3.8 1.1 4.6 3.1M4.6 7.6c.3-1 1.2-1.7 2.2-1.8M11.2 5.8c1.1.1 1.9.8 2.2 1.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlatformIcon({ icon, className = "" }) {
  if (icon === "pc") {
    return (
      <svg
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
        className={className}
      >
        <rect
          x="3.2"
          y="3.8"
          width="11.6"
          height="8.2"
          rx="1.4"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M7.4 14.2h3.2M9 12v2.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "playstation") {
    return (
      <svg
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
        className={className}
      >
        <path
          d="M7.3 13.7V3.9c0-.5.4-.8.9-.7l2.6.8c1.4.4 2.2 1.3 2.2 2.6 0 1.7-1.2 2.6-3.1 2.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.1 11.5c1-.7 2-1.1 3.2-1.3M9.7 11c1.5-.3 2.8-.2 4.2.4.6.2.6.8 0 1.1-1.8 1-4.5 1.6-7.1 1.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "xbox") {
    return (
      <svg
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
        className={className}
      >
        <circle cx="9" cy="9" r="6.6" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M5.2 5.8c1.1.2 2.5 1.3 3.8 2.8 1.3-1.5 2.7-2.6 3.8-2.8M5.8 13.1c.8-1.6 2-3.1 3.2-4.5 1.2 1.4 2.4 2.9 3.2 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="3"
        y="6"
        width="12"
        height="7.2"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6.4 8.3v2.4M5.2 9.5h2.4M11.5 8.5h.1M13.2 10.4h.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PackageCard({
  pkg,
  qty,
  feedback,
  actionLoadingKey,
  onQty,
  onAdd,
  onCheckout,
  t,
  platform,
}) {
  const totalPrice = formatPrice(pkg.price * qty, pkg.currency);
  const platformLabel = PLATFORM_SHORT[platform] || platform;
  return (
    <article className="package-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(15,22,36,0.82),rgba(8,12,20,0.94))] p-4 transition-all duration-500 hover:border-[#00FF9A]/26 hover:shadow-[0_0_0_1px_rgba(0,255,154,0.08),0_22px_44px_rgba(0,0,0,0.28),0_0_28px_rgba(0,255,154,0.12)]">
      <span className="pkg-card-glow" aria-hidden="true" />
      <span className="pkg-corner-tl" aria-hidden="true" />
      <span className="pkg-corner-br" aria-hidden="true" />

      {feedback && (
        <div
          key={`${feedback.packageId}-${feedback.type}-${feedback.message}`}
          className={
            "pkg-feedback pointer-events-none absolute inset-x-3 top-2.5 z-20 flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-center text-[10px] font-semibold backdrop-blur-md " +
            (feedback.type === "success"
              ? "border-[#00FF9A]/30 bg-[#00FF9A]/14 text-[#7BFFCA] shadow-[0_0_18px_rgba(0,255,154,0.22)]"
              : "border-red-400/24 bg-red-500/14 text-[#FFB3B8]")
          }
        >
          <span>{feedback.type === "success" ? "✓" : "!"}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 顶部带：平台徽章 + 营销徽章 + ETA（始终单行） */}
      <div className="relative flex items-center justify-between gap-1.5">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-[#00FF9A]/30 bg-[#00FF9A]/[0.08] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#7BFFCA] shadow-[0_0_10px_rgba(0,255,154,0.16)]">
            <span className="h-1 w-1 rounded-full bg-[#00FF9A] shadow-[0_0_6px_rgba(0,255,154,0.7)]" />
            {platformLabel}
          </span>
          {resolveNoteTag(pkg.noteTag) ? (
            <NoteBadge tag={pkg.noteTag} />
          ) : null}
        </div>
        <span className="shrink-0 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.14em] text-[#6E7B92]">
          {pkg.eta}
        </span>
      </div>

      {/* 主金币区 — 金币与赠送同行 */}
      <div className="relative mt-3">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-2">
          <span className="pkg-coins-gradient text-[2.4rem] font-black leading-[0.86] tracking-normal">
            {formatCoinsK(pkg.coins)}
          </span>
          {pkg.giftCoins > 0 && (
            <span className="pkg-bonus-pill inline-flex items-center self-center rounded-full px-2.5 py-1 text-[13px] font-black tracking-[0.01em] text-[#7BFFCA]">
              +{formatCoinsK(pkg.giftCoins)} {t("fc26.gift")}
            </span>
          )}
        </div>
      </div>

      {/* 微妙渐变分隔 */}
      <div className="pkg-divider my-3.5" aria-hidden="true" />

      {/* 价格 + 数量步进 */}
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="pkg-price-gradient truncate text-[1.6rem] font-black leading-none tracking-normal">
            {totalPrice}
          </div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.24em] text-[#6E7B92]">
            {pkg.currency || "USD"}
          </div>
        </div>

        <div className="flex shrink-0 items-center rounded-full border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[#9AA7BD] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <button
            onClick={() => onQty(pkg.id, qty - 1)}
            aria-label="-"
            className="grid h-6 w-6 place-items-center rounded-full text-sm transition hover:bg-white/8 hover:text-[#E7EDF7]"
          >
            −
          </button>
          <span className="min-w-[18px] text-center text-xs font-bold text-[#E7EDF7]">
            {qty}
          </span>
          <button
            onClick={() => onQty(pkg.id, qty + 1)}
            aria-label="+"
            className="grid h-6 w-6 place-items-center rounded-full text-sm transition hover:bg-white/8 hover:text-[#E7EDF7]"
          >
            +
          </button>
        </div>
      </div>

      {/* 双按钮 */}
      <div className="mt-4 grid grid-cols-2 gap-1.5">
        <button
          onClick={onAdd}
          disabled={actionLoadingKey === `${pkg.id}:cart`}
          className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full border border-[#00FF9A]/30 bg-[#00FF9A]/[0.05] px-2 text-[11px] font-bold text-[#7BFFCA] transition-all hover:bg-[#00FF9A]/12 hover:text-[#8DFFC9] disabled:opacity-50"
        >
          {actionLoadingKey === `${pkg.id}:cart` ? "..." : t("fc26.addToCart")}
        </button>
        <button
          onClick={onCheckout}
          disabled={actionLoadingKey === `${pkg.id}:checkout`}
          className="cta-primary h-10 whitespace-nowrap px-2 text-[11px]"
        >
          {actionLoadingKey === `${pkg.id}:checkout`
            ? "..."
            : t("fc26.checkoutNow")}
        </button>
      </div>
    </article>
  );
}

function ProductTypeTabs({ productType, onChange, t }) {
  const tabs = [
    { value: COIN_PRODUCT_TYPE, label: t("fc26.productTypeCoins") },
    { value: SBC_PRODUCT_TYPE, label: t("fc26.productTypeSbc") },
  ];

  return (
    <div
      role="tablist"
      aria-label={t("fc26.selectProductType")}
      className="inline-flex w-full rounded-2xl border border-white/10 bg-[#111821] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_34px_rgba(0,0,0,0.16)] sm:w-auto"
    >
      {tabs.map((tab) => {
        const meta = getProductTypeDisplayMeta(tab.value);
        const active = productType === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={
              "flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-black transition-all sm:flex-none sm:px-5 " +
              (active
                ? "bg-[#00FF9A] text-[#06140F] shadow-[0_14px_28px_rgba(0,255,154,0.18)]"
                : "text-[#9AA7BD] hover:bg-white/[0.04] hover:text-[#E7EDF7]")
            }
          >
            {meta.icon === "coin" ? (
              <CoinIcon className="h-4 w-4" />
            ) : (
              <SbcSelectorIcon className="h-4 w-4" />
            )}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PlatformTabs({ platforms, platform, outgoing, onChange, t }) {
  return (
    <div
      role="tablist"
      aria-label={t("fc26.selectPlatform")}
      className="grid w-full grid-cols-2 gap-2 sm:inline-grid sm:w-auto sm:auto-cols-fr sm:grid-flow-col"
    >
      {platforms.map((p) => {
        const meta = getPlatformDisplayMeta(p);
        const active = platform === p;
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p)}
            disabled={!!outgoing && p !== platform}
            className={
              "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition-all sm:min-w-[8.5rem] " +
              (active
                ? "border-[#00FF9A]/70 bg-[#00FF9A] text-[#06140F] shadow-[0_14px_28px_rgba(0,255,154,0.18)]"
                : "border-white/10 bg-[#111821] text-[#C8D2E3] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[#00FF9A]/28 hover:bg-white/[0.05] hover:text-[#E7EDF7] disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-[#111821] disabled:hover:text-[#C8D2E3]")
            }
          >
            <PlatformIcon icon={meta.icon} className="h-4 w-4" />
            <span>{meta.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

function SbcImage({ pkg, t }) {
  if (!pkg.imageUrl) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-white/8 bg-[radial-gradient(circle_at_50%_35%,rgba(0,255,154,0.16),rgba(10,17,26,0.94)_62%)] text-sm font-black uppercase tracking-[0.18em] text-[#7BFFCA] sm:h-36">
        SBC
      </div>
    );
  }

  return (
    <div className="flex h-32 items-center justify-center overflow-hidden rounded-xl border border-white/8 bg-[linear-gradient(160deg,rgba(49,57,70,0.8),rgba(16,21,29,0.96)_58%,rgba(231,237,247,0.12))] sm:h-36">
      <img
        src={pkg.imageUrl}
        alt={pkg.title || t("fc26.productTypeSbc")}
        className="h-full w-full object-contain p-2.5"
        loading="lazy"
      />
    </div>
  );
}

function SbcPackageCard({ pkg, t, feedback, actionLoadingKey, onAdd, onCheckout }) {
  return (
    <article className="package-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(15,22,36,0.82),rgba(8,12,20,0.94))] p-4 transition-all duration-500 hover:border-[#00FF9A]/26 hover:shadow-[0_0_0_1px_rgba(0,255,154,0.08),0_22px_44px_rgba(0,0,0,0.28),0_0_28px_rgba(0,255,154,0.12)]">
      <span className="pkg-card-glow" aria-hidden="true" />
      <span className="pkg-corner-tl" aria-hidden="true" />
      <span className="pkg-corner-br" aria-hidden="true" />

      {feedback && (
        <div
          key={`${feedback.packageId}-${feedback.type}-${feedback.message}`}
          className={
            "pkg-feedback pointer-events-none absolute inset-x-3 top-2.5 z-20 flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-center text-[10px] font-semibold backdrop-blur-md " +
            (feedback.type === "success"
              ? "border-[#00FF9A]/30 bg-[#00FF9A]/14 text-[#7BFFCA] shadow-[0_0_18px_rgba(0,255,154,0.22)]"
              : "border-red-400/24 bg-red-500/14 text-[#FFB3B8]")
          }
        >
          <span>{feedback.type === "success" ? "✓" : "!"}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      <SbcImage pkg={pkg} t={t} />

      <div
        className="mt-4 min-h-[2.65rem] text-[1rem] font-black leading-tight text-[#E7EDF7]"
        title={pkg.title || ""}
      >
        <span className="line-clamp-2">{pkg.title}</span>
      </div>

      <div className="pkg-divider my-3" aria-hidden="true" />

      <div className="mt-auto flex items-end justify-between gap-3 pt-1">
        <div className="min-w-0">
          <div className="pkg-price-gradient truncate text-[1.65rem] font-black leading-none tracking-normal">
            {formatPrice(pkg.price, pkg.currency)}
          </div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.24em] text-[#6E7B92]">
            {pkg.currency || "USD"}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onAdd}
          disabled={actionLoadingKey === `${pkg.id}:cart`}
          className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full border border-[#00FF9A]/30 bg-[#00FF9A]/[0.05] px-2 text-[11px] font-bold text-[#7BFFCA] transition-all hover:bg-[#00FF9A]/12 hover:text-[#8DFFC9] disabled:opacity-50"
        >
          {actionLoadingKey === `${pkg.id}:cart` ? "..." : t("fc26.addToCart")}
        </button>
        <button
          type="button"
          onClick={onCheckout}
          disabled={actionLoadingKey === `${pkg.id}:checkout`}
          className="cta-primary h-10 whitespace-nowrap px-2 text-[11px]"
        >
          {actionLoadingKey === `${pkg.id}:checkout`
            ? "..."
            : t("fc26.checkoutNow")}
        </button>
      </div>
    </article>
  );
}

function GridBody({ loading, packages, t, feedbackState, getQty, setQty, handleCartAction, actionLoadingKey, platform }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]"
          />
        ))}
      </div>
    );
  }
  if (packages.length === 0) {
    return (
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center text-sm text-[#9AA7BD]">
        {t("fc26.noPackages")}
      </div>
    );
  }
  return (
    <div className="platform-grid-animated grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {packages.map((x) => (
        <PackageCard
          key={x.id}
          pkg={x}
          qty={getQty(x.id)}
          feedback={feedbackState?.packageId === x.id ? feedbackState : null}
          actionLoadingKey={actionLoadingKey}
          onQty={setQty}
          onAdd={() => handleCartAction(x, false)}
          onCheckout={() => handleCartAction(x, true)}
          t={t}
          platform={platform}
        />
      ))}
    </div>
  );
}

function SbcGridBody({ loading, packages, t, feedbackState, handleCartAction, actionLoadingKey }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]"
          />
        ))}
      </div>
    );
  }
  if (packages.length === 0) {
    return (
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] py-16 text-center text-sm text-[#9AA7BD]">
        {t("fc26.noSbcPackages")}
      </div>
    );
  }
  return (
    <div className="platform-grid-animated grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {packages.map((pkg) => (
        <SbcPackageCard
          key={pkg.id}
          pkg={pkg}
          t={t}
          feedback={feedbackState?.packageId === pkg.id ? feedbackState : null}
          actionLoadingKey={actionLoadingKey}
          onAdd={() => handleCartAction(pkg, false)}
          onCheckout={() => handleCartAction(pkg, true)}
        />
      ))}
    </div>
  );
}

function ProductGridBody({
  productType,
  loading,
  packages,
  t,
  feedbackState,
  getQty,
  setQty,
  handleCartAction,
  actionLoadingKey,
  platform,
}) {
  if (productType === SBC_PRODUCT_TYPE) {
    return (
      <SbcGridBody
        loading={loading}
        packages={packages}
        t={t}
        feedbackState={feedbackState}
        handleCartAction={handleCartAction}
        actionLoadingKey={actionLoadingKey}
      />
    );
  }
  return (
    <GridBody
      loading={loading}
      packages={packages}
      t={t}
      feedbackState={feedbackState}
      getQty={getQty}
      setQty={setQty}
      handleCartAction={handleCartAction}
      actionLoadingKey={actionLoadingKey}
      platform={platform}
    />
  );
}

export default function Fc26() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [productType, setProductType] = useState(COIN_PRODUCT_TYPE);
  const [platform, setPlatform] = useState(getDefaultPlatform(COIN_PRODUCT_TYPE));
  const [loading, setLoading] = useState(true);
  const [actionLoadingKey, setActionLoadingKey] = useState("");
  const [feedbackState, setFeedbackState] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [outgoing, setOutgoing] = useState(null); // 退场层快照
  const [layerKey, setLayerKey] = useState(0); // 入场层重挂 key
  const requestIdRef = useRef(0);
  const outgoingTimerRef = useRef(null);

  const loadPackages = useCallback((targetProductType, targetPlatform) => {
    const currentId = ++requestIdRef.current;
    const request =
      targetProductType === SBC_PRODUCT_TYPE
        ? getSbcPackageList({ gameId: 1, platform: targetPlatform })
        : getPackageList({ gameId: 1, platform: targetPlatform });
    request
      .then((res) => {
        if (currentId !== requestIdRef.current) return;
        const nextPackages = res.data || [];
        setPackages(
          targetProductType === SBC_PRODUCT_TYPE
            ? nextPackages
            : sortPackages(nextPackages),
        );
        setLoading(false);
      })
      .catch(() => {
        if (currentId !== requestIdRef.current) return;
        setPackages([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadPackages(productType, platform);
  }, [productType, platform, loadPackages]);

  useEffect(() => {
    if (!feedbackState) return undefined;
    const timeoutId = window.setTimeout(() => setFeedbackState(null), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [feedbackState]);

  useEffect(() => {
    return () => {
      if (outgoingTimerRef.current) {
        window.clearTimeout(outgoingTimerRef.current);
      }
    };
  }, []);

  const getQty = (id) => getPackageQuantity(quantities, id);
  const setQty = (id, val) => {
    setQuantities((prev) => updatePackageQuantity(prev, id, val));
  };

  const handlePlatformChange = (nextPlatform) => {
    if (nextPlatform === platform) return;
    // Block re-entry while the outgoing layer is still animating to avoid
    // stacking multiple snapshots and producing a "ghost trail".
    if (outgoing) return;

    // 1. 把当前帧快照塞进退场层（同步）
    const snapshot = {
      loading: false,
      packages,
      feedbackState,
      quantities,
      platform,
      productType,
    };
    setOutgoing(snapshot);

    // 2. 立刻清空主层并切平台
    setPackages([]);
    setLoading(true);
    setQuantities({});
    setFeedbackState(null);
    setLayerKey((k) => k + 1);
    setPlatform(nextPlatform);

    // 3. 退场动画结束后回收快照
    if (outgoingTimerRef.current) {
      window.clearTimeout(outgoingTimerRef.current);
    }
    outgoingTimerRef.current = window.setTimeout(() => {
      setOutgoing(null);
      outgoingTimerRef.current = null;
    }, CROSSFADE_MS);
  };

  const handleProductTypeChange = (nextProductType) => {
    if (nextProductType === productType) return;
    if (outgoing) return;

    const snapshot = {
      loading: false,
      packages,
      feedbackState,
      quantities,
      platform,
      productType,
    };
    setOutgoing(snapshot);

    setPackages([]);
    setLoading(true);
    setQuantities({});
    setFeedbackState(null);
    setLayerKey((k) => k + 1);
    setProductType(nextProductType);
    setPlatform(getDefaultPlatform(nextProductType));

    if (outgoingTimerRef.current) {
      window.clearTimeout(outgoingTimerRef.current);
    }
    outgoingTimerRef.current = window.setTimeout(() => {
      setOutgoing(null);
      outgoingTimerRef.current = null;
    }, CROSSFADE_MS);
  };

  const requireLogin = () => {
    navigate("/login", { state: { redirectTo: location.pathname } });
  };

  const handleCartAction = async (pkg, goToCheckout = false) => {
    if (!getPlayerToken()) {
      requireLogin();
      return;
    }
    const qty = productType === SBC_PRODUCT_TYPE ? 1 : getQty(pkg.id);
    const actionKey = `${pkg.id}:${goToCheckout ? "checkout" : "cart"}`;
    setActionLoadingKey(actionKey);
    setFeedbackState(null);
    try {
      const res = await addCartItem(buildCartItemPayload({
        pkg,
        productType,
        platform,
        quantity: qty,
      }));
      window.dispatchEvent(new Event("cart-changed"));
      if (goToCheckout) {
        navigate(`/checkout?cartItemId=${res.data.id}`);
        return;
      }
      setQuantities((prev) => resetPackageQuantity(prev, pkg.id));
      setFeedbackState({
        packageId: pkg.id,
        type: "success",
        message: t("fc26.addedToCart"),
      });
      window.dispatchEvent(new Event("cart-feedback"));
    } catch (err) {
      setFeedbackState({
        packageId: pkg.id,
        type: "error",
        message: err.message || t("fc26.addToCartFailed"),
      });
    } finally {
      setActionLoadingKey("");
    }
  };

  const noopQty = () => {};
  const noopAction = async () => {};
  const activePlatforms = getPlatformsForProductType(productType);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:pt-14">
      <header className="reveal-up">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00FF9A]/22 bg-[#00FF9A]/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7BFFCA]">
            FC26 · Ultimate Team
          </div>
          <h1 className="mt-4 text-[2rem] font-black leading-[1.05] tracking-normal sm:text-[2.5rem]">
            {t("fc26.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9AA7BD] sm:text-base">
            {t("fc26.description")}{" "}
            <span className="font-bold text-[#00FF9A]">
              {t("fc26.descriptionHighlight")}
            </span>{" "}
            {t("fc26.descriptionEnd")}
          </p>
        </div>
      </header>

      <section className="reveal-up mt-8 rounded-3xl border border-white/6 bg-[#0A111A] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.18)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 text-sm font-black text-[#E7EDF7]">
              {t("fc26.selectProductType")}
            </div>
            <ProductTypeTabs
              productType={productType}
              onChange={handleProductTypeChange}
              t={t}
            />
          </div>
          <div>
            <div className="mb-3 text-sm font-black text-[#E7EDF7]">
              {t("fc26.selectPlatform")}
            </div>
            <PlatformTabs
              platforms={activePlatforms}
              platform={platform}
              outgoing={outgoing}
              onChange={handlePlatformChange}
              t={t}
            />
          </div>
        </div>
      </section>

      <div className="platform-stage mt-10" style={{ minHeight: "26rem" }}>
        {outgoing && (
          <div
            className="platform-layer platform-layer-out"
            aria-hidden="true"
          >
            <ProductGridBody
              productType={outgoing.productType}
              loading={outgoing.loading}
              packages={outgoing.packages}
              t={t}
              feedbackState={outgoing.feedbackState}
              getQty={(id) => getPackageQuantity(outgoing.quantities, id)}
              setQty={noopQty}
              handleCartAction={noopAction}
              actionLoadingKey=""
              platform={outgoing.platform}
            />
          </div>
        )}

        <div key={layerKey} className="platform-layer platform-layer-in">
          <ProductGridBody
            productType={productType}
            loading={loading}
            packages={packages}
            t={t}
            feedbackState={feedbackState}
            getQty={getQty}
            setQty={setQty}
            handleCartAction={handleCartAction}
            actionLoadingKey={actionLoadingKey}
            platform={platform}
          />
        </div>
      </div>

      {productType === COIN_PRODUCT_TYPE && <PurchaseNotesSection />}
    </main>
  );
}
