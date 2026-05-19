import { useTranslation } from "react-i18next";

export default function LogoutConfirmModal({ onConfirm, onCancel }) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0B1220] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold">
          {t("auth.logoutConfirmTitle")}
        </h3>
        <p className="mt-2 text-sm text-[#9AA7BD]">
          {t("auth.logoutConfirm")}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/30 transition-colors"
          >
            {t("auth.logoutConfirmBtn")}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:border-[#00FF9A]/30 transition-colors"
          >
            {t("auth.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
