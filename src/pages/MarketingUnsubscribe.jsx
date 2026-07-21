import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  confirmMarketingUnsubscribe,
  unsubscribeMarketing,
} from "../api/marketing.js";

export default function MarketingUnsubscribe() {
  const { token = "" } = useParams();
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const handleUnsubscribe = async () => {
    if (submitting || completed) return;
    setSubmitting(true);
    setNetworkError(false);
    try {
      await unsubscribeMarketing(token);
      setCompleted(true);
    } catch {
      setNetworkError(true);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let active = true;
    confirmMarketingUnsubscribe(token)
      .catch(() => null)
      .finally(() => {
        if (!active) return;
        setChecking(false);
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="min-w-0 bg-[#070A0F] px-4 py-12 sm:px-6 sm:py-16">
      <section className="mx-auto w-full max-w-2xl border-y border-white/10 py-8 sm:py-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#00FF9A]">
          {t("marketingUnsubscribe.eyebrow")}
        </p>
        <h1 className="break-words text-3xl font-semibold text-[#E7EDF7] sm:text-4xl">
          {t("marketingUnsubscribe.title")}
        </h1>
        <p className="mt-4 max-w-xl break-words text-base leading-7 text-[#9AA7BD]">
          {t("marketingUnsubscribe.description")}
        </p>

        <div
          className="mt-8 border-l-2 border-[#00FF9A] bg-white/[0.035] px-4 py-4 text-sm leading-6 text-[#BAC5D6]"
          role="status"
          aria-live="polite"
        >
          {completed
            ? t("marketingUnsubscribe.completed")
            : t("marketingUnsubscribe.privacyNotice")}
        </div>

        {networkError && (
          <p className="mt-4 break-words text-sm text-[#FFB4A8]" role="alert">
            {t("marketingUnsubscribe.networkError")}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {checking && (
            <span className="min-h-11 py-3 text-sm text-[#9AA7BD]">
              {t("marketingUnsubscribe.checking")}
            </span>
          )}
          {ready && (
            <button
              type="button"
              onClick={handleUnsubscribe}
              disabled={submitting || completed}
              className="min-h-11 border border-[#00FF9A] bg-[#00FF9A] px-5 py-3 text-sm font-semibold text-[#07110D] transition-colors hover:bg-[#42FFB4] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-[#7F8A9D]"
            >
              {submitting
                ? t("marketingUnsubscribe.submitting")
                : completed
                  ? t("marketingUnsubscribe.completedButton")
                  : t("marketingUnsubscribe.confirm")}
            </button>
          )}
          <Link
            to="/home"
            className="min-h-11 px-1 py-3 text-center text-sm font-medium text-[#BAC5D6] hover:text-white sm:text-left"
          >
            {t("marketingUnsubscribe.returnHome")}
          </Link>
        </div>
      </section>
    </main>
  );
}
