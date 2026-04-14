import { useTranslation } from "react-i18next";

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

      <div className="mt-6 rounded-2xl border border-[#00FF9A]/15 bg-[#00FF9A]/5 p-4 text-sm text-[#9AA7BD]">
        {t('about.notice')}
      </div>
    </main>
  );
}
