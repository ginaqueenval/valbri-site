import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  downloadRefundEvidence,
  getRefundRequest,
  listRefundRequests,
  uploadRefundEvidence,
} from "../api/refund";

const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "application/pdf"]);
const statusTone = {
  UNDER_REVIEW: "border-amber-400/25 bg-amber-400/[0.07] text-amber-200",
  APPROVED: "border-cyan-400/25 bg-cyan-400/[0.07] text-cyan-200",
  REFUND_PROCESSING: "border-cyan-400/25 bg-cyan-400/[0.07] text-cyan-200",
  REFUND_INITIATED: "border-blue-400/25 bg-blue-400/[0.07] text-blue-200",
  REFUNDED: "border-[#00FF9A]/25 bg-[#00FF9A]/[0.07] text-[#7BFFCA]",
  REJECTED: "border-red-400/25 bg-red-400/[0.07] text-red-200",
  MANUAL_INTERVENTION: "border-violet-400/25 bg-violet-400/[0.07] text-violet-200",
};

export default function RefundRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listRefundRequests();
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      setError(loadError?.response?.data?.msg || loadError?.message || t("refunds.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    setError("");
    try {
      const response = await getRefundRequest(id);
      setSelected(response.data || null);
    } catch (detailError) {
      setError(detailError?.response?.data?.msg || detailError?.message || t("refunds.errors.loadFailed"));
    }
  };

  const upload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    setFileError("");
    if (!selected || files.length === 0) return;
    const existingCount = selected.evidence?.length || 0;
    if (existingCount + files.length > MAX_FILES) {
      setFileError(t("refunds.evidence.maxFiles"));
      return;
    }
    const invalid = files.find((file) => !ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES);
    if (invalid) {
      setFileError(t("refunds.evidence.invalidFile"));
      return;
    }
    setUploading(true);
    try {
      for (const file of files) await uploadRefundEvidence(selected.id, file);
      const response = await getRefundRequest(selected.id);
      setSelected(response.data || null);
      await load();
    } catch (uploadError) {
      setFileError(uploadError?.response?.data?.msg || uploadError?.message || t("refunds.evidence.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const download = async (evidence) => {
    setFileError("");
    try {
      const blob = await downloadRefundEvidence(selected.id, evidence.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = evidence.originalName || "evidence";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setFileError(t("refunds.evidence.downloadFailed"));
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00FF9A]">{t("refunds.eyebrow")}</div>
          <h1 className="mt-3 text-4xl font-black text-[#E7EDF7] sm:text-5xl">{t("refunds.title")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9AA7BD]">{t("refunds.description")}</p>
        </div>
        <Link to="/orders" className="min-h-11 py-3 text-sm font-bold text-[#7BFFCA] hover:text-[#00FF9A]">{t("refunds.backToOrders")}</Link>
      </header>

      {error && <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200">{error}</div>}
      {loading ? (
        <div className="mt-8 h-48 animate-pulse rounded-2xl bg-white/[0.03]" />
      ) : requests.length === 0 ? (
        <div className="py-20 text-center text-sm text-[#7F8BA0]">{t("refunds.empty")}</div>
      ) : (
        <div className="mt-3 divide-y divide-white/8">
          {requests.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center justify-between gap-5 py-5">
              <div className="min-w-0">
                <div className="font-mono text-sm text-[#E7EDF7]">{item.requestNo}</div>
                <div className="mt-2 text-sm text-[#9AA7BD]">{item.amount} {item.currency} · {item.createTime}</div>
                <div className="mt-1 text-xs text-[#7F8BA0]">{t(`refunds.reasons.${item.reasonCode}`, item.reasonCode)}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[item.status] || statusTone.UNDER_REVIEW}`}>{t(`refunds.statuses.${item.status}`, item.status)}</span>
                <button type="button" onClick={() => openDetail(item.id)} className="min-h-11 text-sm font-bold text-[#7BFFCA] hover:text-[#00FF9A]">{t("refunds.viewDetail")}</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 sm:items-center sm:p-6" role="dialog" aria-modal="true">
          <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0B111B] p-6 shadow-2xl sm:rounded-3xl sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div><div className="font-mono text-sm text-[#7BFFCA]">{selected.requestNo}</div><h2 className="mt-2 text-2xl font-black text-[#E7EDF7]">{t(`refunds.statuses.${selected.status}`, selected.status)}</h2></div>
              <button type="button" onClick={() => setSelected(null)} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-xl text-[#9AA7BD] hover:text-white" aria-label={t("common.close")}>×</button>
            </div>
            <dl className="mt-6 grid gap-4 border-y border-white/10 py-5 text-sm sm:grid-cols-2">
              <div><dt className="text-[#7F8BA0]">{t("refunds.amount")}</dt><dd className="mt-1 text-[#E7EDF7]">{selected.amount} {selected.currency}</dd></div>
              <div><dt className="text-[#7F8BA0]">{t("refunds.createdAt")}</dt><dd className="mt-1 text-[#E7EDF7]">{selected.createTime}</dd></div>
              <div><dt className="text-[#7F8BA0]">{t("refunds.reason")}</dt><dd className="mt-1 text-[#E7EDF7]">{t(`refunds.reasons.${selected.reasonCode}`, selected.reasonCode)}</dd></div>
              <div><dt className="text-[#7F8BA0]">{t("refunds.settlement")}</dt><dd className="mt-1 text-[#E7EDF7]">{t("refunds.settlementEstimate")}</dd></div>
            </dl>
            {selected.description && <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-[#B8C3D6]">{selected.description}</p>}
            {selected.decisionReason && <p className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[#B8C3D6]">{selected.decisionReason}</p>}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div><h3 className="font-bold text-[#E7EDF7]">{t("refunds.evidence.title")}</h3><p className="mt-1 text-xs text-[#7F8BA0]">{t("refunds.evidence.help")}</p></div>
              <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-white/10 px-4 text-sm font-bold text-[#7BFFCA] hover:border-[#00FF9A]/30">
                {uploading ? t("refunds.evidence.uploading") : t("refunds.evidence.add")}
                <input type="file" multiple accept="image/png,image/jpeg,application/pdf" className="sr-only" disabled={uploading} onChange={upload} />
              </label>
            </div>
            {fileError && <div className="mt-4 text-sm text-red-200">{fileError}</div>}
            <ul className="divide-y divide-white/8">
              {(selected.evidence || []).map((evidence) => (
                <li key={evidence.id} className="flex items-center justify-between gap-4 py-4 text-sm"><span className="min-w-0 truncate text-[#B8C3D6]">{evidence.originalName}</span><button type="button" onClick={() => download(evidence)} className="min-h-11 shrink-0 text-xs font-bold text-[#7BFFCA]">{t("refunds.evidence.download")}</button></li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}
