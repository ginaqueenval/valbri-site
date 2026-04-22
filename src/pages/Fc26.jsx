import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPackageList } from "../api/package";
import { getOrderList } from "../api/order";
import { getPlayerToken } from "../utils/request";

const PLATFORMS = ["PlayStation", "Xbox", "PC"];
const MAX_QTY = 10;

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
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [platform, setPlatform] = useState("PlayStation");
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);

  const loggedIn = !!getPlayerToken();

  useEffect(() => {
    setLoading(true);
    getPackageList({ gameId: 1, platform })
      .then((res) => {
        setPackages(sortPackages(res.data || []));
        setQuantities({});
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

  const getQty = (id) => quantities[id] || 1;
  const setQty = (id, val) => {
    const n = Math.max(1, Math.min(MAX_QTY, val));
    setQuantities((prev) => ({ ...prev, [id]: n }));
  };

  const goCheckout = (pkg) => {
    const qty = getQty(pkg.id);
    const state = {
      platform,
      packageId: pkg.id,
      coins: pkg.coins * qty,
      giftCoins: pkg.giftCoins * qty,
      price: pkg.price * qty,
      eta: pkg.eta,
      widgetUrl: pkg.widgetUrl,
      packageName: pkg.name,
      currency: pkg.currency || "USD",
      quantity: qty,
      unitPrice: pkg.price,
      unitCoins: pkg.coins,
      unitGiftCoins: pkg.giftCoins,
    };
    sessionStorage.setItem("pending_checkout", JSON.stringify(state));
    window.dispatchEvent(new Event("pending-checkout-changed"));
    if (!getPlayerToken()) {
      navigate("/login");
      return;
    }
    navigate("/checkout", { state });
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

        <div className="rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 px-4 py-2 text-sm text-[#9AA7BD]">
          {t("fc26.payment")}{" "}
          <span className="text-[#00FF9A] font-semibold">
            {t("fc26.paymentProvider")}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
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
          <div className="mt-4 grid gap-3">
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
                return (
                  <div
                    key={x.id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-[#00FF9A]/25 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
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
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
                      <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5">
                        <button
                          onClick={() => setQty(x.id, qty - 1)}
                          className="px-2.5 py-1.5 text-sm text-[#9AA7BD] hover:text-[#E7EDF7]"
                        >
                          −
                        </button>
                        <span className="min-w-[24px] text-center text-sm font-semibold">
                          {qty}
                        </span>
                        <button
                          onClick={() => setQty(x.id, qty + 1)}
                          className="px-2.5 py-1.5 text-sm text-[#9AA7BD] hover:text-[#E7EDF7]"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="text-sm font-semibold whitespace-nowrap">
                          {fmtPrice(x.price * qty, x.currency)}
                        </div>
                        {qty > 1 && (
                          <div className="text-[10px] text-[#9AA7BD]">
                            {fmtPrice(x.price, x.currency)} × {qty}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => goCheckout(x)}
                        className="flex-1 rounded-xl bg-[#00FF9A] px-4 py-2 text-center text-xs font-semibold text-[#070A0F] hover:bg-[#00D47E] whitespace-nowrap sm:flex-initial"
                      >
                        {t("fc26.buy")}
                      </button>
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
