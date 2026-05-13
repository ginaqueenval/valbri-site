import { useState } from "react";
import { useTranslation } from "react-i18next";
import { saveOrderAccountInfo } from "../api/order";

export default function OrderAccountInfoModal({ order, open, onSaved, onClose }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    gameAccount: "",
    gamePassword: "",
    backupCodes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open || !order) {
    return null;
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.gameAccount.trim() || !form.gamePassword.trim() || !form.backupCodes.trim()) {
      setError(t("orderAccount.required"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveOrderAccountInfo(order.id, {
        gameAccount: form.gameAccount.trim(),
        gamePassword: form.gamePassword.trim(),
        backupCodes: form.backupCodes.trim(),
      });
      setForm({ gameAccount: "", gamePassword: "", backupCodes: "" });
      onSaved?.(order.id);
    } catch (err) {
      setError(err.message || t("orderAccount.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#00FF9A]/20 bg-[#0B1220] p-6 text-left shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("orderAccount.close")}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-[#9AA7BD] hover:border-[#00FF9A]/30 hover:text-[#E7EDF7]"
        >
          ×
        </button>
        <div className="text-center">
          <div className="px-10 text-xs font-semibold uppercase tracking-widest text-[#00FF9A]">
            {t("orderAccount.badge")}
          </div>
          <h2 className="mt-2 text-xl font-extrabold">{t("orderAccount.title")}</h2>
          <p className="mt-2 text-sm leading-6 text-[#9AA7BD]">
            {t("orderAccount.desc")}
          </p>
          <p className="mt-2 text-base font-semibold leading-6 text-[#00FF9A]">
            {t("orderAccount.encryptedNotice")}
          </p>
        </div>
        <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-[#9AA7BD]">
          <span className="font-mono text-[#E7EDF7]">{order.orderNo}</span>
          {order.packageName ? <span className="ml-2">{order.packageName}</span> : null}
        </div>

        <form className="mt-5 grid gap-4 text-left" onSubmit={submit}>
          <label className="grid gap-2 text-sm">
            <span className="font-semibold">{t("orderAccount.gameAccount")}</span>
            <input
              value={form.gameAccount}
              onChange={(event) => updateField("gameAccount", event.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#00FF9A]/50"
              autoComplete="off"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-semibold">{t("orderAccount.gamePassword")}</span>
            <input
              type="password"
              value={form.gamePassword}
              onChange={(event) => updateField("gamePassword", event.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#00FF9A]/50"
              autoComplete="off"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-semibold">{t("orderAccount.backupCodes")}</span>
            <textarea
              value={form.backupCodes}
              onChange={(event) => updateField("backupCodes", event.target.value)}
              className="min-h-[110px] resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#00FF9A]/50"
            />
          </label>
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#00FF9A] px-6 py-3 text-sm font-semibold text-[#070A0F] hover:bg-[#00D47E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t("orderAccount.saving") : t("orderAccount.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
