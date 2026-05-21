import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SessionExpiredModal({ onDismiss }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-amber-500/20 bg-[#0B1220] p-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6 text-amber-400"
          >
            <path
              fillRule="evenodd"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-center text-lg font-bold">
          {t("auth.sessionExpiredTitle")}
        </h3>
        <p className="mt-2 text-center text-sm text-[#9AA7BD]">
          {t("auth.sessionExpiredDesc")}
        </p>
        <Link
          to="/login"
          onClick={onDismiss}
          className="mt-5 block w-full rounded-xl bg-[#00FF9A] py-2.5 text-center text-sm font-semibold text-[#070A0F] hover:bg-[#00D47E] transition-colors"
        >
          {t("auth.reLogin")}
        </Link>
      </div>
    </div>
  );
}
