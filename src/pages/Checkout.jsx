import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { checkoutCartItem, getCartItem } from "../api/cart";
import { createStripeSession, createPayPalOrder } from "../api/payment";
import { formatCoinsK, formatPlatform, formatPrice } from "../utils/orderDisplay";
import { getSafePaymentRedirectUrl } from "../utils/paymentRedirect";

const isPaymentNotConfiguredMessage = (message) => {
  const normalized = String(message || "").toLowerCase();
  return (
    normalized.includes("not configured") ||
    normalized.includes("not configured yet") ||
    normalized.includes("please contact") ||
    normalized.includes("请联系")
  );
};

const paymentButtonBaseClass =
  "inline-flex min-h-[52px] min-w-[190px] items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap";

const isSbcItem = (item) => String(item?.productType || "").toLowerCase() === "sbc";

export default function Checkout() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const cartItemId = searchParams.get("cartItemId");

  const [activePaymentMethod, setActivePaymentMethod] = useState(null);
  const [cartItem, setCartItem] = useState(null);
  const [itemLoading, setItemLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState("");
  const activePaymentMethodRef = useRef(null);

  useEffect(() => {
    if (!cartItemId) {
      setCartItem(null);
      setAccessDenied(false);
      setItemLoading(false);
      return;
    }
    setItemLoading(true);
    setAccessDenied(false);
    getCartItem(cartItemId)
      .then((res) => setCartItem(res.data || null))
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 403 || status === 404) {
          setAccessDenied(true);
        } else {
          setError(err.message || t("checkout.loadFailed"));
        }
        setCartItem(null);
      })
      .finally(() => setItemLoading(false));
  }, [cartItemId, t]);

  const beginPayment = (method) => {
    if (activePaymentMethodRef.current) {
      return false;
    }
    activePaymentMethodRef.current = method;
    setActivePaymentMethod(method);
    return true;
  };

  const endPayment = () => {
    activePaymentMethodRef.current = null;
    setActivePaymentMethod(null);
  };

  const redirectToPayment = (paymentUrl) => {
    const safePaymentUrl = getSafePaymentRedirectUrl(paymentUrl);
    if (!safePaymentUrl) {
      return false;
    }
    window.location.href = safePaymentUrl;
    return true;
  };

  const handleStripePay = async () => {
    if (!cartItem || !beginPayment("stripe")) {
      return;
    }
    setError("");
    try {
      const res = await createStripeSession({
        cartItemId: cartItem.id,
        productType: cartItem.productType,
        packageId: cartItem.packageId,
        platform: cartItem.platform,
        quantity: cartItem.quantity || 1,
      });
      window.dispatchEvent(new Event("cart-changed"));
      if (!redirectToPayment(res.data?.sessionUrl)) {
        setError(t("payment.failed"));
        endPayment();
      }
    } catch (err) {
      const msg = err?.response?.data?.msg || err?.message || "";
      if (isPaymentNotConfiguredMessage(msg)) {
        setError(t("payment.notConfigured"));
      } else {
        setError(msg || t("payment.failed"));
      }
      endPayment();
    }
  };

  const handlePayPalPay = async () => {
    if (!cartItem || !beginPayment("paypal")) {
      return;
    }
    setError("");
    try {
      const res = await createPayPalOrder({
        cartItemId: cartItem.id,
        productType: cartItem.productType,
        packageId: cartItem.packageId,
        platform: cartItem.platform,
        quantity: cartItem.quantity || 1,
      });
      window.dispatchEvent(new Event("cart-changed"));
      if (!redirectToPayment(res.data?.approveUrl)) {
        setError(t("payment.failed"));
        endPayment();
      }
    } catch (err) {
      const msg = err?.response?.data?.msg || err?.message || "";
      if (isPaymentNotConfiguredMessage(msg)) {
        setError(t("payment.notConfigured"));
      } else {
        setError(msg || t("payment.failed"));
      }
      endPayment();
    }
  };

  const handleWidgetPay = async () => {
    if (!cartItem || !beginPayment("widget")) {
      return;
    }
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
      endPayment();
    }
  };

  const sbcItem = isSbcItem(cartItem);

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
      ) : accessDenied ? (
        <div className="mt-6 rounded-3xl border border-red-500/20 bg-[#0B1220]/60 p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-red-400">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-red-400">{t("checkout.accessDenied")}</div>
          <p className="mt-2 text-sm text-[#9AA7BD]">{t("checkout.accessDeniedDesc")}</p>
          <Link
            to="/cart"
            className="mt-5 inline-flex rounded-xl bg-[#00FF9A] px-5 py-2.5 text-sm font-semibold text-[#070A0F] hover:bg-[#00D47E]"
          >
            {t("checkout.noOrderLink")}
          </Link>
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
              <span className="font-semibold">{formatPlatform(cartItem.platform)}</span>
            </div>
            {(cartItem.quantity || 1) > 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#9AA7BD]">
                  {t("checkout.quantity")}:
                </span>
                <span className="font-semibold">×{cartItem.quantity}</span>
              </div>
            )}
            {!sbcItem && (
              <div className="flex justify-between text-sm">
                <span className="text-[#9AA7BD]">{t("checkout.coins")}:</span>
                <span className="font-semibold">
                  {formatCoinsK(cartItem.coins)}
                  {(cartItem.quantity || 1) > 1 && (
                    <span className="text-[#9AA7BD] font-normal">
                      {" "}× {cartItem.quantity}
                    </span>
                  )}
                </span>
              </div>
            )}
            {!sbcItem && cartItem.giftCoins > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#9AA7BD]">{t("checkout.gift")}:</span>
                <span className="font-semibold text-[#00FF9A]">
                  +{formatCoinsK(cartItem.giftCoins)}
                  {(cartItem.quantity || 1) > 1 && (
                    <span className="text-[#9AA7BD] font-normal">
                      {" "}× {cartItem.quantity}
                    </span>
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[#9AA7BD]">{t("checkout.eta")}:</span>
              <span className="font-semibold">{cartItem.eta}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-3 mt-3">
              <span className="text-[#9AA7BD]">{t("checkout.total")}:</span>
              <span className="font-semibold text-[#00FF9A]">
                {formatPrice(
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
                disabled={activePaymentMethod !== null}
                className={`${paymentButtonBaseClass} bg-[#00FF9A] text-[#070A0F] hover:bg-[#00D47E]`}
              >
                {activePaymentMethod === "stripe" ? t("payment.creating") : t("payment.stripePay")}
              </button>
              <button
                onClick={handlePayPalPay}
                disabled={activePaymentMethod !== null}
                className={`${paymentButtonBaseClass} bg-[#0070BA] text-white hover:bg-[#005EA6]`}
              >
                {activePaymentMethod === "paypal" ? t("payment.creating") : t("payment.paypalPay")}
              </button>
              {cartItem.widgetUrl && (
                <button
                  onClick={handleWidgetPay}
                  disabled={activePaymentMethod !== null}
                  className={`${paymentButtonBaseClass} border border-[#00FF9A]/30 text-[#00FF9A] hover:bg-[#00FF9A]/10`}
                >
                  {activePaymentMethod === "widget" ? t("payment.creating") : t("payment.widgetPay")}
                </button>
              )}
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
