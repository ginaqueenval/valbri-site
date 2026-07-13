import { useTranslation } from "react-i18next";

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">{t('privacy.title')}</h1>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        {t('privacy.intro')}
      </p>

      <h2 className="mt-8 text-lg font-bold">{t('privacy.collect.title')}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        {t('privacy.collect.content')}
      </p>

      <h2 className="mt-6 text-lg font-bold">{t('privacy.use.title')}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        {t('privacy.use.content')}
      </p>

      <h2 className="mt-6 text-lg font-bold">{t('privacy.security.title')}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        {t('privacy.security.content')}
      </p>

      <h2 className="mt-6 text-lg font-bold">{t('privacy.sharing.title')}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#9AA7BD]">
        {t('privacy.sharing.content')}
      </p>

      <div className="mt-8 rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4 text-xs text-[#9AA7BD]">
        {t('privacy.lastUpdated', { date: new Date().toLocaleDateString() })}
      </div>
    </main>
  );
}
