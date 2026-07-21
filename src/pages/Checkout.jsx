import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { checkoutCartItem, getCartItem } from "../api/cart";
import { createStripeSession, createPayPalOrder } from "../api/payment";
import {
  acceptCurrentPolicies,
  getLegalAcceptanceStatus,
  getPublishedPolicies,
} from "../api/legal";
import { formatCoinsK, formatPrice } from "../utils/orderDisplay";
import {
  isPolicyReconsentError,
  loadCheckoutLegalPolicies,
} from "./checkoutLegalState.js";
import { getSafePaymentRedirectUrl } from "../utils/paymentRedirect";

const widgetPaymentEnabled = import.meta.env.VITE_ENABLE_WIDGET_PAYMENT === "true";

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
  "relative inline-flex h-12 min-w-[190px] w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto";

const paymentVariantClass = {
  stripe: "cta-primary",
  paypal:
    "bg-[#0070BA] text-white shadow-[0_10px_28px_rgba(0,112,186,0.28)] hover:bg-[#005FA0]",
  widget:
    "border border-[#00FF9A]/30 bg-[#00FF9A]/[0.05] text-[#7BFFCA] hover:bg-[#00FF9A]/12 hover:text-[#8DFFC9]",
};

const isSbcItem = (item) => String(item?.productType || "").toLowerCase() === "sbc";

const policyReference = (policy) => ({
  policyId: policy.id,
  policyType: policy.policyType,
  locale: policy.locale,
  version: policy.version,
  contentSha256: policy.contentSha256,
});

const responseMessage = (error) =>
  error?.response?.data?.msg || error?.msg || error?.message || "";

