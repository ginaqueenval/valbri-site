import { useTranslation } from "react-i18next";
import { LEGAL_ENTITY } from "../legal/policies.js";

export default function About() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">{t('about.title')}</h1>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        {t('about.description1')}
      </p>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        {t('about.description2')}
      </p>

      <div className="mt-6 rounded-lg border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4 text-sm leading-6 text-[#9AA7BD]">
        <span className="font-semibold text-[#DFFFEF]">{LEGAL_ENTITY.name}</span>
        {` · Registration No. ${LEGAL_ENTITY.registrationNumber} · ${LEGAL_ENTITY.address}`}
        {LEGAL_ENTITY.verificationStatus === "pending-legal-verification" ? (
          <div className="mt-2 text-xs text-[#8794AA]">{t("about.entityReview")}</div>
        ) : null}
      </div>
    </main>
  );
}
