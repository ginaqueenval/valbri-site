import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CookieSettingsDialog from "./CookieSettingsDialog.jsx";
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  readConsentRecord,
  saveConsentChoices,
  withdrawOptionalConsent,
} from "../utils/consentStorage.js";

const CONSENT_ACTION_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-white/25 bg-white/[0.04] px-2 py-2 text-center text-xs font-semibold leading-4 text-white transition-colors hover:border-[#00FF9A]/70 hover:bg-[#00FF9A]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00FF9A] sm:px-4 sm:text-sm sm:leading-5";

export default function CookieConsent() {
  const { t } = useTranslation();
  const [record, setRecord] = useState(() => readConsentRecord());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const openSettings = () => setSettingsOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

  const persist = (choices) => {
    const nextRecord = saveConsentChoices(choices);
    if (nextRecord) setRecord(nextRecord);
    setSettingsOpen(false);
  };

  const rejectOptional = () => {
    const nextRecord = withdrawOptionalConsent();
    if (nextRecord) setRecord(nextRecord);
    setSettingsOpen(false);
  };

  return (
    <>
      {!record ? (
        <aside className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-h-[calc(100dvh-1.5rem)] max-w-4xl overflow-y-auto overscroll-contain rounded-lg border border-white/15 bg-[#101722] p-3 shadow-2xl sm:bottom-5 sm:p-5" aria-label={t("cookieConsent.title")}>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-4">
            <div>
              <h2 className="text-base font-bold text-white">{t("cookieConsent.title")}</h2>
              <p className="mt-1 text-sm leading-6 text-[#AAB5C8]">{t("cookieConsent.description")}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button className={CONSENT_ACTION_CLASS} onClick={() => persist({ preferences: true, functional: true })} type="button">
                {t("cookieConsent.acceptOptional")}
              </button>
              <button className={CONSENT_ACTION_CLASS} onClick={rejectOptional} type="button">
                {t("cookieConsent.rejectOptional")}
              </button>
              <button className={CONSENT_ACTION_CLASS} onClick={() => setSettingsOpen(true)} type="button">
                {t("cookieConsent.settings")}
              </button>
            </div>
          </div>
        </aside>
      ) : null}

      {settingsOpen ? (
        <CookieSettingsDialog
          initialChoices={record}
          onClose={() => setSettingsOpen(false)}
          onSave={persist}
          onWithdraw={rejectOptional}
        />
      ) : null}
    </>
  );
}
