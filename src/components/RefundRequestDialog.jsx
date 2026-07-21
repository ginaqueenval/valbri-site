import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { requestAfterCompletion, requestBeforeCompletion } from "../api/refund";

const COMPLETED_REASONS = ["DEFECTIVE", "NOT_AS_DESCRIBED", "UNAUTHORIZED"];

export default function RefundRequestDialog({ open, order, onClose, onSubmitted }) {
  const { t } = useTranslation();
  const [reasonCode, setReasonCode] = useState(COMPLETED_REASONS[0]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const completed = String(order?.deliveryStatus) === "2";

  useEffect(() => {
    if (!open) return;
    setReasonCode(COMPLETED_REASONS[0]);
    setDescription("");
    setError("");
  }, [open, order?.id]);

  if (!open || !order) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (completed && !description.trim()) {
      setError(t("refunds.errors.descriptionRequired"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = completed
        ? await requestAfterCompletion(order.id, { reasonCode, description: description.trim() })
        : await requestBeforeCompletion(order.id);
      onSubmitted?.(response.data);
      onClose();
    } catch (submitError) {
      setError(submitError?.response?.data?.msg || submitError?.message || t("refunds.errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="refund-dialog-title">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0B111B] p-6 shadow-2xl sm:rounded-3xl sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="font-mono text-xs text-[#7BFFCA]">{order.orderNo}</div>
            <h2 id="refund-dialog-title" className="mt-2 text-2xl font-black text-[#E7EDF7]">
              {completed ? t("refunds.dialog.completedTitle") : t("refunds.dialog.incompleteTitle")}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-xl text-[#9AA7BD] hover:text-white" aria-label={t("common.close")}>×</button>
        </div>

        <p className="mt-4 text-sm leading-6 text-[#9AA7BD]">
          {completed ? t("refunds.dialog.completedDescription") : t("refunds.dialog.incompleteDescription")}
        </p>

        {completed && (
          <div className="mt-6 space-y-5">
            <label className="block text-sm font-semibold text-[#C8D2E3]">
              {t("refunds.dialog.reason")}
              <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0D131E] px-4 text-[#E7EDF7] outline-none focus:border-[#00FF9A] focus:ring-2 focus:ring-[#00FF9A]/20">
                {COMPLETED_REASONS.map((reason) => <option key={reason} value={reason}>{t(`refunds.reasons.${reason}`)}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-[#C8D2E3]">
              {t("refunds.dialog.details")}
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={5} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0D131E] px-4 py-3 leading-6 text-[#E7EDF7] outline-none focus:border-[#00FF9A] focus:ring-2 focus:ring-[#00FF9A]/20" />
            </label>
          </div>
        )}

        <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs leading-5 text-[#9AA7BD]">
          {t("refunds.dialog.originalMethod")} <Link to="/refund" className="font-semibold text-[#7BFFCA] hover:text-[#00FF9A]">{t("refunds.viewPolicy")}</Link>
        </div>
        {error && <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200">{error}</div>}
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="min-h-12 flex-1 rounded-xl border border-white/10 text-sm font-bold text-[#C8D2E3] hover:border-white/20">{t("common.cancel")}</button>
          <button type="submit" disabled={submitting} className="cta-primary min-h-12 flex-1 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? t("refunds.submitting") : t("refunds.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
