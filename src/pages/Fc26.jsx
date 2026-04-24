import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPackageList } from "../api/package";
import { getOrderList } from "../api/order";
import { addCartItem } from "../api/cart";
import { getPlayerToken } from "../utils/request";
import {
  getPackageQuantity,
  getDesktopOverlayStateClasses,
  resetPackageQuantity,
  updatePackageQuantity,
} from "./fc26State";

const PLATFORMS = ["PlayStation", "Xbox", "PC"];

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
  }).format(n);

const noteLabel = (tag, t) => {
  if (!tag) return null;
  const key = `notes.${tag}`;
  const translated = t(key);
  return translated === key ? tag : translated;
};

const sortPackages = (list) =>
  [...list].sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER));

export default function Fc26() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [platform, setPlatform] = useState("PlayStation");
  const [loading, setLoading] = useState(true);
  const [actionLoadingKey, setActionLoadingKey] = useState("");
  const [feedbackState, setFeedbackState] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [hoveredPackageId, setHoveredPackageId] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  const loggedIn = !!getPlayerToken();

  useEffect(() => {
    setLoading(true);
    getPackageList({ gameId: 1, platform })
      .then((res) => {
        setPackages(sortPackages(res.data || []));
        setQuantities({});
        setHoveredPackageId(null);
        setFeedbackState(null);
      })
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, [platform]);

  useEffect(() => {
    if (!loggedIn) {
      setRecentOrders([]);
      return;
    }
    getOrderList({ pageNum: 1, pageSize: 3 })
      .then((res) => setRecentOrders(res.rows || []))
      .catch(() => setRecentOrders([]));
  }, [loggedIn]);

  useEffect(() => {
    if (!feedbackState) return undefined;
    const timeoutId = window.setTimeout(() => setFeedbackState(null), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [feedbackState]);

  const getQty = (id) => getPackageQuantity(quantities, id);
  const setQty = (id, val) => {
    setQuantities((prev) => updatePackageQuantity(prev, id, val));
  };
  const resetQty = (id) => {
    setQuantities((prev) => resetPackageQuantity(prev, id));
  };
  const handleDesktopCardEnter = (id) => {
    setHoveredPackageId(id);
  };
  const handleDesktopCardLeave = (id) => {
    setHoveredPackageId((currentId) => (currentId === id ? null : currentId));
    resetQty(id);
  };

  const requireLogin = () => {
    navigate("/login", { state: { redirectTo: location.pathname } });
  };

  const handleCartAction = async (pkg, goToCheckout = false) => {
    if (!getPlayerToken()) {
      requireLogin();
      return;
    }
    const qty = getQty(pkg.id);
    const actionKey = `${pkg.id}:${goToCheckout ? "checkout" : "cart"}`;
    setActionLoadingKey(actionKey);
    setFeedbackState(null);
    try {
      const res = await addCartItem({
        packageId: pkg.id,
        platform,
        quantity: qty,
      });
      window.dispatchEvent(new Event("cart-changed"));
      if (goToCheckout) {
        navigate(`/checkout?cartItemId=${res.data.id}`);
        return;
      }
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

  return (
    <main className="mx-auto max-w-6xl overflow-x-hidden px-4 py-12">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold">{t("fc26.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
            {t("fc26.description")}{" "}
            <span className="text-[#00FF9A] font-semibold">
              {t("fc26.descriptionHighlight")}
            </span>
            {t("fc26.descriptionEnd")}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
          <h2 className="text-lg font-bold">{t("fc26.selectPlatform")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={
                  "rounded-xl px-4 py-2 text-sm font-semibold border " +
                  (platform === p
                    ? "border-[#00FF9A]/40 bg-[#00FF9A]/10 text-[#00FF9A]"
                    : "border-white/10 bg-white/5 text-[#E7EDF7] hover:border-[#00FF9A]/30")
                }
              >
                {p}
              </button>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-bold">{t("fc26.packages")}</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {loading ? (
              <div className="py-8 text-center text-sm text-[#9AA7BD]">
                Loading...
              </div>
            ) : packages.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#9AA7BD]">
                {t("fc26.noPackages")}
              </div>
            ) : (
              packages.map((x) => {
                const qty = getQty(x.id);
                const isDesktopHovered = hoveredPackageId === x.id;
                const packageFeedback =
                  feedbackState?.packageId === x.id ? feedbackState : null;
                return (
                  <div
                    key={x.id}
                    className="relative rounded-[28px] border border-[#00FF9A]/18 bg-[linear-gradient(180deg,rgba(8,12,20,0.96),rgba(11,18,32,0.88))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(0,255,154,0.04),0_0_18px_rgba(0,255,154,0.08),0_18px_36px_rgba(0,0,0,0.14)] sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"
                  >
                    {packageFeedback && (
                      <div
                        className={`pointer-events-none absolute inset-x-4 top-3 z-20 flex items-center justify-center gap-2 rounded-[18px] border px-3 py-2 text-center text-[11px] font-semibold shadow-[0_16px_30px_rgba(0,0,0,0.22)] backdrop-blur-md transition-all duration-300 sm:hidden ${
                          packageFeedback.type === "success"
                            ? "border-[#00FF9A]/24 bg-[linear-gradient(180deg,rgba(7,20,18,0.92),rgba(9,18,24,0.9))] text-[#DFF7EB]"
                            : "border-red-400/24 bg-[linear-gradient(180deg,rgba(35,12,18,0.94),rgba(25,10,15,0.9))] text-[#FFD7DE]"
                        }`}
                      >
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${
                            packageFeedback.type === "success"
                              ? "bg-[#00FF9A]/14 text-[#00FF9A]"
                              : "bg-red-400/14 text-red-300"
                          }`}
                        >
                          {packageFeedback.type === "success" ? "✓" : "!"}
                        </span>
                        <span>{packageFeedback.message}</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-3 sm:hidden">
                      <div className="text-sm font-semibold">
                        {fmtK(x.coins)} {t("fc26.coins")}{" "}
                        {x.giftCoins > 0 && (
                          <span className="text-[#00FF9A]">
                            + {fmtK(x.giftCoins)} {t("fc26.gift")}
                          </span>
                        )}
                        {noteLabel(x.noteTag, t) && (
                          <span className="ml-2 text-xs text-[#00FF9A]">
                            {noteLabel(x.noteTag, t)}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-[#9AA7BD]">
                        {t("fc26.eta", { eta: x.eta })}
                      </div>
                      <div className="grid grid-cols-[78px_minmax(72px,1fr)_118px] items-center gap-2">
                        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-1">
                          <button
                            onClick={() => setQty(x.id, qty - 1)}
                            className="px-1 py-1.5 text-sm text-[#9AA7BD] hover:text-[#E7EDF7]"
                          >
                            −
                          </button>
                          <span className="min-w-[24px] text-center text-sm font-semibold">
                            {qty}
                          </span>
                          <button
                            onClick={() => setQty(x.id, qty + 1)}
                            className="px-1 py-1.5 text-sm text-[#9AA7BD] hover:text-[#E7EDF7]"
                          >
                            +
                          </button>
                        </div>

                        <div className="min-w-[72px] justify-self-end text-right text-base font-black tracking-tight text-[#E7EDF7] whitespace-nowrap">
                          {fmtPrice(x.price * qty, x.currency)}
                        </div>

                        <button
                          onClick={() => handleCartAction(x, false)}
                          disabled={actionLoadingKey === `${x.id}:cart`}
                          className="justify-self-end w-[118px] rounded-xl border border-[#00FF9A]/30 px-0 py-2 text-center text-[10px] font-semibold tracking-[0.01em] text-[#00FF9A] hover:bg-[#00FF9A]/10 disabled:opacity-50 whitespace-nowrap"
                        >
                          {actionLoadingKey === `${x.id}:cart`
                            ? "..."
                            : t("fc26.addToCart")}
                        </button>
                      </div>

                      <div>
                        <button
                          onClick={() => handleCartAction(x, true)}
                          disabled={actionLoadingKey === `${x.id}:checkout`}
                          className="w-full rounded-xl bg-[#00FF9A] px-4 py-2 text-center text-xs font-semibold text-[#070A0F] hover:bg-[#00D47E] disabled:opacity-50 whitespace-nowrap"
                        >
                          {actionLoadingKey === `${x.id}:checkout`
                            ? "..."
                            : t("fc26.checkoutNow")}
                        </button>
                      </div>
                    </div>

                    <div
                      className="relative hidden min-h-[260px] w-full overflow-hidden rounded-[28px] border border-white/6 bg-[radial-gradient(circle_at_top_left,rgba(0,255,154,0.1),rgba(7,10,18,0.16)_38%,rgba(255,255,255,0)_74%)] px-5 py-5 sm:flex"
                      onMouseEnter={() => handleDesktopCardEnter(x.id)}
                      onMouseLeave={() => handleDesktopCardLeave(x.id)}
                    >
                      {packageFeedback && (
                        <div
                          className={`pointer-events-none absolute inset-x-5 top-5 z-20 flex items-center justify-center gap-2 rounded-[18px] border px-4 py-2.5 text-center text-xs font-semibold shadow-[0_18px_32px_rgba(0,0,0,0.24)] backdrop-blur-md transition-all duration-300 ${
                            packageFeedback.type === "success"
                              ? "border-[#00FF9A]/24 bg-[linear-gradient(180deg,rgba(7,20,18,0.92),rgba(9,18,24,0.9))] text-[#DFF7EB]"
                              : "border-red-400/24 bg-[linear-gradient(180deg,rgba(35,12,18,0.94),rgba(25,10,15,0.9))] text-[#FFD7DE]"
                          }`}
                        >
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                              packageFeedback.type === "success"
                                ? "bg-[#00FF9A]/14 text-[#00FF9A]"
                                : "bg-red-400/14 text-red-300"
                            }`}
                          >
                            {packageFeedback.type === "success" ? "✓" : "!"}
                          </span>
                          <span>{packageFeedback.message}</span>
                        </div>
                      )}
                      <div
                        className={
                          "flex h-full w-full flex-col gap-6 transition duration-300 ease-out " +
                          (isDesktopHovered ? "scale-[0.985] opacity-35" : "")
                        }
                      >
                        <div>
                          <div className="flex min-h-6 items-start justify-between gap-3">
                            {noteLabel(x.noteTag, t) ? (
                              <span className="rounded-full border border-[#00FF9A]/18 bg-[#00FF9A]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#72FFBF]">
                                {noteLabel(x.noteTag, t)}
                              </span>
                            ) : (
                              <span />
                            )}
                            <span className="text-[11px] uppercase tracking-[0.18em] text-[#9AA7BD]">
                              {t("fc26.eta", { eta: x.eta })}
                            </span>
                          </div>

                          <div className="mt-4">
                            <div className="text-[3.05rem] font-black leading-[0.88] tracking-[-0.07em] text-[#E7EDF7]">
                              {fmtK(x.coins)}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#AAB7CB]">
                                {t("fc26.coins")}
                              </span>
                              {x.giftCoins > 0 && (
                                <span className="rounded-full border border-[#00FF9A]/12 bg-[#00FF9A]/8 px-3 py-1 text-sm font-bold text-[#00FF9A]">
                                  + {fmtK(x.giftCoins)} {t("fc26.gift")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <div className="text-[2.1rem] font-black leading-none tracking-[-0.05em] text-[#E7EDF7]">
                              {fmtPrice(x.price * qty, x.currency)}
                            </div>
                            <div className="mt-2 text-[11px] text-[#9AA7BD]">
                              {x.currency || "USD"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        className={
                          "absolute inset-x-4 bottom-4 rounded-[22px] border border-[#00FF9A]/18 bg-[linear-gradient(180deg,rgba(8,13,22,0.94),rgba(9,16,28,0.98))] p-4 shadow-[0_24px_48px_rgba(0,0,0,0.26)] backdrop-blur-sm transition duration-300 ease-out " +
                          getDesktopOverlayStateClasses(isDesktopHovered)
                        }
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[#9AA7BD]">
                            <button
                              onClick={() => setQty(x.id, qty - 1)}
                              className="text-lg hover:text-[#E7EDF7]"
                            >
                              −
                            </button>
                            <span className="min-w-[24px] text-center text-sm font-semibold text-[#E7EDF7]">
                              {qty}
                            </span>
                            <button
                              onClick={() => setQty(x.id, qty + 1)}
                              className="text-lg hover:text-[#E7EDF7]"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="text-[10px] uppercase tracking-[0.22em] text-[#72809A]">
                              {t("fc26.total")}
                            </div>
                            <div className="mt-1 text-lg font-black text-[#E7EDF7]">
                              {fmtPrice(x.price * qty, x.currency)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleCartAction(x, false)}
                            disabled={actionLoadingKey === `${x.id}:cart`}
                            className="min-w-0 rounded-2xl border border-[#00FF9A]/30 px-3 py-3 text-center text-xs font-semibold leading-tight text-[#00FF9A] hover:bg-[#00FF9A]/10 disabled:opacity-50"
                          >
                            {actionLoadingKey === `${x.id}:cart`
                              ? "..."
                              : t("fc26.addToCart")}
                          </button>

                          <button
                            onClick={() => handleCartAction(x, true)}
                            disabled={actionLoadingKey === `${x.id}:checkout`}
                            className="min-w-0 rounded-2xl bg-[#00FF9A] px-3 py-3 text-center text-xs font-black leading-tight text-[#070A0F] shadow-[0_14px_28px_rgba(0,255,154,0.14)] hover:bg-[#00D47E] disabled:opacity-50"
                          >
                            {actionLoadingKey === `${x.id}:checkout`
                              ? "..."
                              : t("fc26.checkoutNow")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          {loggedIn && (
            <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
              <h2 className="text-lg font-bold">{t("fc26.recentOrders")}</h2>
              {recentOrders.length === 0 ? (
                <div className="mt-3 text-sm text-[#9AA7BD]">
                  {t("fc26.noRecentOrders")}
                </div>
              ) : (
                <div className="mt-3 grid gap-2">
                  {recentOrders.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">
                            {fmtK(o.coins)} {t("fc26.coins")}
                            {o.giftCoins > 0 && (
                              <span className="text-[#00FF9A]">
                                {" "}
                                +{fmtK(o.giftCoins)} {t("fc26.gift")}
                              </span>
                            )}
                          </span>
                          <span
                            className={
                              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold " +
                              (o.payStatus === "1"
                                ? "bg-[#00FF9A]/10 text-[#00FF9A]"
                                : o.payStatus === "2"
                                  ? "bg-slate-500/10 text-slate-300"
                                  : o.payStatus === "3"
                                  ? "bg-red-500/10 text-red-400"
                                  : "bg-yellow-500/10 text-yellow-400")
                            }
                          >
                            {t(
                              `fc26.orderStatus.${
                                { 0: "pending", 1: "paid", 2: "cancelled", 3: "refunded" }[
                                  o.payStatus
                                ] || "pending"
                              }`,
                            )}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#9AA7BD]">
                          {fmtPrice(o.price, o.currency)}
                          {o.quantity > 1 && (
                            <span className="ml-1">×{o.quantity}</span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] text-[#9AA7BD]">
                        {new Date(o.createTime).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  <Link
                    to="/orders"
                    className="mt-1 block text-center text-xs text-[#00FF9A] hover:underline"
                  >
                    {t("fc26.viewAllOrders")}
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
            <h2 className="text-lg font-bold">{t("fc26.faqTitle")}</h2>
            <div className="mt-4 grid gap-3">
              {[
                { icon: "shield", key: "security" },
                { icon: "clock", key: "delivery" },
                { icon: "card", key: "payment" },
                { icon: "lock", key: "privacy" },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex gap-3 rounded-xl border border-white/5 bg-black/20 p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00FF9A]/10">
                    {item.icon === "shield" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4 text-[#00FF9A]"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {item.icon === "clock" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4 text-[#00FF9A]"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {item.icon === "card" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4 text-[#00FF9A]"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6zm-9 2a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {item.icon === "lock" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4 text-[#00FF9A]"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">
                      {t(`fc26.faq.${item.key}.title`)}
                    </div>
                    <div className="mt-0.5 text-xs text-[#9AA7BD] leading-5">
                      {t(`fc26.faq.${item.key}.desc`)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
