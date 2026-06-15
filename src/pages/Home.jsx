import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ScrollReveal } from "../components/motion.jsx";

// 双向 scroll-driven progress 体系:
//   heroProgress    — 用户离开 Hero 区的进度(0 → 1)
//   closingProgress — Closing CTA 区进入视口的进度(0 → 1)
//   finalHeaderCta  = heroProgress * (1 - closingProgress)
//                     = Header CTA 应该显示的强度
// Hero CTA 跟随 heroProgress 渐隐 + 上飞;
// Closing 大 CTA 跟随 closingProgress 从上方"飞回"原位;
// Header CTA 在中段全显,在 Hero/Closing 两端淡出。
const HERO_PROGRESS_RATIO = 0.65;
const CLOSING_PROGRESS_RATIO = 0.5;
const HEADER_CTA_PROGRESS_EVENT = "home-header-cta-progress";

// 备份码教学已迁移至独立页面 /guide/backup-codes
// 入口位于 OrderAccountInfoModal 备份码字段旁的「如何获取? ↗」链接

function SectionEyebrow({ children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#00FF9A]/24 bg-[#00FF9A]/[0.05] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#7BFFCA]">
      <span className="h-1 w-1 rounded-full bg-[#00FF9A] shadow-[0_0_8px_rgba(0,255,154,0.6)]" />
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title, subtitle, align = "center" }) {
  const alignClass = align === "left" ? "text-left" : "mx-auto text-center";
  return (
    <ScrollReveal as="div" className={`mb-14 max-w-3xl ${alignClass}`}>
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2 className="hero-headline mt-5 text-[2.1rem] font-black leading-[1.04] tracking-normal sm:text-[2.8rem] md:text-[3.4rem]">
        {title}
      </h2>
      {subtitle ? (
        <p
          className={`mt-6 text-[15px] leading-7 text-[#9AA7BD] sm:text-base ${
            align === "left" ? "" : "mx-auto max-w-2xl"
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </ScrollReveal>
  );
}

function HeroSection({ t, heroProgress }) {
  // Hero CTA 跟随滚动渐隐 + 上飞 + 缩小。
  // 接近完全消失时禁用 pointer-events,避免拦截下方点击。
  const ctaStyle = {
    opacity: Math.max(0, 1 - heroProgress * 1.15),
    transform: `translateY(${-heroProgress * 14}px) scale(${1 - heroProgress * 0.28})`,
    pointerEvents: heroProgress > 0.72 ? "none" : "auto",
    willChange: "opacity, transform",
  };
  return (
    <section
      id="home-hero"
      className="relative isolate -mt-[76px] flex min-h-screen items-center justify-center overflow-hidden px-6 pt-[76px] sm:-mt-[82px] sm:pt-[82px]"
    >
      <div className="hero-backdrop" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <div className="reveal-up inline-flex items-center gap-2 rounded-full border border-[#00FF9A]/24 bg-[#00FF9A]/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7BFFCA]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9A] shadow-[0_0_10px_rgba(0,255,154,0.65)]" />
          {t("home.eyebrow")}
        </div>

        <h1 className="reveal-up delay-80 mt-7 text-[2.65rem] font-black leading-[0.98] tracking-normal sm:text-[3.6rem] md:text-[4.5rem] lg:text-[5.25rem]">
          <span className="hero-headline">{t("home.heroLine1")}</span>
          <br />
          <span className="hero-accent">{t("home.heroLine2")}</span>
        </h1>

        <p className="reveal-up delay-240 mt-7 max-w-xl text-[15px] leading-7 text-[#9AA7BD] sm:text-base">
          {t("home.tagline")}
        </p>

        <ul className="reveal-up delay-320 mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7BFFCA]/85 sm:text-[13px]">
          <li className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9A] shadow-[0_0_10px_rgba(0,255,154,0.6)]" />
            {t("home.pill.encrypted")}
          </li>
          <li className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9A] shadow-[0_0_10px_rgba(0,255,154,0.6)]" />
            {t("home.pill.fast")}
          </li>
          <li className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9A] shadow-[0_0_10px_rgba(0,255,154,0.6)]" />
            {t("home.pill.safe")}
          </li>
        </ul>

        <div className="reveal-up delay-400 mt-10">
          <Link
            to="/fc26-coins"
            className="cta-primary px-8 py-4 text-base"
            style={ctaStyle}
          >
            <span>{t("home.cta")}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3.75 10a.75.75 0 0 1 .75-.75h9.69l-3.22-3.22a.75.75 0 1 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H4.5A.75.75 0 0 1 3.75 10Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        <button
          type="button"
          onClick={() =>
            document
              .getElementById("how-to-buy")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="reveal-fade delay-560 group mt-20 inline-flex flex-col items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[#9AA7BD]/55 transition-colors hover:text-[#7BFFCA]"
          aria-label={t("home.scrollHint")}
        >
          <span>{t("home.scrollHint")}</span>
          <svg
            viewBox="0 0 24 36"
            fill="none"
            aria-hidden="true"
            className="h-9 w-6 transition-transform group-hover:translate-y-1"
          >
            <rect
              x="1"
              y="1"
              width="22"
              height="34"
              rx="11"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="12" cy="9" r="2" fill="currentColor">
              <animate
                attributeName="cy"
                values="9; 21; 9"
                dur="1.8s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1; 0.2; 1"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </button>
      </div>
    </section>
  );
}

function HowToBuySection({ t }) {
  const stepCount = 7;
  return (
    <section
      id="how-to-buy"
      className="relative mx-auto max-w-5xl scroll-mt-24 px-6 py-24 sm:py-32"
    >
      <SectionHeading
        eyebrow={t("home.howToBuy.eyebrow")}
        title={t("home.howToBuy.title")}
        subtitle={t("home.howToBuy.subtitle")}
      />
      <ol className="mx-auto grid max-w-3xl gap-3">
        {Array.from({ length: stepCount }).map((_, idx) => (
          <ScrollReveal
            key={idx}
            as="li"
            delay={idx * 60}
            className="flex items-start gap-4 rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(15,22,36,0.78),rgba(8,12,20,0.92))] p-5 sm:p-6"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#00FF9A]/30 bg-[#00FF9A]/[0.06] text-base font-black text-[#7BFFCA] shadow-[inset_0_0_10px_rgba(0,255,154,0.1),0_0_14px_rgba(0,255,154,0.18)]">
              {idx + 1}
            </div>
            <div className="pt-1 text-[15px] leading-7 text-[#E7EDF7]">
              {t(`home.howToBuy.step${idx + 1}`)}
            </div>
          </ScrollReveal>
        ))}
      </ol>
    </section>
  );
}

function GuaranteeIcon({ kind }) {
  if (kind === "noFee") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7 text-[#7BFFCA]">
        <path
          d="M12 2.6c2 .6 4.4.6 6.4 0 .4 1.6.4 3.6 0 5.6 0 5.4-3.2 9.8-6.4 11.2-3.2-1.4-6.4-5.8-6.4-11.2-.4-2-.4-4 0-5.6 2 .6 4.4.6 6.4 0z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M9 14l6-6M9.5 9.5h.01M14.5 13.5h.01"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (kind === "fastDelivery") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7 text-[#7BFFCA]">
        <path
          d="M3 8h10v8H3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M13 11h5l3 3v2h-8M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "afterSale") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7 text-[#7BFFCA]">
        <path
          d="M12 3l8 3v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 12l2.5 2.5L16 9.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "warranty7d") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7 text-[#7BFFCA]">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M9 9h6l-3 8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return null;
}

function GuaranteeSection({ t }) {
  const items = [
    { key: "noFee", icon: "noFee" },
    { key: "fastDelivery", icon: "fastDelivery" },
    { key: "afterSale", icon: "afterSale" },
    { key: "warranty7d", icon: "warranty7d" },
  ];
  return (
    <section className="relative mx-auto max-w-5xl scroll-mt-24 px-6 py-24 sm:py-32">
      <SectionHeading
        eyebrow={t("home.guarantee.eyebrow")}
        title={t("home.guarantee.title")}
        subtitle={t("home.guarantee.subtitle")}
      />
      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
        {items.map((item, idx) => (
          <ScrollReveal
            key={item.key}
            as="div"
            delay={idx * 80}
            className="package-card relative overflow-hidden rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(15,22,36,0.78),rgba(8,12,20,0.92))] p-6 sm:p-7"
          >
            <span className="pkg-card-glow" aria-hidden="true" />
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#00FF9A]/22 bg-[#00FF9A]/[0.05] shadow-[inset_0_0_14px_rgba(0,255,154,0.1)]">
                <GuaranteeIcon kind={item.icon} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black tracking-normal text-[#E7EDF7] sm:text-xl">
                  {t(`home.guarantee.items.${item.key}.title`)}
                </h3>
                <p className="mt-2 text-[14px] leading-7 text-[#9AA7BD] sm:text-[15px]">
                  {t(`home.guarantee.items.${item.key}.desc`)}
                </p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function WhyUsIcon({ kind }) {
  if (kind === "secure") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7 text-[#7BFFCA]">
        <path
          d="M12 3l8 3v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12.5" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 14.5v2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (kind === "support") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7 text-[#7BFFCA]">
        <path
          d="M5 11a7 7 0 0 1 14 0v5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <rect
          x="3.5"
          y="11.5"
          width="3.5"
          height="6"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="17"
          y="11.5"
          width="3.5"
          height="6"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M18 17.5v.5a3 3 0 0 1-3 3h-1.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="21" r="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (kind === "refund") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7 text-[#7BFFCA]">
        <rect
          x="3"
          y="7"
          width="18"
          height="11"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="12" cy="12.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7 10.5h.01M17 14.5h.01"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return null;
}

function WhyUsSection({ t }) {
  const items = [
    { key: "secure", icon: "secure" },
    { key: "support", icon: "support" },
    { key: "refund", icon: "refund" },
  ];
  return (
    <section className="relative mx-auto max-w-5xl scroll-mt-24 px-6 py-24 sm:py-32">
      <SectionHeading
        eyebrow={t("home.whyUs.eyebrow")}
        title={t("home.whyUs.title")}
        subtitle={t("home.whyUs.subtitle")}
      />
      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
        {items.map((item, idx) => (
          <ScrollReveal
            key={item.key}
            as="div"
            delay={idx * 100}
            className="package-card relative overflow-hidden rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(15,22,36,0.78),rgba(8,12,20,0.92))] p-7 text-center"
          >
            <span className="pkg-card-glow" aria-hidden="true" />
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-[#00FF9A]/22 bg-[#00FF9A]/[0.05] shadow-[inset_0_0_14px_rgba(0,255,154,0.1),0_0_18px_rgba(0,255,154,0.08)]">
              <WhyUsIcon kind={item.icon} />
            </div>
            <h3 className="text-lg font-black tracking-normal text-[#E7EDF7] sm:text-xl">
              {t(`home.whyUs.items.${item.key}.title`)}
            </h3>
            <p className="mt-3 text-[14px] leading-7 text-[#9AA7BD] sm:text-[15px]">
              {t(`home.whyUs.items.${item.key}.desc`)}
            </p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function ClosingCTA({ t, closingProgress }) {
  // Closing 大 CTA 跟随 closingProgress 从上方"飞回"原位:
  // progress 0 → 1:translateY -28 → 0 + scale 0.78 → 1 + opacity 0 → 1
  // 视觉上像 Header CTA 飞回到 Closing 大按钮原位。
  const ctaStyle = {
    opacity: closingProgress,
    transform: `translateY(${-(1 - closingProgress) * 28}px) scale(${0.78 + closingProgress * 0.22})`,
    pointerEvents: closingProgress < 0.3 ? "none" : "auto",
    willChange: "opacity, transform",
  };
  return (
    <section
      id="home-closing"
      className="mx-auto max-w-5xl scroll-mt-24 px-6 py-24 sm:py-28"
    >
      <ScrollReveal
        as="div"
        className="relative overflow-hidden rounded-[32px] border border-[#00FF9A]/24 bg-[linear-gradient(180deg,rgba(0,255,154,0.08),rgba(8,12,20,0.96))] px-6 py-14 text-center sm:px-12 sm:py-20"
      >
        <span className="pkg-card-glow" aria-hidden="true" />
        <h2 className="hero-headline mx-auto max-w-2xl text-[1.85rem] font-black leading-[1.04] tracking-normal sm:text-[2.5rem]">
          {t("home.closing.title")}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-[#9AA7BD]">
          {t("home.closing.subtitle")}
        </p>
        <div className="mt-8">
          <Link
            to="/fc26-coins"
            className="cta-primary px-8 py-4 text-base"
            style={ctaStyle}
          >
            {t("home.cta")}
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const [heroProgress, setHeroProgress] = useState(0);
  const [closingProgress, setClosingProgress] = useState(0);

  // 监听 #home-hero / #home-closing 滚动进度,合并广播 Header CTA 强度。
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const hero = document.getElementById("home-hero");
    const closing = document.getElementById("home-closing");
    if (!hero || !closing) return undefined;

    let rafId = null;
    const compute = () => {
      rafId = null;
      const viewportH = window.innerHeight || 1;

      // heroProgress:hero 离开视口的进度
      const heroRect = hero.getBoundingClientRect();
      const heroRaw = -heroRect.top / (viewportH * HERO_PROGRESS_RATIO);
      const hp = Math.max(0, Math.min(1, heroRaw));

      // closingProgress:closing 进入视口的进度
      // closing.top 从 viewportH(刚进入底部) → viewportH * (1 - RATIO) 时进度 0 → 1
      const closingRect = closing.getBoundingClientRect();
      const closingRaw =
        (viewportH - closingRect.top) / (viewportH * CLOSING_PROGRESS_RATIO);
      const cp = Math.max(0, Math.min(1, closingRaw));

      setHeroProgress(hp);
      setClosingProgress(cp);

      // Header CTA 在 Hero 滚出后 + Closing 未进入时最强
      const headerCtaProgress = hp * (1 - cp);
      window.dispatchEvent(
        new CustomEvent(HEADER_CTA_PROGRESS_EVENT, {
          detail: { progress: headerCtaProgress },
        }),
      );
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      // 离开首页时清零 Header CTA 的"首页驱动"进度,
      // 非首页 AppHeader 会基于路径独立决定 CTA 是否显示。
      window.dispatchEvent(
        new CustomEvent(HEADER_CTA_PROGRESS_EVENT, { detail: { progress: 0 } }),
      );
    };
  }, []);

  return (
    <main>
      <HeroSection t={t} heroProgress={heroProgress} />
      <HowToBuySection t={t} />
      <GuaranteeSection t={t} />
      <WhyUsSection t={t} />
      <ClosingCTA t={t} closingProgress={closingProgress} />
    </main>
  );
}
