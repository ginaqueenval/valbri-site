import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getCartItems,
  removeCartItem,
  updateCartItemQuantity,
} from "../api/cart";
import { getStoredPlayerToken } from "../utils/playerAuth.js";
import {
  clampCartQuantity,
  updateCartItemsQuantity,
} from "./cartState.js";
import { formatCoinsK, formatPrice } from "../utils/orderDisplay";

const PLATFORM_SHORT = {
  PlayStation: "PS",
  Xbox: "XBOX",
  PC: "PC",
};
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

const buildCartItemDeleteUrl = (item) =>
  `${API_BASE_URL}/valbri/cart/items/${encodeURIComponent(item.id)}`;

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443A11.5 11.5 0 0 0 3.516 4.5a.75.75 0 0 0 0 1.5h.06l.738 9.594A3 3 0 0 0 7.305 18.5h5.39a3 3 0 0 0 2.99-2.906L16.424 6h.06a.75.75 0 0 0 0-1.5A11.5 11.5 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3.75 10a.75.75 0 0 1 .75-.75h9.69l-3.22-3.22a.75.75 0 1 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H4.5A.75.75 0 0 1 3.75 10Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CartRow({
  item,
  index,
  updating,
  removing,
  onQty,
  onRemove,
  onCheckout,
  t,
}) {
  const quantity = Number(item.quantity || 1);
  const subtotal = Number(item.price || 0) * quantity;
  const unitPrice = formatPrice(item.price, item.currency);
  const subtotalText = formatPrice(subtotal, item.currency);
  const platformLabel = PLATFORM_SHORT[item.platform] || item.platform;
  return (
    <article className="package-card relative overflow-hidden rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(15,22,36,0.82),rgba(8,12,20,0.94))] p-5 transition-all duration-500 hover:border-[#00FF9A]/22 hover:shadow-[0_22px_44px_rgba(0,0,0,0.28),0_0_24px_rgba(0,255,154,0.08)] sm:p-6">
      <span className="pkg-card-glow" aria-hidden="true" />
      <span className="pkg-corner-tl" aria-hidden="true" />
      <span className="pkg-corner-br" aria-hidden="true" />

      <div className="relative flex items-start gap-4">
        {/* 序号徽章 */}
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#00FF9A]/30 bg-[#00FF9A]/[0.06] text-base font-black text-[#7BFFCA] shadow-[inset_0_0_10px_rgba(0,255,154,0.1),0_0_14px_rgba(0,255,154,0.18)] sm:h-12 sm:w-12 sm:text-lg">
          {index + 1}
        </div>

        {/* 主信息列 */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-[#00FF9A]/30 bg-[#00FF9A]/[0.08] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#7BFFCA] shadow-[0_0_10px_rgba(0,255,154,0.16)]">
              <span className="h-1 w-1 rounded-full bg-[#00FF9A] shadow-[0_0_6px_rgba(0,255,154,0.7)]" />
              {platformLabel}
            </span>
            {item.eta && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6E7B92]">
                {item.eta}
              </span>
            )}
            <span className="ml-auto hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6E7B92] sm:inline">
              {unitPrice} / {t("cart.perItem")}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-2">
            <span className="pkg-coins-gradient text-[1.95rem] font-black leading-[0.88] tracking-[-0.05em] sm:text-[2.25rem]">
              {formatCoinsK(item.coins)}
            </span>
            {item.giftCoins > 0 && (
              <span className="pkg-bonus-pill inline-flex items-center self-center rounded-full px-2.5 py-1 text-[13px] font-black tracking-[0.01em] text-[#7BFFCA]">
                +{formatCoinsK(item.giftCoins)} {t("cart.gift")}
              </span>
            )}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6E7B92] sm:hidden">
            {unitPrice} / {t("cart.perItem")}
          </div>
        </div>

        {/* 总价 */}
        <div className="shrink-0 text-right">
          <div className="pkg-price-gradient text-[1.5rem] font-black leading-none tracking-[-0.04em] sm:text-[1.75rem]">
            {subtotalText}
          </div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#6E7B92]">
            {item.currency || "USD"} × {quantity}
          </div>
        </div>
      </div>

      <div className="pkg-divider my-4 sm:my-5" />

      {/* 操作行 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded-full border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[#9AA7BD] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <button
            onClick={() => onQty(quantity - 1)}
            disabled={updating}
            aria-label="-"
            className="grid h-8 w-8 place-items-center rounded-full text-base transition hover:bg-white/8 hover:text-[#E7EDF7] disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-[24px] text-center text-sm font-bold text-[#E7EDF7]">
            {quantity}
          </span>
          <button
            onClick={() => onQty(quantity + 1)}
            disabled={updating}
            aria-label="+"
            className="grid h-8 w-8 place-items-center rounded-full text-base transition hover:bg-white/8 hover:text-[#E7EDF7] disabled:opacity-40"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRemove}
            disabled={removing}
            aria-label={t("cart.remove")}
            title={t("cart.remove")}
            className="grid h-10 w-10 place-items-center rounded-full text-[#6E7B92] transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
          >
            <TrashIcon />
          </button>
          <button
            onClick={onCheckout}
            className="cta-primary inline-flex min-h-[44px] items-center gap-1.5 px-5 text-sm"
          >
            <span>{t("cart.checkout")}</span>
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingQuantityId, setUpdatingQuantityId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  // Apple-style 删除待撤销态:乐观移除 + 5 秒 Undo Toast,过期再调用 API
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const pendingTimerRef = useRef(null);
  // 用 ref 同步 pendingRemoval / commitRemoval 最新值,避免 unmount cleanup 闭包陷阱
  const pendingRemovalRef = useRef(null);
  const commitRemovalRef = useRef(null);

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items],
  );

  const loadCart = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const res = await getCartItems();
        setItems(res.data || []);
      } catch (err) {
        setError(err.message || t("cart.loadFailed"));
        if (!silent) setItems([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleQuantityChange = async (item, nextQuantity) => {
    if (updatingQuantityId === item.id) return;
    const quantity = clampCartQuantity(nextQuantity);
    if (quantity === Number(item.quantity || 1)) return;

    setUpdatingQuantityId(item.id);
    setError("");
    setItems((currentItems) =>
      updateCartItemsQuantity(currentItems, item.id, quantity),
    );

    try {
      await updateCartItemQuantity(item.id, { quantity });
      window.dispatchEvent(new Event("cart-changed"));
    } catch (err) {
      setError(err.message || t("cart.updateFailed"));
      await loadCart({ silent: true });
    } finally {
      setUpdatingQuantityId(null);
    }
  };

  // 真正调用后端删除 API(从 pending 转为 committed)
  const commitRemoval = useCallback(
    async (item) => {
      try {
        await removeCartItem(item.id);
        window.dispatchEvent(new Event("cart-changed"));
      } catch (err) {
        // 失败时把商品塞回购物车,提示用户
        setError(err.message || t("cart.removeFailed"));
        setItems((current) => {
          if (current.some((i) => i.id === item.id)) return current;
          return [...current, item];
        });
      }
    },
    [t],
  );

  // ref 同步:始终保留最新 commitRemoval,供 unmount 使用
  useEffect(() => {
    commitRemovalRef.current = commitRemoval;
  }, [commitRemoval]);

  const commitRemovalDuringUnload = useCallback((item) => {
    const token = getStoredPlayerToken();
    const headers = token ? { "X-Player-Token": token } : {};
    try {
      void fetch(buildCartItemDeleteUrl(item), {
        method: "DELETE",
        headers,
        keepalive: true,
      });
    } catch {
      // 浏览器卸载阶段只能尽力提交,失败交由下次购物车拉取兜底
    }
  }, []);

  const flushPendingRemoval = useCallback(
    ({ keepalive = false } = {}) => {
      const pending = pendingRemovalRef.current;
      if (pendingTimerRef.current) {
        window.clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
      if (!pending?.item) {
        return;
      }
      pendingRemovalRef.current = null;
      if (keepalive) {
        commitRemovalDuringUnload(pending.item);
        return;
      }
      void commitRemovalRef.current?.(pending.item);
    },
    [commitRemovalDuringUnload],
  );

  const handleRemove = (id) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    // 记录原 index,撤销时精确 splice 回原位(否则会被 append 到末尾)
    const originalIndex = items.findIndex((i) => i.id === id);
    // 若已有 pending,先提交它,再开启新的
    if (pendingTimerRef.current && pendingRemovalRef.current) {
      flushPendingRemoval();
    }
    setError("");
    setRemovingId(id);
    // 乐观移除:立即从 UI 隐藏
    setItems((current) => current.filter((i) => i.id !== id));
    const nextPendingRemoval = { item: target, originalIndex };
    pendingRemovalRef.current = nextPendingRemoval;
    setPendingRemoval(nextPendingRemoval);
    // 5 秒后真删
    pendingTimerRef.current = window.setTimeout(() => {
      pendingTimerRef.current = null;
      setPendingRemoval((current) => {
        if (current?.item?.id === id) {
          pendingRemovalRef.current = null;
          void commitRemovalRef.current?.(current.item);
          return null;
        }
        return current;
      });
      setRemovingId(null);
    }, 5000);
  };

  const handleUndoRemove = () => {
    if (pendingTimerRef.current) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    if (pendingRemoval?.item) {
      const restored = pendingRemoval.item;
      // splice 回原 index;若 index 越界(用户在 5s 内拉新列表)则降级 append
      const targetIndex = Math.max(0, pendingRemoval.originalIndex ?? 0);
      setItems((current) => {
        if (current.some((i) => i.id === restored.id)) return current;
        const next = [...current];
        const safeIndex = Math.min(targetIndex, next.length);
        next.splice(safeIndex, 0, restored);
        return next;
      });
    }
    pendingRemovalRef.current = null;
    setPendingRemoval(null);
    setRemovingId(null);
  };

  // ref 同步:始终保留最新 pendingRemoval / commitRemoval,供 unmount 与 beforeunload 使用
  useEffect(() => {
    pendingRemovalRef.current = pendingRemoval;
  }, [pendingRemoval]);

  // 用户关闭 tab / 刷新整页时,用 keepalive 请求兜底确保删除请求到达后端
  useEffect(() => {
    const onUnload = () => {
      flushPendingRemoval({ keepalive: true });
    };
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
    };
  }, [flushPendingRemoval]);

  // SPA 内 unmount 时立即提交 pending,保证后端状态与 UI 一致
  useEffect(() => {
    return () => {
      flushPendingRemoval();
    };
  }, [flushPendingRemoval]);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:pt-14">
      <header>
        <h1 className="text-[2rem] font-black leading-[1.05] tracking-[-0.035em] sm:text-[2.5rem]">
          {t("cart.title")}
        </h1>
        {!loading && items.length > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#9AA7BD]">
            <span className="inline-flex items-center gap-1.5">
              <span className="rounded-full border border-[#00FF9A]/24 bg-[#00FF9A]/[0.06] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#7BFFCA]">
                {totalQuantity}
              </span>
              <span>{t("cart.totalItems")}</span>
            </span>
          </p>
        )}
      </header>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/22 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-3xl border border-white/5 bg-white/[0.02]"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-white/5 bg-[#0B1220]/60 py-16 text-center">
          <div className="text-sm text-[#9AA7BD]">{t("cart.empty")}</div>
          <Link
            to="/fc26-coins"
            className="mt-5 inline-flex rounded-xl bg-[#00FF9A] px-6 py-3 text-sm font-semibold text-[#070A0F] hover:bg-[#00D47E]"
          >
            {t("cart.goBuy")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          {items.map((item, idx) => (
            <CartRow
              key={item.id}
              item={item}
              index={idx}
              updating={updatingQuantityId === item.id}
              removing={removingId === item.id}
              onQty={(q) => handleQuantityChange(item, q)}
              onRemove={() => handleRemove(item.id)}
              onCheckout={() => navigate(`/checkout?cartItemId=${item.id}`)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Apple-style 5 秒 Undo Toast — 删除可撤销 */}
      {pendingRemoval && (
        <UndoToast onUndo={handleUndoRemove} t={t} />
      )}
    </main>
  );
}

