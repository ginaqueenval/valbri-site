import { useTranslation } from "react-i18next";
import { LEGAL_ENTITY } from "../legal/policies.js";

export default function Contact() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">{t('contact.title')}</h1>

      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9AA7BD]">
        {t('contact.description')}
      </p>

      <div className="mt-6 rounded-lg border border-white/5 bg-[#0B1220]/60 p-6">
        <div className="text-sm font-semibold">{t('contact.email')}</div>
        <a className="mt-1 inline-block text-sm text-[#00FF9A]" href={`mailto:${LEGAL_ENTITY.supportEmail}`}>
          {LEGAL_ENTITY.supportEmail}
        </a>

        <div className="mt-4 text-xs text-[#9AA7BD]">
          {t('contact.responseTime')}
        </div>
      </div>
    </main>
  );
}
