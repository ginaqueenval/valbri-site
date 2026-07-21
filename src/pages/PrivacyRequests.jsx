import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  cancelPrivacyRequest,
  createPrivacyRequest,
  getPrivacyRequest,
  listPrivacyRequests,
} from "../api/privacyRequest";

const REQUEST_TYPES = ["access", "export", "rectify", "delete", "restrict", "object"];
const HIGH_RISK_TYPES = new Set(["export", "delete", "restrict"]);
const CANCELLABLE_STATUSES = new Set(["submitted", "identity_verification", "in_review"]);

const statusTone = {
  submitted: "border-cyan-400/24 bg-cyan-400/[0.07] text-cyan-200",
  identity_verification: "border-amber-400/24 bg-amber-400/[0.07] text-amber-200",
  in_review: "border-blue-400/24 bg-blue-400/[0.07] text-blue-200",
  action_required: "border-violet-400/24 bg-violet-400/[0.07] text-violet-200",
  completed: "border-[#00FF9A]/24 bg-[#00FF9A]/[0.07] text-[#7BFFCA]",
  rejected: "border-red-400/24 bg-red-400/[0.07] text-red-200",
  cancelled: "border-white/12 bg-white/[0.04] text-[#9AA7BD]",
};

const apiError = (error) => ({
  key: error?.response?.data?.errorKey || "",
  message: error?.response?.data?.msg || error?.message || "",
});

