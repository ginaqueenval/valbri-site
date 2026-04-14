import { useTranslation } from "react-i18next";

export default function Terms() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">{t('terms.title')}</h1>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        {t('terms.intro')}
      </p>

      <h2 className="mt-8 text-lg font-bold">{t('terms.serviceScope.title')}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        {t('terms.serviceScope.content')}
      </p>

      <h2 className="mt-6 text-lg font-bold">{t('terms.payments.title')}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        {t('terms.payments.content')}
      </p>

      <h2 className="mt-6 text-lg font-bold">{t('terms.userResponsibilities.title')}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        {t('terms.userResponsibilities.content')}
      </p>

      <h2 className="mt-6 text-lg font-bold">{t('terms.changes.title')}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        {t('terms.changes.content')}
      </p>

      <div className="mt-8 rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4 text-xs text-[#9AA7BD]">
        {t('terms.lastUpdated', { date: new Date().toLocaleDateString() })}
      </div>
    </main>
  );
}
