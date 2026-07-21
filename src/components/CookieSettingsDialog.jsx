import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CONSENT_SYNC_STATUS_EVENT,
  consumeConsentSyncStatus,
  readConsentRecord,
} from "../utils/consentStorage.js";

function CategoryRow({ title, description, checked, disabled = false, onChange, status }) {
  return (
    <label className="flex min-h-20 items-start justify-between gap-4 border-b border-white/10 py-4 last:border-b-0">
      <span>
        <span className="block text-sm font-semibold text-[#EDF3FC]">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-[#9AA7BD]">{description}</span>
        {status ? <span className="mt-1 block text-xs font-semibold text-[#7BFFCA]">{status}</span> : null}
      </span>
      <input
        checked={checked}
        className="mt-1 h-5 w-5 shrink-0 accent-[#00FF9A]"
        disabled={disabled}
        onChange={onChange}
        type="checkbox"
      />
    </label>
  );
}

export default function CookieSettingsDialog({
  initialChoices,
  onClose,
  onSave,
  onWithdraw,
}) {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState(initialChoices?.preferences === true);
  const [functional, setFunctional] = useState(initialChoices?.functional === true);
  const [syncConflict, setSyncConflict] = useState(false);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    const applySyncStatus = (status) => {
      if (!status) return;
      const latest = readConsentRecord();
      if (latest) {
        setPreferences(latest.preferences === true);
        setFunctional(latest.functional === true);
      }
      setSyncConflict(status.type === "conflict");
      setSyncError(status.type === "error" ? status.message || t("cookieConsent.syncFailed") : "");
    };
    applySyncStatus(consumeConsentSyncStatus());
    const handleSyncStatus = (event) => applySyncStatus(event.detail);
    window.addEventListener(CONSENT_SYNC_STATUS_EVENT, handleSyncStatus);
    return () => window.removeEventListener(CONSENT_SYNC_STATUS_EVENT, handleSyncStatus);
  }, [t]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-3 sm:items-center" role="presentation">
      <section
        aria-labelledby="cookie-settings-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-white/15 bg-[#101722] p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white" id="cookie-settings-title">
              {t("cookieConsent.settingsTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#AAB5C8]">{t("cookieConsent.settingsDescription")}</p>
          </div>
          <button aria-label={t("common.close")} className="text-xl text-[#AAB5C8] hover:text-white" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <div className="mt-5">
          <CategoryRow checked={true} description={t("cookieConsent.necessaryDescription")} disabled title={t("cookieConsent.necessary")} />
          <CategoryRow checked={preferences} description={t("cookieConsent.preferencesDescription")} onChange={(event) => setPreferences(event.target.checked)} title={t("cookieConsent.preferences")} />
          <CategoryRow checked={functional} description={t("cookieConsent.functionalDescription")} onChange={(event) => setFunctional(event.target.checked)} title={t("cookieConsent.functional")} />
          <CategoryRow checked={false} description={t("cookieConsent.analyticsDescription")} disabled status={t("cookieConsent.unavailable")} title={t("cookieConsent.analytics")} />
          <CategoryRow checked={false} description={t("cookieConsent.advertisingDescription")} disabled status={t("cookieConsent.unavailable")} title={t("cookieConsent.advertising")} />
        </div>

        {syncError ? (
          <div className="mt-5 rounded-lg border border-red-300/20 bg-red-300/[0.07] px-4 py-3 text-sm leading-6 text-red-100" role="alert">
            {syncError}
          </div>
        ) : null}
        {syncConflict ? (
          <div className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/[0.07] p-4">
            <p className="text-sm leading-6 text-amber-100">{t("cookieConsent.syncConflict")}</p>
            <button
              className="mt-3 min-h-11 rounded-lg border border-amber-200/30 px-4 text-sm font-bold text-amber-100 hover:bg-amber-200/10"
              onClick={() => {
                setSyncConflict(false);
                setSyncError("");
              }}
              type="button"
            >
              {t("cookieConsent.reconfirm")}
            </button>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button className="h-11 rounded-lg border border-white/20 px-4 text-sm font-semibold hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50" disabled={syncConflict} onClick={onWithdraw} type="button">
            {t("cookieConsent.withdraw")}
          </button>
          <button className="h-11 rounded-lg bg-[#00FF9A] px-4 text-sm font-bold text-[#07110D] hover:bg-[#7BFFCA] disabled:cursor-not-allowed disabled:opacity-50" disabled={syncConflict} onClick={() => onSave({ preferences, functional })} type="button">
            {t("cookieConsent.save")}
          </button>
        </div>
      </section>
    </div>
  );
}
