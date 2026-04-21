import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createOrder } from "../api/order";
import { createStripeSession } from "../api/payment";
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

export default function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const orderData =
    location.state ||
    (() => {
      try {
        const saved = sessionStorage.getItem("pending_checkout");
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    })();

  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (orderData && !getPlayerToken()) {
      navigate("/login");
    }
  }, []);

  const handleStripePay = async () => {
    if (!getPlayerToken()) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await createStripeSession({
        packageId: orderData.packageId,
        platform: orderData.platform,
        quantity: orderData.quantity || 1,
      });
      sessionStorage.removeItem("pending_checkout");
      window.location.href = res.data.sessionUrl;
    } catch (err) {
      const msg = err.msg || err.message || "";
      sessionStorage.removeItem("pending_checkout");
      window.dispatchEvent(new Event("pending-checkout-changed"));
      if (
        msg.includes("not configured") ||
        msg.includes("请联系") ||
        msg.includes("not configured yet")
      ) {
        setError(t("payment.notConfigured"));
      } else {
        setError(msg || t("payment.failed"));
      }
      setLoading(false);
    }
  };

  const handleWidgetPay = async () => {
    if (!getPlayerToken()) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await createOrder({
        packageId: orderData.packageId,
        platform: orderData.platform,
        quantity: orderData.quantity || 1,
      });
      if (orderData.widgetUrl) {
        window.open(orderData.widgetUrl, "_blank");
      }
      sessionStorage.removeItem("pending_checkout");
      window.dispatchEvent(new Event("pending-checkout-changed"));
      setOrderResult(res.data);
    } catch (err) {
      setError(err.message || "Failed to create order");
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

      {orderData ? (
        <div className="mt-6 rounded-3xl border border-white/5 bg-[#0B1220]/60 p-6">
          <div className="text-lg font-bold">{t("checkout.orderSummary")}</div>
          <div className="mt-4 grid gap-3">
            {orderData.packageName && (
              <div className="flex justify-between text-sm">
                <span className="text-[#9AA7BD]">{t("checkout.package")}:</span>
                <span className="font-semibold">{orderData.packageName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[#9AA7BD]">{t("checkout.platform")}:</span>
              <span className="font-semibold">{orderData.platform}</span>
            </div>
            {(orderData.quantity || 1) > 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#9AA7BD]">
                  {t("checkout.quantity")}:
                </span>
                <span className="font-semibold">×{orderData.quantity}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[#9AA7BD]">{t("checkout.coins")}:</span>
              <span className="font-semibold">
                {fmtK(orderData.unitCoins || orderData.coins)}
                {(orderData.quantity || 1) > 1 && (
                  <span className="text-[#9AA7BD] font-normal">
                    {" "}
                    × {orderData.quantity}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#9AA7BD]">{t("checkout.gift")}:</span>
              <span className="font-semibold text-[#00FF9A]">
                +{fmtK(orderData.unitGiftCoins || orderData.giftCoins)}
                {(orderData.quantity || 1) > 1 && (
                  <span className="text-[#9AA7BD] font-normal">
                    {" "}
                    × {orderData.quantity}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#9AA7BD]">{t("checkout.eta")}:</span>
              <span className="font-semibold">{orderData.eta}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-3 mt-3">
              <span className="text-[#9AA7BD]">{t("checkout.total")}:</span>
              <span className="font-semibold text-[#00FF9A]">
                {fmtPrice(orderData.price, orderData.currency)}
              </span>
            </div>
            {orderData.currency && (
              <div className="flex justify-between text-xs">
                <span className="text-[#9AA7BD]">
                  {t("checkout.currency")}:
                </span>
                <span className="text-[#9AA7BD]">{orderData.currency}</span>
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
              {orderData.widgetUrl && (
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

          {!orderResult && !orderData.widgetUrl && (
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
            <Link to="/fc26-coins" className="text-[#00FF9A] hover:underline">
              {t("checkout.noOrderLink")}
            </Link>
            {t("checkout.noOrderEnd")}
          </div>
        </div>
      )}
    </main>
  );
}
