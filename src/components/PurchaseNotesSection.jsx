import { useTranslation } from "react-i18next";
import { ScrollReveal } from "./motion.jsx";

/**
 * 购买须知 · 苹果设计角度的步骤式呈现
 *
 * 设计要点:
 *   1. 大号灰序号(01-05)作为视觉锚,hover 时微微泛绿(#7BFFCA/40)— 类 iOS What's New
 *   2. 极简卡片:无图标、无警告色,仅左上序号与右侧标题+描述,空气感优先
 *   3. 1/2/3 列响应式网格,5 条自然排成 3+2(桌面)/ 2+2+1(平板)/ 5×1(移动)
 *   4. 与套餐区主品牌色 #00FF9A 呼应,信任语境保持柔和而非警告
 *
 * 文案 key 复用 home.precautions.*,避免 i18n 双份维护。
 */
export default function PurchaseNotesSection() {
  const { t } = useTranslation();
  const itemCount = 5;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:pb-24 sm:pt-20">
      <ScrollReveal as="div" className="mb-10 text-center sm:mb-12">
        <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7BFFCA]">
          {t("home.precautions.eyebrow")}
        </div>
        <h2 className="mt-3 text-[1.5rem] font-black tracking-normal text-[#E7EDF7] sm:text-[2rem]">
          {t("home.precautions.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#9AA7BD] sm:text-base">
          {t("home.precautions.subtitle")}
        </p>
      </ScrollReveal>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: itemCount }).map((_, idx) => (
          <ScrollReveal
            key={idx}
            as="div"
            delay={idx * 60}
            className="h-full"
          >
            <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(15,22,36,0.6),rgba(8,12,20,0.85))] p-5 transition-all duration-500 hover:border-[#00FF9A]/24 hover:shadow-[0_0_28px_rgba(0,255,154,0.08)] sm:p-6">
              {/* 角落微高光,hover 时浮起,致敬 Apple Card 边角光 */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#00FF9A]/0 blur-2xl transition-all duration-500 group-hover:bg-[#00FF9A]/[0.06]"
              />

              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[2.2rem] font-black leading-none tracking-normal text-[#3A4456] transition-colors duration-500 group-hover:text-[#7BFFCA]/60 sm:text-[2.4rem]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="text-[15px] font-bold tracking-normal text-[#E7EDF7] sm:text-base">
                  {t(`home.precautions.item${idx + 1}.title`)}
                </h3>
              </div>

              <p className="mt-3 text-[13.5px] leading-6 text-[#9AA7BD] sm:text-sm sm:leading-[1.7]">
                {t(`home.precautions.item${idx + 1}.desc`)}
              </p>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
