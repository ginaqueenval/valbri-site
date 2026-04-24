import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { checkoutCartItem, getCartItem } from "../api/cart";
import { createStripeSession, createPayPalOrder } from "../api/payment";
import { getPlayerToken } from "../utils/request";

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

const isPaymentNotConfiguredMessage = (message) => {
  const normalized = String(message || "").toLowerCase();
  return (
    normalized.includes("not configured") ||
    normalized.includes("not configured yet") ||
    normalized.includes("please contact") ||
    normalized.includes("请联系")
  );
};

export default function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cartItemId = searchParams.get("cartItemId");

  const [loading, setLoading] = useState(false);
  const [cartItem, setCartItem] = useState(null);
  const [itemLoading, setItemLoading] = useState(true);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getPlayerToken()) {
      navigate("/login", {
        state: { redirectTo: cartItemId ? `/checkout?cartItemId=${cartItemId}` : "/cart" },
      });
      return;
    }
    if (!cartItemId) {
      setCartItem(null);
      setItemLoading(false);
      return;
    }
    setItemLoading(true);
    getCartItem(cartItemId)
      .then((res) => setCartItem(res.data || null))
      .catch((err) => {
        setError(err.message || t("checkout.loadFailed"));
        setCartItem(null);
      })
      .finally(() => setItemLoading(false));
  }, [cartItemId, navigate, t]);

  const handleStripePay = async () => {
    if (!cartItem) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await createStripeSession({
        packageId: cartItem.packageId,
        platform: cartItem.platform,
        quantity: cartItem.quantity || 1,
      });
      window.location.href = res.data.sessionUrl;
    } catch (err) {
      const msg = err.msg || err.message || "";
      if (isPaymentNotConfiguredMessage(msg)) {
        setError(t("payment.notConfigured"));
      } else {
        setError(msg || t("payment.failed"));
      }
      setLoading(false);
    }
  };

  const handlePayPalPay = async () => {
    if (!cartItem) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await createPayPalOrder({
        packageId: cartItem.packageId,
        platform: cartItem.platform,
        quantity: cartItem.quantity || 1,
      });
      window.location.href = res.data.approveUrl;
    } catch (err) {
      const msg = err.msg || err.message || "";
      if (isPaymentNotConfiguredMessage(msg)) {
        setError(t("payment.notConfigured"));
      } else {
        setError(msg || t("payment.failed"));
      }
      setLoading(false);
    }
  };

  const handleWidgetPay = async () => {
    if (!cartItem) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await checkoutCartItem(cartItem.id);
      if (cartItem.widgetUrl) {
        window.open(cartItem.widgetUrl, "_blank");
      }
      window.dispatchEvent(new Event("cart-changed"));
      setOrderResult(res.data);
    } catch (err) {
      setError(err.message || t("checkout.createOrderFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">{t("checkout.title")}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
        {t("checkout.description")}
      </p>

      {itemLoading ? (
        <div className="mt-6 rounded-3xl border border-white/5 bg-[#0B1220]/60 py-12 text-center text-sm text-[#9AA7BD]">
          {t("checkout.loading")}
        </div>
      ) : cartItem ? (
        <div className="mt-6 rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
          <div className="text-lg font-bold">{t("checkout.orderSummary")}</div>
          <div className="mt-4 grid gap-3">
            {cartItem.packageName && (
              <div className="flex justify-between text-sm">
                <span className="text-[#9AA7BD]">{t("checkout.package")}:</span>
                <span className="font-semibold">{cartItem.packageName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[#9AA7BD]">{t("checkout.platform")}:</span>
              <span className="font-semibold">{cartItem.platform}</span>
            </div>
            {(cartItem.quantity || 1) > 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#9AA7BD]">
                  {t("checkout.quantity")}:
                </span>
                <span className="font-semibold">×{cartItem.quantity}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[#9AA7BD]">{t("checkout.coins")}:</span>
              <span className="font-semibold">
                {fmtK(cartItem.coins)}
                {(cartItem.quantity || 1) > 1 && (
                  <span className="text-[#9AA7BD] font-normal">
                    {" "}× {cartItem.quantity}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#9AA7BD]">{t("checkout.gift")}:</span>
              <span className="font-semibold text-[#00FF9A]">
                +{fmtK(cartItem.giftCoins)}
                {(cartItem.quantity || 1) > 1 && (
                  <span className="text-[#9AA7BD] font-normal">
                    {" "}× {cartItem.quantity}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#9AA7BD]">{t("checkout.eta")}:</span>
              <span className="font-semibold">{cartItem.eta}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-3 mt-3">
              <span className="text-[#9AA7BD]">{t("checkout.total")}:</span>
              <span className="font-semibold text-[#00FF9A]">
                {fmtPrice(
                  Number(cartItem.price || 0) * Number(cartItem.quantity || 1),
                  cartItem.currency,
                )}
              </span>
            </div>
            {cartItem.currency && (
              <div className="flex justify-between text-xs">
                <span className="text-[#9AA7BD]">
                  {t("checkout.currency")}:
                </span>
                <span className="text-[#9AA7BD]">{cartItem.currency}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {orderResult ? (
            <div className="mt-4 rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4">
              <div className="text-sm text-[#00FF9A] font-semibold">
                {t("checkout.orderCreated")}
              </div>
              <div className="mt-2 text-xs text-[#9AA7BD]">
                {t("checkout.orderNo")}:{" "}
                <span className="text-[#E7EDF7] font-mono">
                  {orderResult.orderNo}
                </span>
              </div>
              <div className="mt-1 text-xs text-[#9AA7BD]">
                {t("checkout.status")}:{" "}
                <span className="text-[#E7EDF7] font-semibold">
                  {t("checkout.comingSoon")}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-3">
              <button
                onClick={handleStripePay}
                disabled={loading}
                className="rounded-xl bg-[#00FF9A] px-6 py-3 text-sm font-semibold text-[#070A0F] hover:bg-[#00D47E] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? t("payment.creating") : t("payment.stripePay")}
              </button>
              <button
                onClick={handlePayPalPay}
                disabled={loading}
                className="rounded-xl bg-[#0070BA] px-6 py-3 text-sm font-semibold text-white hover:bg-[#005EA6] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? t("payment.creating") : t("payment.paypalPay")}
              </button>
              {cartItem.widgetUrl && (
                <button
                  onClick={handleWidgetPay}
                  disabled={loading}
                  className="rounded-xl border border-[#00FF9A]/30 px-6 py-3 text-sm text-[#00FF9A] hover:bg-[#00FF9A]/10 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {t("payment.widgetPay")}
                </button>
              )}
            </div>
          )}

          {!orderResult && !cartItem.widgetUrl && (
            <div className="mt-4 rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4 text-xs text-[#9AA7BD]">
              {t("checkout.status")}:{" "}
              <span className="text-[#E7EDF7] font-semibold">
                {t("checkout.comingSoon")}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
          <div className="text-sm text-[#9AA7BD]">
            {t("checkout.noOrder")}{" "}
            <Link to="/cart" className="text-[#00FF9A] hover:underline">
              {t("checkout.noOrderLink")}
            </Link>
            {t("checkout.noOrderEnd")}
          </div>
        </div>
      )}
    </main>
  );
}