function SummaryRow({ label, value, accent = false, divider = false }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 py-2 text-sm ${
        divider ? "border-t border-white/8 pt-3" : ""
      }`}
    >
      <span className="text-[#9AA7BD]">{label}</span>
      <span
        className={`text-right font-semibold ${
          accent ? "text-[#00FF9A]" : "text-[#E7EDF7]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

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
  const [policyLoading, setPolicyLoading] = useState(true);
  const [legalPolicies, setLegalPolicies] = useState(null);
  const [acceptanceStatus, setAcceptanceStatus] = useState(null);
  const [generalAccepted, setGeneralAccepted] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const activePaymentMethodRef = useRef(null);
  const paymentAttemptKeys = useRef({});

  const getPaymentAttemptKey = (method) => {
    if (!paymentAttemptKeys.current[method]) {
      paymentAttemptKeys.current[method] =
        globalThis.crypto?.randomUUID?.() ||
        `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${method}`;
    }
    return paymentAttemptKeys.current[method];
  };

  const loadLegalState = useCallback(async () => {
    setPolicyLoading(true);
    setPolicyAccepted(false);
    setAgeConfirmed(false);
    try {
      const [policiesResponse, statusResponse] = await Promise.all([
        getPublishedPolicies(),
        getLegalAcceptanceStatus(),
      ]);
      const policies = policiesResponse.data || [];
      const currentPolicies = await loadCheckoutLegalPolicies(policies);
      const status = statusResponse.data || {};
      setLegalPolicies(currentPolicies);
      setAcceptanceStatus(status);
      setGeneralAccepted(status.accepted === true && status.purchaseBlocked !== true);
    } catch {
      setLegalPolicies(null);
      setAcceptanceStatus(null);
      setGeneralAccepted(false);
      setError(t("checkout.policyUnavailable"));
    } finally {
      setPolicyLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadLegalState();
  }, [loadLegalState]);

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
    if (activePaymentMethodRef.current) return false;
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

  const prepareCheckoutConsent = async () => {
    if (policyLoading || !legalPolicies || !policyAccepted) {
      throw new Error(t("checkout.consentRequired"));
    }
    if (!generalAccepted) {
      if (!ageConfirmed) {
        throw new Error(t("checkout.generalConsentRequired"));
      }
      await acceptCurrentPolicies({
        ageConfirmed: true,
        termsPolicy: policyReference(legalPolicies.terms),
        privacyPolicy: policyReference(legalPolicies.privacy),
        refundPolicy: policyReference(legalPolicies.refund),
      });
      setGeneralAccepted(true);
      setAcceptanceStatus((current) =>
        current
          ? {
              ...current,
              accepted: true,
              acceptedGeneration: current.requiredGeneration,
              reconsentRequired: false,
              purchaseBlocked: false,
            }
          : current,
      );
    }
    const version = legalPolicies.terms.releaseVersion;
    return {
      policyVersion: version,
      immediatePerformance: true,
      refundPolicy: policyReference(legalPolicies.refund),
    };
  };

  const handleCheckoutError = async (checkoutError, fallbackKey) => {
    if (isPolicyReconsentError(checkoutError)) {
      paymentAttemptKeys.current = {};
      setPolicyAccepted(false);
      setAgeConfirmed(false);
      await loadLegalState();
      setError(t("checkout.policyChanged"));
      return;
    }
    const msg = responseMessage(checkoutError);
    setError(
      isPaymentNotConfiguredMessage(msg)
        ? t("payment.notConfigured")
        : msg || t(fallbackKey),
    );
  };

  const handleStripePay = async () => {
    if (!cartItem || !beginPayment("stripe")) return;
    setError("");
    try {
      const consent = await prepareCheckoutConsent();
      const res = await createStripeSession({
        idempotencyKey: getPaymentAttemptKey("stripe"),
        cartItemId: cartItem.id,
        productType: cartItem.productType,
        packageId: cartItem.packageId,
        platform: cartItem.platform,
        quantity: cartItem.quantity || 1,
        consent,
      });
      window.dispatchEvent(new Event("cart-changed"));
      if (!redirectToPayment(res.data?.sessionUrl)) {
        setError(t("payment.failed"));
        endPayment();
      }
    } catch (err) {
      await handleCheckoutError(err, "payment.failed");
      endPayment();
    }
  };

  const handlePayPalPay = async () => {
    if (!cartItem || !beginPayment("paypal")) return;
    setError("");
    try {
      const consent = await prepareCheckoutConsent();
      const res = await createPayPalOrder({
        idempotencyKey: getPaymentAttemptKey("paypal"),
        cartItemId: cartItem.id,
        productType: cartItem.productType,
        packageId: cartItem.packageId,
        platform: cartItem.platform,
        quantity: cartItem.quantity || 1,
        consent,
      });
      window.dispatchEvent(new Event("cart-changed"));
      if (!redirectToPayment(res.data?.approveUrl)) {
        setError(t("payment.failed"));
        endPayment();
      }
    } catch (err) {
      await handleCheckoutError(err, "payment.failed");
      endPayment();
    }
  };

  const handleWidgetPay = async () => {
    if (!widgetPaymentEnabled || !cartItem || !beginPayment("widget")) return;
    setError("");
    try {
      const consent = await prepareCheckoutConsent();
      const res = await checkoutCartItem(cartItem.id, { consent });
      if (cartItem.widgetUrl) {
        window.open(cartItem.widgetUrl, "_blank");
      }
      window.dispatchEvent(new Event("cart-changed"));
      setOrderResult(res.data);
    } catch (err) {
      await handleCheckoutError(err, "checkout.createOrderFailed");
    } finally {
      endPayment();
    }
  };

  const paymentDisabled =
    policyLoading ||
    !legalPolicies ||
    !policyAccepted ||
    (!generalAccepted && !ageConfirmed);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:pt-14">
      <h1 className="reveal-up text-[2rem] font-black leading-[1.05] tracking-[-0.035em] sm:text-[2.5rem]">
        {t("checkout.title")}
      </h1>

      {itemLoading ? (
        <div className="mt-8 h-72 animate-pulse rounded-3xl border border-white/5 bg-white/[0.02]" />
      ) : accessDenied ? (
        <div className="reveal-up mt-8 rounded-3xl border border-red-500/22 bg-[#0B1220]/60 p-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path
                fillRule="evenodd"
                d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="text-base font-semibold text-red-300">
            {t("checkout.accessDenied")}
          </div>
          <p className="mt-2 text-sm text-[#9AA7BD]">
            {t("checkout.accessDeniedDesc")}
          </p>
          <Link to="/cart" className="cta-primary mt-6 inline-flex px-6 py-3 text-sm">
            {t("checkout.noOrderLink")}
          </Link>
        </div>
      ) : cartItem ? (
        <div className="reveal-stagger mt-8 grid gap-5">
          <section className="rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(15,22,36,0.78),rgba(8,12,20,0.92))] p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#6E7B92]">
              {t("checkout.orderSummary")}
            </div>
            <div className="mt-4">
              {cartItem.packageName && (
                <SummaryRow
                  label={t("checkout.package")}
                  value={cartItem.packageName}
                />
              )}
              <SummaryRow
                label={t("checkout.platform")}
                value={cartItem.platform}
              />
              {(cartItem.quantity || 1) > 1 && (
                <SummaryRow
                  label={t("checkout.quantity")}
                  value={`×${cartItem.quantity}`}
                />
              )}
              {!isSbcItem(cartItem) && (
                <SummaryRow
                  label={t("checkout.coins")}
                  value={
                    <>
                      {formatCoinsK(cartItem.coins)}
                      {(cartItem.quantity || 1) > 1 && (
                        <span className="font-normal text-[#9AA7BD]">
                          {" "}× {cartItem.quantity}
                        </span>
                      )}
                    </>
                  }
                />
              )}
              {cartItem.giftCoins > 0 && (
                <SummaryRow
                  label={t("checkout.gift")}
                  value={
                    <span className="text-[#00FF9A]">
                      +{formatCoinsK(cartItem.giftCoins)}
                      {(cartItem.quantity || 1) > 1 && (
                        <span className="font-normal text-[#9AA7BD]">
                          {" "}× {cartItem.quantity}
                        </span>
                      )}
                    </span>
                  }
                />
              )}
              {cartItem.eta && (
                <SummaryRow label={t("checkout.eta")} value={cartItem.eta} />
              )}
              <SummaryRow
                divider
                accent
                label={t("checkout.total")}
                value={formatPrice(
                  Number(cartItem.price || 0) *
                    Number(cartItem.quantity || 1),
                  cartItem.currency,
                )}
              />
              {cartItem.currency && (
                <div className="flex justify-between pt-1 text-[10px] uppercase tracking-[0.2em] text-[#6E7B92]">
                  <span>{t("checkout.currency")}</span>
                  <span>{cartItem.currency}</span>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/8 bg-[#0B1220]/72 p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#6E7B92]">
              {t("checkout.legalConfirmation")}
            </div>
            {policyLoading ? (
              <div className="mt-4 text-sm text-[#9AA7BD]">
                {t("checkout.policyLoading")}
              </div>
            ) : legalPolicies ? (
              <div className="mt-4 grid gap-4 text-sm text-[#B8C3D6]">
                <p className="leading-6">{t("checkout.refundPolicyNotice")}</p>
                <div className="grid gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                  {[legalPolicies.terms, legalPolicies.privacy, legalPolicies.refund].map((policy) => {
                    const generation =
                      policy.acceptanceGeneration ?? acceptanceStatus?.requiredGeneration;
                    return (
                      <div key={policy.policyType} className="grid gap-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                          <span className="font-semibold text-[#E7EDF7]">
                            {policy.title} · {policy.version}
                          </span>
                          {generation != null && (
                            <span className="text-[#7BFFCA]">
                              {t("checkout.policyGeneration", { defaultValue: "Generation" })} {generation}
                            </span>
                          )}
                        </div>
                        {policy.changeSummary && (
                          <p className="leading-5 text-[#9AA7BD]">{policy.changeSummary}</p>
                        )}
                      </div>
                    );
                  })}
                  {acceptanceStatus?.requiredGeneration != null && (
                    <div className="border-t border-white/8 pt-2 text-xs text-[#9AA7BD]">
                      {t("checkout.requiredGeneration", { defaultValue: "Required generation" })}: {" "}
                      <span className="font-semibold text-[#E7EDF7]">
                        {acceptanceStatus.requiredGeneration}
                      </span>
                    </div>
                  )}
                  {acceptanceStatus?.reconsentRequired && (
                    <p className="text-xs leading-5 text-amber-300">
                      {t("checkout.policyChanged")}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-semibold">
                  <Link to="/terms" className="text-[#00FF9A] hover:underline">
                    {t("footer.terms")}
                  </Link>
                  <Link to="/privacy" className="text-[#00FF9A] hover:underline">
                    {t("footer.privacy")}
                  </Link>
                  <Link to="/refund" className="text-[#00FF9A] hover:underline">
                    {t("footer.refundPolicy")}
                  </Link>
                </div>
                <div className="grid gap-3 border-t border-white/8 pt-4">
                  <label className="flex cursor-pointer items-start gap-3 leading-6 text-[#E7EDF7]">
                    <input
                      type="checkbox"
                      checked={policyAccepted}
                      onChange={(event) => setPolicyAccepted(event.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#00FF9A]"
                    />
                    <span>{t("checkout.generalPolicyConsent")}</span>
                  </label>
                  {!generalAccepted && (
                    <label className="flex cursor-pointer items-start gap-3 leading-6">
                      <input
                        type="checkbox"
                        checked={ageConfirmed}
                        onChange={(event) => setAgeConfirmed(event.target.checked)}
                        className="mt-1 h-4 w-4 accent-[#00FF9A]"
                      />
                      <span>{t("checkout.ageConfirmation")}</span>
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-red-300">
                {t("checkout.policyUnavailable")}
              </div>
            )}
          </section>

          {error && (
            <div className="rounded-2xl border border-red-500/22 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {orderResult ? (
            <div className="rounded-3xl border border-[#00FF9A]/22 bg-[#00FF9A]/[0.06] p-6">
              <div className="text-sm font-semibold text-[#00FF9A]">
                {t("checkout.orderCreated")}
              </div>
              <div className="mt-3 text-xs text-[#9AA7BD]">
                {t("checkout.orderNo")}:{" "}
                <span className="font-mono text-[#E7EDF7]">
                  {orderResult.orderNo}
                </span>
              </div>
            </div>
          ) : (
            <section className="rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(15,22,36,0.78),rgba(8,12,20,0.92))] p-6">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#6E7B92]">
                {t("checkout.paymentMethods")}
              </div>
              <fieldset
                disabled={paymentDisabled}
                className="mt-4 flex flex-col gap-3 border-0 p-0 sm:flex-row sm:flex-wrap"
              >
                <button
                  onClick={handleStripePay}
                  disabled={activePaymentMethod === "stripe"}
                  className={`${paymentButtonBaseClass} ${paymentVariantClass.stripe}`}
                >
                  {activePaymentMethod === "stripe" ? t("payment.creating") : t("payment.stripePay")}
                </button>
                <button
                  onClick={handlePayPalPay}
                  disabled={activePaymentMethod === "paypal"}
                  className={`${paymentButtonBaseClass} ${paymentVariantClass.paypal}`}
                >
                  {activePaymentMethod === "paypal" ? t("payment.creating") : t("payment.paypalPay")}
                </button>
                {widgetPaymentEnabled && cartItem.widgetUrl && (
                  <button
                    onClick={handleWidgetPay}
                    disabled={activePaymentMethod === "widget"}
                    className={`${paymentButtonBaseClass} ${paymentVariantClass.widget}`}
                  >
                    {activePaymentMethod === "widget" ? t("payment.creating") : t("payment.widgetPay")}
                  </button>
                )}
              </fieldset>
            </section>
          )}
        </div>
      ) : (
        <div className="reveal-up mt-8 rounded-3xl border border-white/8 bg-white/[0.02] p-8 text-center text-sm text-[#9AA7BD]">
          {t("checkout.noOrder")}{" "}
          <Link to="/cart" className="text-[#00FF9A] hover:underline">
            {t("checkout.noOrderLink")}
          </Link>
          {t("checkout.noOrderEnd")}
        </div>
      )}
    </main>
  );
}