function UndoToast({ onUndo, t }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-[80] flex justify-center px-4"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto relative overflow-hidden rounded-2xl border border-white/12 bg-[#0B1220]/95 shadow-[0_18px_44px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <svg viewBox="0 0 16 16" className="h-4 w-4 text-[#7BFFCA]" fill="currentColor" aria-hidden="true">
            <path d="M14 2 8.5 14 6.7 8.3 1 6.5 14 2Z" />
          </svg>
          <span className="text-sm font-semibold text-[#E7EDF7]">
            {t("cart.itemRemoved")}
          </span>
          <button
            type="button"
            onClick={onUndo}
            className="inline-flex items-center gap-1 rounded-full bg-[#00FF9A]/14 px-3 py-1 text-xs font-bold text-[#7BFFCA] transition-colors hover:bg-[#00FF9A]/22 hover:text-[#9DFFD3]"
          >
            {t("cart.undo")}
          </button>
        </div>
        {/* 5 秒倒计时进度条 */}
        <span className="absolute bottom-0 left-0 h-[3px] w-full bg-[#00FF9A]/30">
          <span
            className="block h-full bg-[#00FF9A]"
            style={{
              animation: "cart-undo-shrink 5s linear forwards",
            }}
          />
        </span>
      </div>
      <style>{`
        @keyframes cart-undo-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
