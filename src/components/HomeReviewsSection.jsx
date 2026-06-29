import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ScrollReveal } from "./motion.jsx";
import ReviewCard from "./ReviewCard.jsx";
import StarRating from "./StarRating.jsx";
import { getHighlightReviews, getPublicReviews } from "../api/review";

/**
 * Home 首页·玩家评价 section
 *
 * 旧位置:套餐列表(Fc26)下方;
 * 新位置:首页「服务保障」之上,作为转化路径上的社会证明。
 *
 * 数据策略:
 *   1) 优先取 9 条 highlight 评价
 *   2) 若空回落到最新评价(latest)
 * 展示:首 3 条直显,后 6 条折叠收纳,底部一枚"全部评价 →"。
 */
export default function HomeReviewsSection() {
  const { t } = useTranslation();
  const [list, setList] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const extraRef = useRef(null);
  const [extraHeight, setExtraHeight] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getHighlightReviews(9);
        const data = Array.isArray(res?.data) ? res.data : [];
        if (cancelled) return;
        if (data.length > 0) {
          setList(data);
        } else {
          const fallback = await getPublicReviews({
            pageNum: 1,
            pageSize: 9,
            sort: "latest",
          });
          if (!cancelled) setList(fallback?.rows || []);
        }
      } catch {
        if (!cancelled) setList([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 测量「可折叠 6 条」自然高度,响应式与首次渲染均覆盖
  useEffect(() => {
    if (!extraRef.current) return;
    const measure = () => {
      if (extraRef.current) {
        setExtraHeight(extraRef.current.scrollHeight);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(extraRef.current);
    return () => ro.disconnect();
  }, [list, loaded]);

  if (loaded && list.length === 0) return null;

  const first3 = list.slice(0, 3);
  const next6 = list.slice(3, 9);
  const canExpand = next6.length > 0;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <div className="text-center">
        <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7BFFCA]">
          {t("reviews.submitBadge")}
        </div>
        <h2 className="mt-3 text-[1.5rem] font-black tracking-[-0.025em] sm:text-[2rem]">
          {t("reviews.homeSectionTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#9AA7BD] sm:text-base">
          {t("reviews.homeSectionSubtitle")}
        </p>
      </div>

      {!loaded ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {first3.map((review, idx) => (
              <ScrollReveal key={review.id} delay={idx * 60} threshold={0.1}>
                <ReviewCard review={review} compact />
              </ScrollReveal>
            ))}
          </div>

          {canExpand && (
            <div
              style={{
                maxHeight: expanded ? `${extraHeight}px` : "0px",
                transition: "max-height 250ms ease-out, opacity 250ms ease-out",
                opacity: expanded ? 1 : 0,
                overflow: "hidden",
              }}
              aria-hidden={!expanded}
            >
              <div
                ref={extraRef}
                className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {next6.map((review) => (
                  <ReviewCard key={review.id} review={review} compact />
                ))}
              </div>
            </div>
          )}

          {canExpand && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-semibold text-[#9AA7BD] transition-colors hover:border-[#00FF9A]/30 hover:text-[#E7EDF7]"
                aria-expanded={expanded}
              >
                <span>
                  {expanded ? t("reviews.collapse") : t("reviews.expandMore")}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    transition: "transform 250ms ease-out",
                    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                    display: "inline-block",
                  }}
                >
                  ↓
                </span>
              </button>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 rounded-full border border-[#00FF9A]/30 bg-[#00FF9A]/8 px-6 py-3 text-sm font-bold text-[#7BFFCA] transition-colors hover:border-[#00FF9A]/60 hover:bg-[#00FF9A]/12 hover:text-[#00FF9A]"
            >
              <StarRating value={5} readOnly size="sm" />
              <span>{t("reviews.viewAll")}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
