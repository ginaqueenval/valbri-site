import { useState } from "react";
import { useTranslation } from "react-i18next";
import StarRating from "./StarRating.jsx";
import { markReviewHelpful } from "../api/review.js";
import { formatCoinsK, formatPlatform } from "../utils/orderDisplay.js";
import { safeGetItem, safeSetItem } from "../utils/safeStorage.js";

const TAG_LABELS = {
  fast: "reviews.tags.fast",
  safe: "reviews.tags.safe",
  friendly: "reviews.tags.friendly",
  cheap: "reviews.tags.cheap",
  smooth: "reviews.tags.smooth",
};

function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return String(raw).split(",").map((t) => t.trim()).filter(Boolean);
}

// 本地持久化已投票评价 ID,刷新页面后按钮保持「已点」态。
// 仅作为前端兜底,真正的去重在后端 vb_review_helpful 表。
const HELPFUL_VOTED_KEY = "valbri_helpful_voted";

function loadVotedSet() {
  try {
    const raw = safeGetItem(HELPFUL_VOTED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function persistVoted(reviewId) {
  try {
    const set = loadVotedSet();
    set.add(String(reviewId));
    // 上限保护:仅保留最近 500 条,防止 localStorage 无限增长
    const arr = Array.from(set).slice(-500);
    safeSetItem(HELPFUL_VOTED_KEY, JSON.stringify(arr));
  } catch {
    // 静默 — localStorage 不可用不致命
  }
}

function hasVotedLocally(reviewId) {
  if (reviewId == null) return false;
  return loadVotedSet().has(String(reviewId));
}

function maskPlayerName(name) {
  if (!name) return "—";
  const trimmed = String(name).trim();
  if (trimmed.length <= 2) return trimmed[0] + "*";
  return trimmed[0] + "*".repeat(Math.min(trimmed.length - 2, 4)) + trimmed.slice(-1);
}

function formatDate(value) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value.replace(" ", "T")) : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export default function ReviewCard({ review, compact = false, onHelpful }) {
  const { t } = useTranslation();
  const [helpfulCount, setHelpfulCount] = useState(review?.helpfulCount || 0);
  // 初始 voted 态:优先用后端返回的 review.voted(基于 voter_token LEFT JOIN),
  // 服务端无数据时降级到 localStorage(刷新/换页/换设备均能恢复)
  const [voted, setVoted] = useState(
    () =>
      review?.voted === 1 || review?.voted === true || hasVotedLocally(review?.id),
  );
  const [voting, setVoting] = useState(false);

  if (!review) return null;

  const tags = parseTags(review.tags);
  const displayName = review.anonymous === 1
    ? t("reviews.anonymousPlayer")
    : maskPlayerName(review.playerName || review.createBy);
  const platformLabel = review.platform ? formatPlatform(review.platform) : null;
  const isSbcReview = String(review.productType || "").toLowerCase() === "sbc";

  const handleHelpful = async () => {
    if (voted || voting) return;
    setVoting(true);
    try {
      const res = await markReviewHelpful(review.id);
      const data = res?.data || {};
      // 后端返回:alreadyVoted=true 表示已投过,本地补登记;voted=true 表示新增成功
      if (data.alreadyVoted) {
        setVoted(true);
        persistVoted(review.id);
        return;
      }
      setHelpfulCount((c) => c + 1);
      setVoted(true);
      persistVoted(review.id);
      onHelpful?.(review.id);
    } catch {
      // 静默失败,不阻断
    } finally {
      setVoting(false);
    }
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition-colors hover:border-[#00FF9A]/20 ${
        compact ? "" : "sm:p-6"
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#00FF9A]/20 to-[#00C97D]/10 text-base font-bold text-[#7BFFCA]">
            {displayName[0]?.toUpperCase() || "P"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[15px] font-semibold text-[#E7EDF7]">
              <span className="truncate">{displayName}</span>
              {platformLabel && (
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9AA7BD]">
                  {platformLabel}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[#9AA7BD]">
              <time>{formatDate(review.createTime)}</time>
              {!isSbcReview && Number(review.coins) > 0 && (
                <>
                  <span className="text-[#3F4C66]">│</span>
                  <span className="tabular-nums">
                    {t("reviews.purchased")} {formatCoinsK(review.coins)}
                    {Number(review.giftCoins) > 0 && (
                      <span className="ml-1 text-[#7BFFCA]">
                        +{formatCoinsK(review.giftCoins)} {t("fc26.gift")}
                      </span>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {(() => {
          const mins = Number(review.deliveryMinutes);
          if (!mins || mins <= 0 || mins > 1440) return null;
          const label =
            mins < 60
              ? t("reviews.deliveredInMinutes", { minutes: mins })
              : t("reviews.deliveredInHours", {
                  hours: (mins / 60).toFixed(mins % 60 === 0 ? 0 : 1),
                });
          return (
            <div className="hidden shrink-0 rounded-full border border-[#00FF9A]/20 bg-[#00FF9A]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7BFFCA] sm:inline-block">
              {label}
            </div>
          );
        })()}
      </header>

      <div className="mt-3">
        <StarRating value={review.rating || 0} readOnly size="md" />
      </div>

      {review.content && (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#E7EDF7]">
          {review.content}
        </p>
      )}

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#00FF9A]/15 bg-[#00FF9A]/5 px-2.5 py-1 text-[11px] font-semibold text-[#7BFFCA]"
            >
              # {t(TAG_LABELS[tag] || `reviews.tags.${tag}`, tag)}
            </span>
          ))}
        </div>
      )}

      <footer className="mt-4 flex items-center justify-end gap-3 border-t border-white/5 pt-3 text-xs text-[#9AA7BD]">
        <button
          type="button"
          onClick={handleHelpful}
          disabled={voted || voting}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold transition-colors ${
            voted
              ? "border-[#00FF9A]/30 bg-[#00FF9A]/10 text-[#7BFFCA]"
              : "border-white/10 bg-white/5 text-[#9AA7BD] hover:border-[#00FF9A]/30 hover:text-[#7BFFCA]"
          }`}
          aria-label={t("reviews.helpful")}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
            <path d="M2 21h4V9H2v12Zm20-11a2 2 0 0 0-2-2h-6.31l.95-4.57.03-.32a1.5 1.5 0 0 0-.44-1.06L13.17 1 6.59 7.58A2 2 0 0 0 6 9v10a2 2 0 0 0 2 2h9a2 2 0 0 0 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2Z" />
          </svg>
          <span>{t("reviews.helpful")}</span>
          {helpfulCount > 0 && <span className="opacity-70">· {helpfulCount}</span>}
        </button>
      </footer>
    </article>
  );
}
