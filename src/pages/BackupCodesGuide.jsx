import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollReveal } from "../components/motion.jsx";

// 备份码教学独立页 — 完全无 chrome
// 入口:OrderAccountInfoModal 中备份码 label 旁「如何获取? ↗」link
// 设计原则:此页是新浏览器窗口的全部内容,主要服务移动端教学引导
// 桌面端打开也保持同样的简洁,不带 AppHeader/Footer/CustomerService

const BACKUP_CODE_SHOTS = [
  { src: "/backup-codes/step1.png", stepRange: "1 – 2", labelKey: "guide.backupCodes.shot1" },
  { src: "/backup-codes/step2.png", stepRange: "3 – 4", labelKey: "guide.backupCodes.shot2" },
  { src: "/backup-codes/step3.png", stepRange: "5", labelKey: "guide.backupCodes.shot3" },
  { src: "/backup-codes/step4.png", stepRange: "6 – 7", labelKey: "guide.backupCodes.shot4" },
];

function BackupShotImage({ shot, alt }) {
  const [errored, setErrored] = useState(false);
  const [node, setNode] = useState(null);

  useEffect(() => {
    if (!node) return undefined;
    const cssSupported =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("animation-timeline", "view()");
    if (cssSupported) return undefined;
    if (typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const rect = entry.boundingClientRect;
          const viewportH = entry.rootBounds?.height ?? window.innerHeight;
          const entryProgress = Math.max(
            0,
            Math.min(1, 1 - rect.top / viewportH),
          );
          const scale = 0.94 + entryProgress * 0.06;
          node.style.transform = `scale(${scale.toFixed(3)})`;
        });
      },
      { threshold: Array.from({ length: 40 }, (_, i) => i / 40) },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  if (errored) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#9AA7BD]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="h-6 w-6"
          >
            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M3 17l5-5 5 4 3-3 5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="8.5" cy="10" r="1.4" fill="currentColor" />
          </svg>
        </div>
      </div>
    );
  }
  return (
    <img
      ref={setNode}
      src={shot.src}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className="scroll-zoom-img block w-full"
    />
  );
}

