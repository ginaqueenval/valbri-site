import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getOrderAccountInfo, saveOrderAccountInfo } from "../api/order";
import { formatTime, isAccountInfoSubmitted } from "../utils/orderDisplay";
import { validateOrderAccountForm } from "../utils/orderAccountValidation";

const emptyForm = {
  gameAccount: "",
  gamePassword: "",
  backupCodes: "",
};

const maskPassword = (value) => (value ? "•".repeat(Math.max(8, Math.min(value.length, 16))) : "-");

function EyeIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 5.2A10.8 10.8 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.3 3.1M6.4 6.5C3.8 8.2 2.5 12 2.5 12s3.5 7 9.5 7c1.6 0 3-.4 4.2-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 9.9A3 3 0 0 0 14.1 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function OrderAccountInfoModal({ order, open, onSaved, onClose }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [accountInfo, setAccountInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [editing, setEditing] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submitted = isAccountInfoSubmitted(order);
  const displayTime = useMemo(
    () => accountInfo?.updatedAt || accountInfo?.submittedAt || accountInfo?.createTime,
    [accountInfo],
  );

  useEffect(() => {
    if (!open || !order) {
      return;
    }

    setError("");
    setShowPassword(false);
    setAccountInfo(null);
    setForm(emptyForm);

    if (!submitted) {
      setEditing(true);
      return;
    }

    if (order.accountInfo) {
      const data = order.accountInfo;
      setEditing(false);
      setLoadingInfo(false);
      setAccountInfo(data);
      setForm({
        gameAccount: data.gameAccount || "",
        gamePassword: data.gamePassword || "",
        backupCodes: data.backupCodes || "",
      });
      return;
    }

    let cancelled = false;
    setEditing(false);
    setLoadingInfo(true);
    getOrderAccountInfo(order.id)
      .then((res) => {
        if (cancelled) return;
        const data = res.data || {};
        setAccountInfo(data);
        setForm({
          gameAccount: data.gameAccount || "",
          gamePassword: data.gamePassword || "",
          backupCodes: data.backupCodes || "",
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || t("orderAccount.loadFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingInfo(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, order, submitted, t]);

  if (!open || !order) {
    return null;
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const validation = validateOrderAccountForm(form);
    if (!validation.valid) {
      setError(t(`orderAccount.${validation.errorKey}`));
      return;
    }
    const data = validation.data;
    setSaving(true);
    setError("");
    try {
      await saveOrderAccountInfo(order.id, {
        gameAccount: data.gameAccount,
        gamePassword: data.gamePassword,
        backupCodes: data.backupCodes,
      });
      setAccountInfo({
        ...(accountInfo || {}),
        gameAccount: data.gameAccount,
        gamePassword: data.gamePassword,
        backupCodes: data.backupCodes,
        updatedAt: new Date().toISOString(),
        submittedAt: accountInfo?.submittedAt || new Date().toISOString(),
      });
      setShowPassword(false);
      setEditing(false);
      onSaved?.(order.id);
    } catch (err) {
      setError(err.message || t("orderAccount.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const renderViewRow = (label, value, extra) => (
    <div className="grid gap-2 rounded-xl border border-white/5 bg-white/[0.04] p-3 text-sm">
      <div className="text-xs font-semibold text-[#9AA7BD]">{label}</div>
      <div className="flex min-h-[24px] items-center justify-between gap-3 text-[#E7EDF7]">
        <span className="min-w-0 whitespace-pre-wrap break-words">{value || "-"}</span>
        {extra}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-3 sm:px-4">
      <div className="valbri-scrollbar relative max-h-[82dvh] w-full max-w-[min(92vw,420px)] overflow-y-auto rounded-2xl border border-[#00FF9A]/20 bg-[#0B1220] p-3 text-left shadow-2xl sm:max-h-[90vh] sm:max-w-lg sm:p-6">
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
          <h2 className="mt-2 text-lg font-extrabold sm:text-xl">
            {submitted ? t("orderAccount.viewTitle") : t("orderAccount.title")}
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#9AA7BD] sm:text-sm sm:leading-6">
            {submitted ? t("orderAccount.viewDesc") : t("orderAccount.desc")}
          </p>
          <p className="mt-2 text-sm font-semibold leading-5 text-[#00FF9A] sm:text-base sm:leading-6">
            {t("orderAccount.encryptedNotice")}
          </p>
        </div>
        <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-[#9AA7BD]">
          <span className="font-mono text-[#E7EDF7]">{order.orderNo}</span>
          {order.packageName ? <span className="ml-2">{order.packageName}</span> : null}
        </div>

        {loadingInfo ? (
          <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.04] p-5 text-center text-sm text-[#9AA7BD]">
            {t("orderAccount.loading")}
          </div>
        ) : !editing && submitted ? (
          <div className="mt-5 grid gap-3 text-left">
            {renderViewRow(t("orderAccount.gameAccount"), accountInfo?.gameAccount)}
            {renderViewRow(
              t("orderAccount.gamePassword"),
              showPassword ? accountInfo?.gamePassword : maskPassword(accountInfo?.gamePassword),
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#9AA7BD] hover:border-[#00FF9A]/30 hover:text-[#00FF9A]"
                aria-label={showPassword ? t("orderAccount.hidePassword") : t("orderAccount.showPassword")}
              >
                <EyeIcon visible={showPassword} />
              </button>,
            )}
            {renderViewRow(t("orderAccount.backupCodes"), accountInfo?.backupCodes)}
            {renderViewRow(t("orderAccount.submittedTime"), formatTime(displayTime))}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl bg-[#00FF9A] px-6 py-3 text-sm font-semibold text-[#070A0F] hover:bg-[#00D47E]"
            >
              {t("orderAccount.edit")}
            </button>
          </div>
        ) : (
          <form className="mt-4 grid gap-3 text-left sm:mt-5 sm:gap-4" onSubmit={submit}>
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
              <input
                value={form.backupCodes}
                onChange={(event) => updateField("backupCodes", event.target.value)}
                inputMode="numeric"
                pattern="[0-9]*"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#00FF9A]/50"
                autoComplete="off"
              />
            </label>
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {submitted && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setError("");
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-[#E7EDF7] hover:border-[#00FF9A]/30"
                >
                  {t("orderAccount.cancelEdit")}
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className={`rounded-xl bg-[#00FF9A] px-6 py-3 text-sm font-semibold text-[#070A0F] hover:bg-[#00D47E] disabled:cursor-not-allowed disabled:opacity-50 ${
                  submitted ? "" : "sm:col-span-2"
                }`}
              >
                {saving
                  ? t("orderAccount.saving")
                  : submitted
                    ? t("orderAccount.resubmit")
                    : t("orderAccount.submit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
