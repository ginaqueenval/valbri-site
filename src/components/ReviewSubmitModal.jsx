import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import StarRating from "./StarRating.jsx";
import { submitReview, editReview } from "../api/review.js";
import useBodyScrollLock from "../utils/useBodyScrollLock.js";

const SERVICE_TAGS = ["fast", "safe", "friendly", "cheap", "smooth"];
const MAX_CONTENT_LEN = 500;

function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return String(raw).split(",").map((t) => t.trim()).filter(Boolean);
}

export default function ReviewSubmitModal({ open, order, existing, onClose, onSaved }) {
  const { t } = useTranslation();
  const isEdit = Boolean(existing?.id);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [anonymous, setAnonymous] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState("");

  const editableExpired = useMemo(() => {
    if (!existing?.editableUntil) return false;
    const until = new Date(String(existing.editableUntil).replace(" ", "T"));
    return !Number.isNaN(until.getTime()) && until.getTime() < Date.now();
  }, [existing]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setSucceeded(false);
    if (isEdit) {
      setRating(existing.rating || 5);
      setContent(existing.content || "");
      setTags(parseTags(existing.tags));
      setAnonymous(existing.anonymous === 1 ? 1 : 0);
    } else {
      setRating(5);
      setContent("");
      setTags([]);
      setAnonymous(0);
    }
  }, [open, isEdit, existing]);


  // 锁背景滚动 — hook 必须在 early return 之前调用
  useBodyScrollLock(open);

  if (!open) return null;

  const toggleTag = (tag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (rating < 1 || rating > 5) {
      setError(t("reviews.errors.ratingRequired"));
      return;
    }
    if (!content.trim() || content.trim().length < 5) {
      setError(t("reviews.errors.contentTooShort"));
      return;
    }
    if (content.length > MAX_CONTENT_LEN) {
      setError(t("reviews.errors.contentTooLong", { max: MAX_CONTENT_LEN }));
      return;
    }
    setSubmitting(true);
    setError("");
    const payload = {
      rating,
      content: content.trim(),
      tags: tags.join(","),
      anonymous,
    };
    if (isEdit) {
      payload.id = existing.id;
    } else if (order?.id) {
      payload.orderId = order.id;
    }
    try {
      const res = isEdit ? await editReview(payload) : await submitReview(payload);
      onSaved?.(res?.data);
      // 进入成功态 — modal 不自动关闭,等用户点「完成」按钮才关闭
      setSucceeded(true);
    } catch (err) {
      setError(err.message || t("reviews.errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const lockEdit = isEdit && editableExpired;
  const orderHint = order?.orderNo || existing?.orderNo;
  const packageName = order?.packageName || existing?.packageName;

  // 成功态:替换 form 内容为 checkmark + 反馈面板,Apple Pay 完成页同源体验
  if (succeeded) {
    return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:px-4">
        <div className="modal-sheet scrollbar-thin relative w-full overflow-y-auto rounded-t-[28px] border border-[#00FF9A]/20 border-b-transparent bg-[linear-gradient(180deg,rgba(15,22,36,0.96),rgba(8,12,20,0.98))] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-left shadow-[0_-24px_60px_rgba(0,0,0,0.45)] sm:max-w-xl sm:rounded-[24px] sm:border-b sm:p-7 sm:pb-7 sm:shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" aria-hidden="true" />
          <div className="flex flex-col items-center gap-5 py-8 sm:py-10">
            {/* checkmark 圆 — 圆圈 scale 0→1.1→1 弹入,钩 stroke draw */}
            <div className="review-success-circle relative grid h-20 w-20 place-items-center rounded-full border border-[#00FF9A]/30 bg-[#00FF9A]/[0.12] shadow-[0_0_32px_rgba(0,255,154,0.32)]">
              <svg
                viewBox="0 0 24 24"
                className="h-10 w-10"
                fill="none"
                stroke="#00FF9A"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path className="review-success-check" d="M6 12.5l4 4 8-8" />
              </svg>
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-black tracking-[-0.02em] text-[#E7EDF7] sm:text-2xl">
                {isEdit
                  ? t("reviews.editSuccess.title")
                  : t("reviews.submitSuccess.title")}
              </h3>
              <p className="max-w-xs text-sm leading-6 text-[#9AA7BD]">
                {isEdit
                  ? t("reviews.editSuccess.desc")
                  : t("reviews.submitSuccess.desc")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cta-primary min-h-[44px] px-8 text-sm"
            >
              {t("reviews.success.done")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:px-4">
      <div className="modal-sheet scrollbar-thin relative w-full overflow-y-auto rounded-t-[28px] border border-[#00FF9A]/20 border-b-transparent bg-[linear-gradient(180deg,rgba(15,22,36,0.96),rgba(8,12,20,0.98))] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-left shadow-[0_-24px_60px_rgba(0,0,0,0.45)] sm:max-w-xl sm:rounded-[24px] sm:border-b sm:p-7 sm:pb-7 sm:shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        {/* 移动端顶部拖动手柄(纯装饰) */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" aria-hidden="true" />

        <div className="flex items-start justify-between gap-3 sm:block">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7BFFCA]">
              {editableExpired
                ? t("reviews.viewBadge")
                : isEdit
                  ? t("reviews.editBadge")
                  : t("reviews.submitBadge")}
            </div>
            <h2 className="mt-1.5 text-lg font-black tracking-[-0.02em] sm:mt-2 sm:text-2xl">
              {editableExpired
                ? t("reviews.viewTitle")
                : isEdit
                  ? t("reviews.editTitle")
                  : t("reviews.submitTitle")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-[#9AA7BD] transition-colors hover:border-[#00FF9A]/30 hover:text-[#E7EDF7] sm:absolute sm:right-4 sm:top-4"
          >
            ×
          </button>
        </div>
        <p className="mt-2 text-[13px] leading-5 text-[#9AA7BD] sm:text-sm sm:leading-6">
          {editableExpired
            ? t("reviews.viewDesc")
            : isEdit
              ? t("reviews.editDesc")
              : t("reviews.submitDesc")}
        </p>

        {(orderHint || packageName) && (
          <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-[#9AA7BD]">
            {orderHint && <span className="font-mono text-[#E7EDF7]">{orderHint}</span>}
            {packageName && <span className="ml-2">{packageName}</span>}
          </div>
        )}

        {lockEdit && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
            {t("reviews.editExpired")}
          </div>
        )}

        <form className="mt-5 grid gap-5" onSubmit={submit}>
          <div className="grid gap-2 text-center">
            <span className="text-sm font-semibold">{t("reviews.fieldRating")}</span>
            <div className="flex justify-center">
              <StarRating
                value={rating}
                onChange={lockEdit ? undefined : setRating}
                readOnly={lockEdit}
                size="xl"
              />
            </div>
            <span className="text-xs text-[#9AA7BD]">{t(`reviews.ratingHint.${rating}`)}</span>
          </div>

          <label className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t("reviews.fieldContent")}</span>
              <span className="text-xs text-[#9AA7BD]">
                {content.length}/{MAX_CONTENT_LEN}
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={lockEdit}
              maxLength={MAX_CONTENT_LEN}
              placeholder={t("reviews.contentPlaceholder")}
              className="min-h-[120px] resize-y rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base outline-none transition-colors focus:border-[#00FF9A]/50 disabled:opacity-60"
            />
          </label>

          <div className="grid gap-2 text-sm">
            <span className="font-semibold">{t("reviews.fieldTags")}</span>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => !lockEdit && toggleTag(tag)}
                    disabled={lockEdit}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "border-[#00FF9A]/40 bg-[#00FF9A]/15 text-[#7BFFCA]"
                        : "border-white/10 bg-white/5 text-[#9AA7BD] hover:border-[#00FF9A]/25"
                    }`}
                  >
                    # {t(`reviews.tags.${tag}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={anonymous === 1}
              disabled={lockEdit}
              onChange={(e) => setAnonymous(e.target.checked ? 1 : 0)}
              className="h-4 w-4 rounded border-white/20 bg-white/10 accent-[#00FF9A]"
            />
            <span>{t("reviews.fieldAnonymous")}</span>
          </label>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || lockEdit}
            className="cta-primary min-h-[48px] w-full px-6 py-3 text-sm"
          >
            {submitting
              ? t("reviews.submitting")
              : isEdit
                ? t("reviews.saveEdit")
                : t("reviews.submitButton")}
          </button>
        </form>
      </div>
    </div>
  );
}
