import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    sessionStorage.removeItem("pending_checkout");
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-20 text-center">
      <div className="mx-auto max-w-md rounded-3xl border border-[#00FF9A]/15 bg-[#0B1220]/60 p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#00FF9A]/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-8 w-8 text-[#00FF9A]"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold">{t("payment.successTitle")}</h1>
        <p className="mt-3 text-sm text-[#9AA7BD]">
          {t("payment.successDesc")}
        </p>
        {sessionId && (
          <p className="mt-2 font-mono text-xs text-[#9AA7BD]">
            Session: {sessionId.slice(0, 20)}...
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/orders"
            className="rounded-xl bg-[#00FF9A] px-6 py-3 text-sm font-semibold text-[#070A0F] hover:bg-[#00D47E]"
          >
            {t("payment.viewOrders")}
          </Link>
          <Link
            to="/home"
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm hover:border-[#00FF9A]/30"
          >
            {t("payment.backHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
