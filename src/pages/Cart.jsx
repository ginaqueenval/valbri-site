import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getCartItems,
  removeCartItem,
  updateCartItemQuantity,
} from "../api/cart";
import { getPlayerToken } from "../utils/request";
import {
  MAX_CART_QTY,
  clampCartQuantity,
  updateCartItemsQuantity,
} from "./cartState.js";

const fmtK = (n) => {
  if (!n) return "0";
  if (n < 1000) return String(n);
  const k = Math.round(n / 1000);
  return k.toLocaleString("en-US") + "K";
};

const fmtPrice = (n, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(n || 0);

export default function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingQuantityId, setUpdatingQuantityId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const loggedIn = !!getPlayerToken();

  const currencySummary = useMemo(() => {
    const summary = new Map();
    items.forEach((item) => {
      const currency = item.currency || "USD";
      const current = summary.get(currency) || 0;
      summary.set(currency, current + Number(item.price || 0) * Number(item.quantity || 0));
    });
    return Array.from(summary.entries());
  }, [items]);

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items],
  );

  const loadCart = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      setError("");
      try {
        const res = await getCartItems();
        setItems(res.data || []);
      } catch (err) {
        setError(err.message || t("cart.loadFailed"));
        if (!silent) {
          setItems([]);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [t],
  );

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login", { state: { redirectTo: "/cart" } });
      return;
    }
    loadCart();
  }, [loadCart, loggedIn, navigate]);

  const handleQuantityChange = async (item, nextQuantity) => {
    const quantity = clampCartQuantity(nextQuantity);
    const previousQuantity = Number(item.quantity || 1);
    if (quantity === previousQuantity) {
      return;
    }

    setUpdatingQuantityId(item.id);
    setError("");
    setItems((currentItems) => updateCartItemsQuantity(currentItems, item.id, quantity));

    try {
      await updateCartItemQuantity(item.id, { quantity });
      window.dispatchEvent(new Event("cart-changed"));
    } catch (err) {
      setItems((currentItems) =>
        updateCartItemsQuantity(currentItems, item.id, previousQuantity),
      );
      setError(err.message || t("cart.updateFailed"));
    } finally {
      setUpdatingQuantityId(null);
    }
  };

  const handleRemove = async (id) => {
    setRemovingId(id);
    setError("");
    try {
      await removeCartItem(id);
      await loadCart();
      window.dispatchEvent(new Event("cart-changed"));
    } catch (err) {
      setError(err.message || t("cart.removeFailed"));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold">{t("cart.title")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
            {t("cart.subtitle")}
          </p>
        </div>

        <div className="hidden rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 px-4 py-3 text-sm text-[#9AA7BD] sm:block">
          {t("cart.totalItems")}{" "}
          <span className="font-semibold text-[#E7EDF7]">{totalQuantity}</span>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 rounded-3xl border border-white/5 bg-[#0B1220]/60 py-12 text-center text-sm text-[#9AA7BD]">
          {t("cart.loading")}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-white/5 bg-[#0B1220]/60 py-12 text-center">
          <div className="text-sm text-[#9AA7BD]">{t("cart.empty")}</div>
          <Link
            to="/fc26-coins"
            className="mt-4 inline-flex rounded-xl bg-[#00FF9A] px-5 py-2.5 text-sm font-semibold text-[#070A0F] hover:bg-[#00D47E]"
          >
            {t("cart.goBuy")}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_340px]">
          <div className="grid gap-4">
            {items.map((item) => {
              const subtotal = Number(item.price || 0) * Number(item.quantity || 0);
              const quantityDisabled = updatingQuantityId === item.id;
              const removeDisabled = removingId === item.id;
              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[30px] border border-white/5 bg-[linear-gradient(180deg,rgba(15,20,33,0.98),rgba(10,15,26,0.94))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_24px_50px_rgba(0,0,0,0.18)] sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                          <span className="text-[2rem] font-black tracking-tight text-[#E7EDF7] leading-none">
                            {fmtK(item.coins)}
                          </span>
                          <span className="pb-1 text-sm font-medium text-[#C9D3E5]">
                            Coins
                          </span>
                        </div>
                        {item.giftCoins > 0 && (
                          <div className="mt-1 text-sm font-bold text-[#00FF9A]">
                            +{fmtK(item.giftCoins)} {t("cart.gift")}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-[#9AA7BD]">
                          {item.currency || "USD"}
                        </div>
                        <div className="mt-1 text-2xl font-black tracking-tight text-[#E7EDF7]">
                          {fmtPrice(subtotal, item.currency)}
                        </div>
                        <div className="mt-1 text-xs text-[#9AA7BD]">
                          {fmtPrice(item.price, item.currency)} × {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-[104px_84px_minmax(0,1fr)] items-center gap-2">
                      <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-2.5 py-2 text-[#9AA7BD]">
                        <button
                          onClick={() =>
                            handleQuantityChange(item, Number(item.quantity || 1) - 1)
                          }
                          disabled={quantityDisabled}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-lg transition hover:bg-white/5 hover:text-[#E7EDF7] disabled:opacity-50"
                        >
                          −
                        </button>
                        <span className="text-sm font-semibold text-[#E7EDF7]">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(item, Number(item.quantity || 1) + 1)
                          }
                          disabled={quantityDisabled}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-lg transition hover:bg-white/5 hover:text-[#E7EDF7] disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removeDisabled}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-semibold text-[#9AA7BD] transition hover:border-red-500/25 hover:text-red-400 disabled:opacity-50"
                      >
                        {t("cart.remove")}
                      </button>
                      <button
                        onClick={() => navigate(`/checkout?cartItemId=${item.id}`)}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[#00FF9A] px-4 py-3 text-sm font-bold text-[#070A0F] shadow-[0_12px_28px_rgba(0,255,154,0.18)] transition hover:-translate-y-[1px] hover:bg-[#00E88D]"
                      >
                        {t("cart.checkout")}
                      </button>
                    </div>
                  </div>

                  <div className="hidden sm:grid grid-cols-[44px_minmax(0,1fr)_186px] gap-4">
                    <div className="pt-1">
                      <div className="h-5 w-5 rounded-[6px] border border-white/10 bg-white/[0.03]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#00FF9A]/18 bg-[#00FF9A]/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#69FFBB]">
                          {item.platform}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-[#9AA7BD]">
                          {t("cart.eta")}: {item.eta || "-"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-end">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
                            <span className="text-[3rem] font-black leading-none tracking-[-0.06em] text-[#E7EDF7]">
                              {fmtK(item.coins)}
                            </span>
                            <span className="pb-1 text-base font-semibold uppercase tracking-[0.16em] text-[#C9D3E5]">
                              {t("cart.coins")}
                            </span>
                          </div>

                          {item.giftCoins > 0 && (
                            <div className="mt-3">
                              <span className="rounded-full border border-[#00FF9A]/16 bg-[#00FF9A]/8 px-3 py-1.5 text-sm font-bold text-[#00FF9A]">
                                +{fmtK(item.giftCoins)} {t("cart.gift")}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-4 xl:text-right">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-[#9AA7BD]">
                            {item.currency || "USD"}
                          </div>
                          <div className="mt-2 text-3xl font-black tracking-tight text-[#E7EDF7]">
                            {fmtPrice(subtotal, item.currency)}
                          </div>
                          <div className="mt-2 text-sm text-[#9AA7BD]">
                            {fmtPrice(item.price, item.currency)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center rounded-[24px] border border-white/6 bg-black/20 p-4">
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-2 rounded-[18px] border border-white/10 bg-white/[0.03] px-3 py-2 text-[#9AA7BD]">
                          <button
                            onClick={() =>
                              handleQuantityChange(item, Number(item.quantity || 1) - 1)
                            }
                            disabled={quantityDisabled}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition hover:bg-white/5 hover:text-[#E7EDF7] disabled:opacity-50"
                          >
                            −
                          </button>
                          <span className="min-w-[20px] text-center text-base font-bold text-[#E7EDF7]">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(item, Number(item.quantity || 1) + 1)
                            }
                            disabled={quantityDisabled}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition hover:bg-white/5 hover:text-[#E7EDF7] disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => navigate(`/checkout?cartItemId=${item.id}`)}
                          className="inline-flex min-h-[42px] items-center justify-center rounded-2xl bg-[#00FF9A] px-4 py-2.5 text-sm font-bold text-[#070A0F] shadow-[0_12px_24px_rgba(0,255,154,0.18)] transition hover:-translate-y-[1px] hover:bg-[#00E88D]"
                        >
                          {t("cart.checkout")}
                        </button>
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={removeDisabled}
                          className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-[#9AA7BD] transition hover:border-red-500/25 hover:text-red-400 disabled:opacity-50"
                        >
                          {t("cart.remove")}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="hidden rounded-[30px] border border-white/5 bg-[linear-gradient(180deg,rgba(15,20,33,0.98),rgba(10,15,26,0.94))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_24px_50px_rgba(0,0,0,0.18)] sm:block">
            <h2 className="text-2xl font-black tracking-tight">{t("cart.summary")}</h2>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-black/20 px-4 py-3 text-sm">
                <span className="text-[#9AA7BD]">{t("cart.totalItems")}</span>
                <span className="text-xl font-black tracking-tight">{totalQuantity}</span>
              </div>
              {currencySummary.map(([currency, amount]) => (
                <div
                  key={currency}
                  className="rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(7,13,23,0.92),rgba(7,13,23,0.75))] px-5 py-4"
                >
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#9AA7BD]">
                    {currency}
                  </div>
                  <div className="mt-2 text-3xl font-black tracking-tight text-[#00FF9A]">
                    {fmtPrice(amount, currency)}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-[#9AA7BD]">
              {t("cart.summaryHint")}
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