export default function PrivacyRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ requestType: "access", details: "", currentPassword: "" });

  const highRisk = HIGH_RISK_TYPES.has(form.requestType);
  const activeTypes = useMemo(
    () => new Set(requests.filter((item) => !["completed", "rejected", "cancelled"].includes(item.status))
      .map((item) => item.requestType)),
    [requests],
  );

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listPrivacyRequests();
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      setError(apiError(loadError).message || t("privacyRequests.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (activeTypes.has(form.requestType)) {
      setError(t("privacyRequests.activeExists"));
      return;
    }
    if (highRisk && !form.currentPassword) {
      setError(t("privacyRequests.passwordRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await createPrivacyRequest({
        requestType: form.requestType,
        details: form.details.trim(),
        currentPassword: highRisk ? form.currentPassword : undefined,
      });
      setForm((current) => ({ ...current, details: "", currentPassword: "" }));
      setSuccess(t("privacyRequests.created"));
      await loadRequests();
    } catch (createError) {
      const { key: errorKey, message } = apiError(createError);
      setError(
        errorKey === "PASSWORD_VERIFICATION_FAILED"
          ? t("privacyRequests.passwordFailed")
          : errorKey === "ACTIVE_REQUEST_EXISTS"
            ? t("privacyRequests.activeExists")
            : message || t("privacyRequests.createFailed"),
      );
      setForm((current) => ({ ...current, currentPassword: "" }));
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (id) => {
    setError("");
    try {
      const response = await getPrivacyRequest(id);
      setSelected(response.data || null);
    } catch (detailError) {
      setError(apiError(detailError).message || t("privacyRequests.loadFailed"));
    }
  };

  const handleCancel = async (id) => {
    setError("");
    try {
      await cancelPrivacyRequest(id);
      if (selected?.id === id) setSelected(null);
      await loadRequests();
    } catch (cancelError) {
      setError(apiError(cancelError).message || t("privacyRequests.cancelFailed"));
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-14">
      <header className="max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00FF9A]">
          {t("privacyRequests.eyebrow")}
        </div>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.035em] text-[#E7EDF7] sm:text-5xl">
          {t("privacyRequests.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#9AA7BD]">
          {t("privacyRequests.description")}
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)]">
        <form onSubmit={handleCreate} className="self-start border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold text-[#E7EDF7]">{t("privacyRequests.newRequest")}</h2>
          <label className="mt-6 block text-sm font-semibold text-[#C8D2E3]">
            {t("privacyRequests.type")}
            <select
              value={form.requestType}
              onChange={(event) => setForm({ requestType: event.target.value, details: form.details, currentPassword: "" })}
              className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0D131E] px-4 text-[#E7EDF7] outline-none focus:border-[#00FF9A] focus:ring-2 focus:ring-[#00FF9A]/20"
            >
              {REQUEST_TYPES.map((type) => (
                <option key={type} value={type}>{t(`privacyRequests.types.${type}`)}</option>
              ))}
            </select>
          </label>
          <label className="mt-5 block text-sm font-semibold text-[#C8D2E3]">
            {t("privacyRequests.details")}
            <textarea
              value={form.details}
              onChange={(event) => setForm({ ...form, details: event.target.value })}
              maxLength={2000}
              rows={5}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0D131E] px-4 py-3 leading-6 text-[#E7EDF7] outline-none focus:border-[#00FF9A] focus:ring-2 focus:ring-[#00FF9A]/20"
            />
          </label>
          {highRisk && (
            <label className="mt-5 block text-sm font-semibold text-[#C8D2E3]">
              {t("privacyRequests.currentPassword")}
              <input
                type="password"
                value={form.currentPassword}
                onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
                autoComplete="current-password"
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0D131E] px-4 text-[#E7EDF7] outline-none focus:border-[#00FF9A] focus:ring-2 focus:ring-[#00FF9A]/20"
              />
              <span className="mt-2 block text-xs font-normal leading-5 text-[#7F8BA0]">
                {t("privacyRequests.passwordHint")}
              </span>
            </label>
          )}
          <button
            type="submit"
            disabled={submitting || activeTypes.has(form.requestType)}
            className="cta-primary mt-6 min-h-12 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? t("privacyRequests.submitting") : t("privacyRequests.submit")}
          </button>
        </form>

        <section aria-live="polite">
          <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold text-[#E7EDF7]">{t("privacyRequests.history")}</h2>
              <p className="mt-1 text-sm text-[#7F8BA0]">{t("privacyRequests.deadlineNote")}</p>
            </div>
            <button type="button" onClick={loadRequests} className="min-h-11 text-sm font-semibold text-[#7BFFCA] hover:text-[#00FF9A]">
              {t("privacyRequests.refresh")}
            </button>
          </div>

          {error && <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200">{error}</div>}
          {success && <div className="mt-4 rounded-xl border border-[#00FF9A]/20 bg-[#00FF9A]/[0.06] px-4 py-3 text-sm text-[#7BFFCA]">{success}</div>}

          {loading ? (
            <div className="mt-6 h-48 animate-pulse rounded-2xl bg-white/[0.03]" />
          ) : requests.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#7F8BA0]">{t("privacyRequests.empty")}</div>
          ) : (
            <div className="divide-y divide-white/8">
              {requests.map((item) => (
                <article key={item.id} className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="font-mono text-sm text-[#E7EDF7]">{item.requestNo}</div>
                      <div className="mt-2 text-sm text-[#9AA7BD]">
                        {t(`privacyRequests.types.${item.requestType}`)} · {t("privacyRequests.createdAt")} {item.createTime}
                      </div>
                      <div className="mt-1 text-xs text-[#7F8BA0]">
                        {t("privacyRequests.dueTime")}: {item.dueTime || t("privacyRequests.pendingVerification")}
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[item.status] || statusTone.cancelled}`}>
                      {t(`privacyRequests.statuses.${item.status}`)}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-5 text-sm font-semibold">
                    <button type="button" onClick={() => openDetail(item.id)} className="min-h-11 text-[#7BFFCA] hover:text-[#00FF9A]">
                      {t("privacyRequests.viewDetail")}
                    </button>
                    {CANCELLABLE_STATUSES.has(item.status) && (
                      <button type="button" onClick={() => handleCancel(item.id)} className="min-h-11 text-red-300 hover:text-red-200">
                        {t("privacyRequests.cancel")}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true">
          <section className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0B111B] p-6 shadow-2xl sm:rounded-3xl sm:p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="font-mono text-sm text-[#7BFFCA]">{selected.requestNo}</div>
                <h2 className="mt-2 text-2xl font-bold text-[#E7EDF7]">{t(`privacyRequests.types.${selected.requestType}`)}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-xl text-[#9AA7BD] hover:text-white" aria-label={t("common.close")}>×</button>
            </div>
            <dl className="mt-6 grid gap-4 border-y border-white/10 py-5 text-sm sm:grid-cols-2">
              <div><dt className="text-[#7F8BA0]">{t("privacyRequests.status")}</dt><dd className="mt-1 text-[#E7EDF7]">{t(`privacyRequests.statuses.${selected.status}`)}</dd></div>
              <div><dt className="text-[#7F8BA0]">{t("privacyRequests.verification")}</dt><dd className="mt-1 text-[#E7EDF7]">{selected.verificationStatus}</dd></div>
              <div><dt className="text-[#7F8BA0]">{t("privacyRequests.dueTime")}</dt><dd className="mt-1 text-[#E7EDF7]">{selected.dueTime || "—"}</dd></div>
              <div><dt className="text-[#7F8BA0]">{t("privacyRequests.createdAt")}</dt><dd className="mt-1 text-[#E7EDF7]">{selected.createTime}</dd></div>
            </dl>
            {selected.details && <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-[#B8C3D6]">{selected.details}</p>}
            {(selected.logs || []).length > 0 && (
              <ol className="mt-6 border-l border-white/10 pl-5">
                {selected.logs.map((log) => (
                  <li key={log.id} className="relative pb-5 text-sm text-[#B8C3D6] before:absolute before:-left-[25px] before:top-1 before:h-2 before:w-2 before:rounded-full before:bg-[#00FF9A]">
                    <div className="font-semibold text-[#E7EDF7]">{log.userVisibleMessage || log.reason || log.action}</div>
                    <div className="mt-1 text-xs text-[#7F8BA0]">{log.createTime}</div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