export default function BackupCodesGuide() {
  const { t, i18n } = useTranslation();
  const stepCount = 7;

  // 设置浏览器 tab 标题 — 新窗口体验关键
  useEffect(() => {
    const previous = document.title;
    document.title = t("guide.backupCodes.title");
    return () => {
      document.title = previous;
    };
  }, [t, i18n.language]);

  return (
    <main className="min-h-screen bg-[#070A0F] text-[#E7EDF7]">
      {/* 极简顶栏:仅 logo + 语言切换,无导航 */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#070A0F]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-8 sm:py-4">
          <div className="flex items-center gap-2 text-[15px] font-black tracking-tight">
            <span className="inline-block h-2 w-2 rounded-full bg-[#00FF9A] shadow-[0_0_10px_rgba(0,255,154,0.6)]" />
            Valbri
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] p-1 text-[11px]">
            <button
              type="button"
              onClick={() => i18n.changeLanguage("zh")}
              className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                i18n.language?.startsWith("zh")
                  ? "bg-[#00FF9A]/15 text-[#7BFFCA]"
                  : "text-[#9AA7BD] hover:text-[#E7EDF7]"
              }`}
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => i18n.changeLanguage("en")}
              className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                i18n.language?.startsWith("en")
                  ? "bg-[#00FF9A]/15 text-[#7BFFCA]"
                  : "text-[#9AA7BD] hover:text-[#E7EDF7]"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-20">
        {/* 标题区 */}
        <ScrollReveal as="div" className="mb-10 text-center sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00FF9A]/24 bg-[#00FF9A]/[0.05] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#7BFFCA]">
            <span className="h-1 w-1 rounded-full bg-[#00FF9A] shadow-[0_0_8px_rgba(0,255,154,0.6)]" />
            {t("guide.backupCodes.eyebrow")}
          </div>
          <h1 className="mt-5 text-[1.85rem] font-black leading-[1.08] tracking-[-0.04em] sm:text-[2.6rem] md:text-[3.1rem]">
            {t("guide.backupCodes.title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[14px] leading-7 text-[#9AA7BD] sm:text-[15px]">
            {t("guide.backupCodes.subtitle")}
          </p>
        </ScrollReveal>

        {/* EA 链接卡片 */}
        <ScrollReveal
          as="div"
          className="mx-auto max-w-3xl rounded-3xl border border-[#00FF9A]/22 bg-[linear-gradient(180deg,rgba(0,255,154,0.06),rgba(8,12,20,0.94))] p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-[#7BFFCA]"
            >
              <path
                d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1 3-6z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-[14px] leading-7 text-[#C9D3E5] sm:text-[15px]">
              {t("guide.backupCodes.linkPrefix")}{" "}
              <a
                href="https://myaccount.ea.com/cp-ui/security/index"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#7BFFCA] underline decoration-[#00FF9A]/40 decoration-dotted underline-offset-4 transition-colors hover:text-[#00FF9A]"
              >
                myaccount.ea.com
              </a>
            </p>
          </div>
        </ScrollReveal>

        {/* 7 步教学 */}
        <ol className="mx-auto mt-6 grid max-w-3xl gap-3">
          {Array.from({ length: stepCount }).map((_, idx) => (
            <ScrollReveal
              key={idx}
              as="li"
              delay={idx * 50}
              className="flex items-start gap-4 rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(15,22,36,0.78),rgba(8,12,20,0.92))] p-4 sm:p-5"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cyan-300/24 bg-cyan-400/[0.08] text-sm font-black text-cyan-200">
                {idx + 1}
              </div>
              <div className="pt-1 text-[14px] leading-7 text-[#E7EDF7] sm:text-[15px]">
                {t(`guide.backupCodes.step${idx + 1}`)}
              </div>
            </ScrollReveal>
          ))}
        </ol>

        {/* 4 张截图 */}
        <div className="mx-auto mt-14 grid max-w-[1280px] gap-16 sm:mt-20 sm:gap-24">
          {BACKUP_CODE_SHOTS.map((shot, idx) => (
            <ScrollReveal
              key={shot.src}
              as="figure"
              delay={idx * 80}
              className="group"
            >
              <div className="overflow-hidden rounded-[18px] shadow-[0_30px_80px_rgba(0,0,0,0.42),0_0_50px_rgba(0,255,154,0.04)] ring-1 ring-white/[0.06] transition-shadow duration-700 group-hover:shadow-[0_40px_110px_rgba(0,0,0,0.5),0_0_80px_rgba(0,255,154,0.08)] group-hover:ring-[#00FF9A]/14 sm:rounded-[28px]">
                <BackupShotImage shot={shot} alt={t(shot.labelKey)} />
              </div>
              <figcaption className="mt-5 flex flex-wrap items-center justify-center gap-3 px-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00FF9A]/26 bg-[#00FF9A]/[0.08] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#7BFFCA]">
                  <span className="h-1 w-1 rounded-full bg-[#00FF9A] shadow-[0_0_6px_rgba(0,255,154,0.7)]" />
                  Step {shot.stepRange}
                </span>
                <span className="text-[13px] font-medium text-[#C9D3E5] sm:text-[14px]">
                  {t(shot.labelKey)}
                </span>
              </figcaption>
            </ScrollReveal>
          ))}
        </div>

        {/* footnote */}
        <ScrollReveal
          as="p"
          className="mx-auto mt-14 max-w-3xl text-center text-[13px] leading-7 text-[#9AA7BD]/80 sm:mt-20"
        >
          {t("guide.backupCodes.footnote")}
        </ScrollReveal>

        {/* 底部:返回提示 + 关闭窗口 */}
        <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-3 border-t border-white/5 pt-8 text-center sm:mt-16">
          <p className="text-[12px] text-[#9AA7BD]/70">
            {t("guide.backupCodes.closeHint")}
          </p>
          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-[13px] font-semibold text-[#E7EDF7] transition-colors hover:border-[#00FF9A]/30 hover:text-[#7BFFCA]"
          >
            {t("guide.backupCodes.closeWindow")}
          </button>
        </div>
      </section>
    </main>
  );
}
