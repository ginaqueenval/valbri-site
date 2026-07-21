import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  createRefundChallenge,
  verifyRefundChallenge,
  submitPublicRefundClaim,
  uploadPublicRefundEvidence,
} from "../api/refund";
import useCaptcha from "../hooks/useCaptcha.js";

const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "application/pdf"]);

export default function UnauthorizedRefundClaim() {
  const { t } = useTranslation();
  const { captchaCode, setCaptchaCode, captchaUuid, captchaUrl, captchaEnabled, loadCaptcha } = useCaptcha();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [claimToken, setClaimToken] = useState("");
  const [form, setForm] = useState({ orderNo: "", transactionDate: "", amount: "", currency: "USD", cardLastFour: "", description: "" });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fail = (requestError, fallback) => setError(requestError?.response?.data?.msg || requestError?.message || fallback);

  const requestCode = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await createRefundChallenge({ email: email.trim(), captchaCode: captchaCode.trim(), captchaUuid });
      setChallengeId(response.data?.challengeId || "");
      setStep("code");
    } catch (requestError) {
      fail(requestError, t("refunds.public.errors.challenge"));
      if (captchaEnabled) loadCaptcha();
    } finally { setSubmitting(false); }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await verifyRefundChallenge({ challengeId, code: code.trim() });
      setClaimToken(response.data?.claimToken || "");
      setStep("claim");
    } catch (requestError) {
      fail(requestError, t("refunds.public.errors.verify"));
    } finally { setSubmitting(false); }
  };

  const chooseFiles = (event) => {
    const next = Array.from(event.target.files || []);
    event.target.value = "";
    setError("");
    if (next.length > MAX_FILES) return setError(t("refunds.evidence.maxFiles"));
    if (next.some((file) => !ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES)) return setError(t("refunds.evidence.invalidFile"));
    setFiles(next);
  };

  const submitClaim = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const response = await submitPublicRefundClaim(claimToken, {
        ...form,
        amount: form.amount ? Number(form.amount) : null,
        cardLastFour: form.cardLastFour || null,
      });
      const refundRequestId = response.data?.refundRequestId;
      for (const file of files) await uploadPublicRefundEvidence(claimToken, refundRequestId, file);
      setStep("done");
      setClaimToken("");
    } catch (requestError) {
      fail(requestError, t("refunds.public.errors.submit"));
    } finally { setSubmitting(false); }
  };

  const inputClass = "mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0D131E] px-4 text-[#E7EDF7] outline-none focus:border-[#00FF9A] focus:ring-2 focus:ring-[#00FF9A]/20";

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:pt-14">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00FF9A]">{t("refunds.public.eyebrow")}</div>
      <h1 className="mt-3 text-4xl font-black text-[#E7EDF7] sm:text-5xl">{t("refunds.public.title")}</h1>
      <p className="mt-4 text-sm leading-6 text-[#9AA7BD]">{t("refunds.public.description")}</p>

      <ol className="mt-8 grid grid-cols-3 border-y border-white/10 py-4 text-center text-xs font-semibold text-[#7F8BA0]">
        {["email", "code", "claim"].map((item, index) => <li key={item} className={step === item ? "text-[#7BFFCA]" : ""}>{index + 1}. {t(`refunds.public.steps.${item}`)}</li>)}
      </ol>

      {error && <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200">{error}</div>}

      {step === "email" && (
        <form onSubmit={requestCode} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold text-[#C8D2E3]">{t("refunds.public.email")}<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className={inputClass} /></label>
          {captchaEnabled && (
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <label className="block text-sm font-semibold text-[#C8D2E3]">{t("auth.captcha")}<input required value={captchaCode} onChange={(event) => setCaptchaCode(event.target.value)} className={inputClass} /></label>
              <button type="button" onClick={loadCaptcha} className="player-auth-captcha w-[180px] max-w-full justify-self-center sm:w-full sm:mt-7">
                {captchaUrl ? (
                  <span className="player-auth-captcha-image">
                    <img src={captchaUrl} alt={t("auth.captcha")} />
                  </span>
                ) : t("auth.captcha")}
              </button>
            </div>
          )}
          <button type="submit" disabled={submitting} className="cta-primary min-h-12 w-full disabled:opacity-50">{submitting ? t("refunds.submitting") : t("refunds.public.sendCode")}</button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyCode} className="mt-8 space-y-5">
          <p className="text-sm text-[#9AA7BD]">{t("refunds.public.codeSent")}</p>
          <label className="block text-sm font-semibold text-[#C8D2E3]">{t("refunds.public.code")}<input required inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} autoComplete="one-time-code" className={inputClass} /></label>
          <button type="submit" disabled={submitting || code.length !== 6} className="cta-primary min-h-12 w-full disabled:opacity-50">{submitting ? t("refunds.submitting") : t("refunds.public.verify")}</button>
        </form>
      )}

      {step === "claim" && (
        <form onSubmit={submitClaim} className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-[#C8D2E3]">{t("refunds.public.orderNo")}<input value={form.orderNo} onChange={(event) => setForm({ ...form, orderNo: event.target.value })} className={inputClass} /></label>
          <label className="block text-sm font-semibold text-[#C8D2E3]">{t("refunds.public.transactionDate")}<input type="date" value={form.transactionDate} onChange={(event) => setForm({ ...form, transactionDate: event.target.value })} className={inputClass} /></label>
          <label className="block text-sm font-semibold text-[#C8D2E3]">{t("refunds.public.amount")}<input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className={inputClass} /></label>
          <label className="block text-sm font-semibold text-[#C8D2E3]">{t("refunds.public.currency")}<input maxLength={3} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} className={inputClass} /></label>
          <label className="block text-sm font-semibold text-[#C8D2E3] sm:col-span-2">{t("refunds.public.cardLastFour")}<input inputMode="numeric" maxLength={4} value={form.cardLastFour} onChange={(event) => setForm({ ...form, cardLastFour: event.target.value.replace(/\D/g, "") })} className={inputClass} /></label>
          <label className="block text-sm font-semibold text-[#C8D2E3] sm:col-span-2">{t("refunds.public.details")}<textarea required maxLength={2000} rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0D131E] px-4 py-3 text-[#E7EDF7] outline-none focus:border-[#00FF9A]" /></label>
          <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/15 text-sm font-bold text-[#7BFFCA] sm:col-span-2">{files.length ? t("refunds.evidence.selected", { count: files.length }) : t("refunds.evidence.addOptional")}<input type="file" multiple accept="image/png,image/jpeg,application/pdf" className="sr-only" onChange={chooseFiles} /></label>
          <button type="submit" disabled={submitting} className="cta-primary min-h-12 w-full disabled:opacity-50 sm:col-span-2">{submitting ? t("refunds.submitting") : t("refunds.public.submit")}</button>
        </form>
      )}

      {step === "done" && (
        <section className="mt-10 border-y border-white/10 py-10 text-center"><h2 className="text-2xl font-black text-[#E7EDF7]">{t("refunds.public.doneTitle")}</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#9AA7BD]">{t("refunds.public.doneMessage")}</p><Link to="/home" className="cta-primary mt-7 inline-flex min-h-12 items-center px-6">{t("refunds.public.returnHome")}</Link></section>
      )}
    </main>
  );
}
