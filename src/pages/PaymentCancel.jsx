import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PaymentCancel() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const orderNo = searchParams.get("orderNo");

  return (
    <main className="mx-auto max-w-6xl px-4 py-20 text-center">
      <div className="mx-auto max-w-md rounded-3xl border border-white/5 bg-[#0B1220]/60 p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-8 w-8 text-yellow-400"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold">{t("payment.cancelTitle")}</h1>
        <p className="mt-3 text-sm text-[#9AA7BD]">{t("payment.cancelDesc")}</p>
        {orderNo && (
          <p className="mt-2 font-mono text-xs text-[#9AA7BD]">
            {t("payment.orderNo")}: {orderNo}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/orders"
            className="rounded-xl border border-[#00FF9A]/30 px-6 py-3 text-sm text-[#00FF9A] hover:bg-[#00FF9A]/10"
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
