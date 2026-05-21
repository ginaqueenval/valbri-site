import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cancelMockPayment, completeMockPayment } from "../api/payment";

const PROVIDER_META = {
  stripe: {
    name: "Stripe",
    accent: "bg-[#635BFF]",
    border: "border-[#635BFF]/25",
  },
  paypal: {
    name: "PayPal",
    accent: "bg-[#0070BA]",
    border: "border-[#0070BA]/25",
  },
};

export default function MockPayment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const orderNo = searchParams.get("orderNo") || "";
  const [submitting, setSubmitting] = useState(null);
  const [error, setError] = useState("");
  const meta = PROVIDER_META[provider] || PROVIDER_META.stripe;

  const finish = async (action) => {
    if (!orderNo) {
      setError(t("mockPayment.missingOrder"));
      return;
    }
    setSubmitting(action);
    setError("");
    try {
      if (action === "success") {
        await completeMockPayment({ orderNo });
        navigate(`/payment/success?orderNo=${encodeURIComponent(orderNo)}`);
      } else {
        await cancelMockPayment({ orderNo });
        navigate(`/payment/cancel?orderNo=${encodeURIComponent(orderNo)}`);
      }
    } catch (err) {
      setError(err.message || t("mockPayment.failed"));
      setSubmitting(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <div className={`mx-auto max-w-lg rounded-3xl border bg-[#0B1220]/70 p-7 ${meta.border}`}>
        <div className="flex items-center gap-4">
          <div className={`grid h-12 w-12 place-items-center rounded-2xl ${meta.accent} text-base font-black text-white`}>
            {meta.name.slice(0, 1)}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9AA7BD]">
              {t("mockPayment.sandbox")}
            </div>
            <h1 className="mt-1 text-2xl font-extrabold">
              {t("mockPayment.title", { provider: meta.name })}
            </h1>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.04] p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#9AA7BD]">{t("payment.orderNo")}</span>
            <span className="font-mono text-xs text-[#E7EDF7]">{orderNo || "-"}</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/5 pt-3">
            <span className="text-[#9AA7BD]">{t("mockPayment.provider")}</span>
            <span className="font-semibold text-[#E7EDF7]">{meta.name}</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => finish("success")}
            disabled={submitting !== null}
            className="min-h-[52px] rounded-xl bg-[#00FF9A] px-5 py-3 text-sm font-semibold text-[#070A0F] hover:bg-[#00D47E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting === "success" ? t("payment.creating") : t("mockPayment.success")}
          </button>
          <button
            type="button"
            onClick={() => finish("cancel")}
            disabled={submitting !== null}
            className="min-h-[52px] rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-[#E7EDF7] hover:border-red-400/30 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting === "cancel" ? t("payment.creating") : t("mockPayment.cancel")}
          </button>
        </div>
      </div>
    </main>
  );
}
