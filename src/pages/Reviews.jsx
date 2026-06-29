import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPublicReviews, getPackageReviewStats } from "../api/review";
import ReviewCard from "../components/ReviewCard.jsx";
import StarRating from "../components/StarRating.jsx";
import { ScrollReveal } from "../components/motion.jsx";

function SortDropdown({ value, onChange, options, t }) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open || !triggerRef.current) return undefined;
    const update = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      setAnchor({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const current = options.find((o) => o.value === value) || options[0];

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div className="relative ml-auto">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-[#E7EDF7] outline-none transition-colors hover:border-[#00FF9A]/30 focus:border-[#00FF9A]/40"
      >
        <span>{t(current.labelKey)}</span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3 w-3 text-[#9AA7BD] transition-transform duration-200 ${
            open ? "rotate-180 text-[#7BFFCA]" : ""
          }`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && anchor && createPortal(
        <>
          <button
            type="button"
            aria-label="close"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[1000] cursor-default bg-transparent"
          />
          <div
            role="listbox"
            className="fixed z-[1001] min-w-[160px] overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220]/95 shadow-[0_16px_34px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            style={{
              top: `${anchor.top}px`,
              right: `${anchor.right}px`,
              animation: "reviews-dropdown-in 160ms ease-out both",
            }}
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => handleSelect(opt.value)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs font-semibold transition-colors ${
                    active
                      ? "bg-[#00FF9A]/12 text-[#00FF9A]"
                      : "text-[#9AA7BD] hover:bg-white/5 hover:text-[#E7EDF7]"
                  }`}
                >
                  <span>{t(opt.labelKey)}</span>
                  {active && (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4L8.5 12l6.8-6.7a1 1 0 0 1 1.4 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

const PLATFORMS = [
  { value: "PS/Xbox", label: "PS/Xbox" },
  { value: "PC", label: "PC" },
];
const RATING_FILTERS = [
  { value: "", labelKey: "reviews.filterAll", shortKey: "reviews.filterAll" },
  {
    value: "positive",
    labelKey: "reviews.filterStarPositive",
    shortKey: "reviews.filterStarPositiveShort",
    min: 4,
    max: 5,
  },
  {
    value: "neutral",
    labelKey: "reviews.filterStarNeutral",
    shortKey: "reviews.filterStarNeutralShort",
    min: 3,
    max: 3,
  },
  {
    value: "negative",
    labelKey: "reviews.filterStarNegative",
    shortKey: "reviews.filterStarNegativeShort",
    min: 1,
    max: 2,
  },
];
const SORT_OPTIONS = [
  { value: "latest", labelKey: "reviews.sortLatest" },
  { value: "helpful", labelKey: "reviews.sortHelpful" },
  { value: "rating_desc", labelKey: "reviews.sortRatingDesc" },
  { value: "rating_asc", labelKey: "reviews.sortRatingAsc" },
];

function EmptyState({ t }) {
  return (
    <div className="reveal-up flex flex-col items-center px-6 pb-8 pt-16 text-center sm:pt-24">
      <div className="grid h-24 w-24 place-items-center rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,154,0.14),rgba(15,22,36,0.6)_72%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_22px_50px_rgba(0,255,154,0.08)] sm:h-28 sm:w-28">
        <svg viewBox="0 0 48 48" className="h-11 w-11 text-[#7BFFCA]" fill="currentColor">
          <path d="M24 4 30 18l16 1.5-12 11 3.6 16L24 38l-13.6 8.5L14 30 2 19.5 18 18 24 4z" />
        </svg>
      </div>
      <h3 className="mt-7 text-[22px] font-black tracking-[-0.025em] text-[#E7EDF7] sm:text-[26px]">
        {t("reviews.noReviewsTitle")}
      </h3>
      <p className="mt-3 max-w-md text-[14px] leading-6 text-[#9AA7BD] sm:text-[15px]">
        {t("reviews.noReviewsDesc")}
      </p>
    </div>
  );
}

function RatingDistribution({ stats, t }) {
  const dist = stats?.ratingDistribution ||
    stats?.distribution || {
      5: stats?.count5 ?? 0,
      4: stats?.count4 ?? 0,
      3: stats?.count3 ?? 0,
      2: stats?.count2 ?? 0,
      1: stats?.count1 ?? 0,
    };
  const total = Object.values(dist).reduce((sum, v) => sum + (Number(v) || 0), 0);
  if (total === 0) return null;
  return (
    <div className="grid gap-2">
      {[5, 4, 3, 2, 1].map((n) => {
        const count = Number(dist[n] || dist[String(n)] || 0);
        const pct = total === 0 ? 0 : Math.round((count / total) * 100);
        return (
          <div key={n} className="flex items-center gap-3 text-xs">
            <span className="w-14 shrink-0 text-[#9AA7BD]">
              {t("reviews.starsLabel", { n })}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FFC233] to-[#FF9F30]"
                style={{ width: `${pct}%`, transition: "width 0.8s ease" }}
              />
            </div>
            <span className="w-12 shrink-0 text-right font-semibold tabular-nums text-[#C9D3E5]">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Reviews() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const packageId = searchParams.get("packageId");
  const [platform, setPlatform] = useState(searchParams.get("platform") || "");
  const [ratingFilter, setRatingFilter] = useState(searchParams.get("rating") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "latest");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const ratingSpec = useMemo(
    () => RATING_FILTERS.find((r) => r.value === ratingFilter) || RATING_FILTERS[0],
    [ratingFilter],
  );

  useEffect(() => {
    if (!packageId) {
      setStats(null);
      return;
    }
    let cancelled = false;
    getPackageReviewStats(packageId)
      .then((res) => {
        if (!cancelled) setStats(res?.data || null);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, [packageId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { pageNum: page, pageSize, sort };
      if (packageId) params.packageId = packageId;
      if (platform) params.platform = platform;
      if (ratingSpec.min) params.minRating = ratingSpec.min;
      if (ratingSpec.max) params.maxRating = ratingSpec.max;
      const res = await getPublicReviews(params);
      setList(res.rows || []);
      setTotal(res.total || 0);
    } catch {
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, sort, platform, ratingSpec, packageId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const averageRating = Number(
    stats?.avgRating ?? stats?.averageRating ?? stats?.average ?? 0,
  );
  const statsTotal = Number(
    stats?.totalReviews ?? stats?.totalCount ?? stats?.total ?? total,
  );

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:pt-14">
      <style>
        {`
          .reviews-filter-scroll::-webkit-scrollbar { display: none; }
          .reviews-filter-scroll { scrollbar-width: none; }
        `}
      </style>
      <header className="reveal-up">
        <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7BFFCA]">
          {t("reviews.submitBadge")}
        </div>
        <h1 className="mt-2 text-[2rem] font-black leading-[1.05] tracking-[-0.035em] sm:text-[2.5rem]">
          {t("reviews.pageTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9AA7BD] sm:text-base">
          {t("reviews.pageSubtitle")}
        </p>
      </header>

      {stats && (
        <ScrollReveal className="mt-8 rounded-[24px] border border-white/8 bg-white/[0.03] p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-10">
            <div className="text-center sm:text-left">
              <div className="text-5xl font-black tracking-tight text-[#FFC233] sm:text-6xl">
                {Number(averageRating).toFixed(1)}
              </div>
              <div className="mt-2 flex justify-center sm:justify-start">
                <StarRating value={averageRating} readOnly size="md" />
              </div>
              <div className="mt-2 text-xs text-[#9AA7BD]">
                {t("reviews.totalCount", { count: statsTotal })}
              </div>
            </div>
            <div className="min-w-0">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#6E7B92]">
                {t("reviews.rateDistribution")}
              </div>
              <RatingDistribution stats={stats} t={t} />
            </div>
          </div>
        </ScrollReveal>
      )}

      <div className="reveal-up mt-8 flex flex-wrap items-center gap-3">
        <div className="reviews-filter-scroll w-full overflow-x-auto sm:w-auto sm:overflow-visible">
          <div className="inline-flex gap-1 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] p-1">
            {RATING_FILTERS.map((r) => (
              <button
                key={r.value || "all"}
                onClick={() => {
                  setRatingFilter(r.value);
                  updateFilter("rating", r.value);
                }}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all sm:px-3.5 sm:py-1.5 sm:text-sm ${
                  ratingFilter === r.value
                    ? "bg-[#00FF9A]/14 text-[#00FF9A] shadow-[0_0_0_1px_rgba(0,255,154,0.18)]"
                    : "text-[#9AA7BD] hover:text-[#E7EDF7]"
                }`}
              >
                <span className="sm:hidden">{t(r.shortKey)}</span>
                <span className="hidden sm:inline">{t(r.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="inline-flex gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
          <button
            onClick={() => {
              setPlatform("");
              updateFilter("platform", "");
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              !platform ? "bg-white/10 text-[#E7EDF7]" : "text-[#9AA7BD]"
            }`}
          >
            {t("reviews.filterAll")}
          </button>
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                setPlatform(p.value);
                updateFilter("platform", p.value);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                platform === p.value
                  ? "bg-white/10 text-[#E7EDF7]"
                  : "text-[#9AA7BD]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <SortDropdown
          value={sort}
          onChange={(next) => {
            setSort(next);
            updateFilter("sort", next);
          }}
          options={SORT_OPTIONS}
          t={t}
        />
      </div>

      <div className="mt-6 grid gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]"
            />
          ))
        ) : list.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          list.map((review, idx) => (
            <ScrollReveal key={review.id} delay={idx * 30} threshold={0.1}>
              <ReviewCard review={review} />
            </ScrollReveal>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[#9AA7BD] transition-colors hover:border-[#00FF9A]/30 hover:text-[#E7EDF7] disabled:opacity-30"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-[#9AA7BD]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[#9AA7BD] transition-colors hover:border-[#00FF9A]/30 hover:text-[#E7EDF7] disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}
    </main>
  );
}
