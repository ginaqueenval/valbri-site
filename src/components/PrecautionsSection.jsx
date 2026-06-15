import { useTranslation } from "react-i18next";

const PRECAUTION_ITEM_KEYS = [1, 2, 3, 5];

export default function PrecautionsSection() {
  const { t } = useTranslation();

  return (
    <section className="mt-16 rounded-[32px] border border-white/6 bg-[#080C12] px-5 py-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_24px_70px_rgba(0,0,0,0.28)] sm:mt-20 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <div className="text-[11px] font-black uppercase tracking-[0.34em] text-[#7BFFCA]">
          {t("home.precautions.eyebrow")}
        </div>
        <h2 className="mt-6 text-[2rem] font-black leading-[1.04] tracking-[-0.035em] text-[#E7EDF7] sm:text-[2.7rem]">
          {t("home.precautions.title")}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-7 text-[#9AA7BD] sm:text-base">
          {t("home.precautions.subtitle")}
        </p>
      </div>

      <div role="list" className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PRECAUTION_ITEM_KEYS.map((itemKey, idx) => (
          <article
            key={itemKey}
            role="listitem"
            className="group relative min-h-[14rem] overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,21,34,0.68),rgba(7,11,18,0.9))] p-7 transition-all duration-300 hover:border-[#00FF9A]/32 hover:bg-[#0A1517] hover:shadow-[0_0_0_1px_rgba(0,255,154,0.08),0_0_38px_rgba(0,255,154,0.1)] sm:p-8"
          >
            <div className="flex items-center gap-4">
              <div className="shrink-0 text-[3.15rem] font-black leading-none tracking-[-0.08em] text-[#334057] transition-colors duration-300 group-hover:text-[#62D4AE]">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <h3 className="min-w-0 text-lg font-black tracking-[-0.012em] text-[#F1F6FF] transition-colors duration-300 group-hover:text-[#F8FFFB] sm:text-xl">
                {t(`home.precautions.item${itemKey}.title`)}
              </h3>
            </div>
            <p className="mt-6 text-[15px] leading-7 text-[#9AA7BD]">
              {t(`home.precautions.item${itemKey}.desc`)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
