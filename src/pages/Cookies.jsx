import { useTranslation } from "react-i18next";
import LegalPolicyPage from "../components/LegalPolicyPage.jsx";
import { openCookieSettings } from "../utils/consentStorage.js";

export default function Cookies() {
  const { t, i18n } = useTranslation();
  return (
    <LegalPolicyPage type="cookies">
      <section className="mt-8 border-t border-white/10 pt-7" lang={i18n.resolvedLanguage}>
        <button
          className="h-11 rounded-lg border border-[#00FF9A]/40 px-5 text-sm font-semibold text-[#7BFFCA] hover:bg-[#00FF9A]/10"
          onClick={openCookieSettings}
          type="button"
        >
          {t("cookieConsent.manage")}
        </button>
      </section>
    </LegalPolicyPage>
  );
}
