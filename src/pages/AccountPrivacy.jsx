import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getLegalAcceptanceStatus, getPublishedPolicies } from "../api/legal";
import {
  getPrivacyPreferences,
  updatePrivacyPreferences,
} from "../api/privacyPreferences.js";
import { listPrivacyRequests } from "../api/privacyRequest";
import {
  isGlobalPrivacyControlEnabled,
  readConsentRecord,
  saveConsentChoices,
} from "../utils/consentStorage.js";
import {
  buildPrivacyPreferencePayload,
  hasPersistedServerPreference,
  mergeConsentPreference,
} from "../utils/consentSync.js";

function PreferenceRow({ checked, description, disabled = false, label, onChange }) {
  return (
    <label className="flex min-h-24 min-w-0 items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <span className="min-w-0">
        <span className="block break-words text-sm font-bold text-[#E7EDF7]">{label}</span>
        <span className="mt-1 block break-words text-xs leading-5 text-[#8F9CB1]">{description}</span>
      </span>
      <input
        checked={checked}
        className="mt-1 h-5 w-5 shrink-0 accent-[#00FF9A]"
        disabled={disabled}
        onChange={onChange}
        type="checkbox"
      />
    </label>
  );
}

function StatusPill({ accepted, children }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
        accepted
          ? "border-[#00FF9A]/25 bg-[#00FF9A]/[0.08] text-[#7BFFCA]"
          : "border-amber-300/25 bg-amber-300/[0.08] text-amber-200"
      }`}
    >
      {children}
    </span>
  );
}

const errorMessage = (error, fallback) =>
  error?.response?.data?.msg || error?.message || fallback;

export default function AccountPrivacy() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [needsReconfirm, setNeedsReconfirm] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [acceptance, setAcceptance] = useState(null);
  const [serverRecord, setServerRecord] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [preference, setPreference] = useState(() =>
    mergeConsentPreference({
      localRecord: readConsentRecord()
        ? { ...readConsentRecord(), explicitChoice: true }
        : null,
      gpc: isGlobalPrivacyControlEnabled(),
    }),
  );
  const gpcEnabled = isGlobalPrivacyControlEnabled();

  const loadPrivacyCenter = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [policiesResponse, acceptanceResponse, preferenceResponse, requestsResponse] =
        await Promise.all([
          getPublishedPolicies(),
          getLegalAcceptanceStatus(),
          getPrivacyPreferences(),
          listPrivacyRequests(),
        ]);
      const policies = Array.isArray(policiesResponse.data) ? policiesResponse.data : [];
      const privacyPolicy = policies.find((item) => item.policyType === "privacy") || null;
      const nextServerRecord = preferenceResponse.data || {};
      const localRecord = readConsentRecord();
      const merged = mergeConsentPreference({
        serverRecord: hasPersistedServerPreference(nextServerRecord)
          ? nextServerRecord
          : null,
        localRecord: localRecord ? { ...localRecord, explicitChoice: true } : null,
        gpc: gpcEnabled,
      });

      setPolicy(privacyPolicy);
      setAcceptance(acceptanceResponse.data || {});
      setServerRecord(nextServerRecord);
      setPreference(merged);
      setRecentRequests(
        (Array.isArray(requestsResponse.data) ? requestsResponse.data : []).slice(0, 3),
      );
    } catch (loadError) {
      setError(errorMessage(loadError, t("accountPrivacy.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [gpcEnabled, t]);

  useEffect(() => {
    loadPrivacyCenter();
  }, [loadPrivacyCenter]);

  const acceptanceLabel = useMemo(() => {
    if (acceptance?.accepted === true && acceptance?.purchaseBlocked !== true) {
      return t("accountPrivacy.accepted");
    }
    if (acceptance?.reconsentRequired === true) {
      return t("accountPrivacy.reconsentRequired");
    }
    return t("accountPrivacy.notAccepted");
  }, [acceptance, t]);

  const persistLocalCategories = (nextPreference) => {
    saveConsentChoices(
      {
        preferences: nextPreference.preferences,
        functional: nextPreference.functional,
      },
      { notify: false },
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await updatePrivacyPreferences(
        buildPrivacyPreferencePayload({
          preference: { ...preference, gpcEnabled },
          version: hasPersistedServerPreference(serverRecord) ? serverRecord.version : null,
          policyVersion: policy?.version,
          releaseVersion: policy?.releaseVersion,
        }),
      );
      const savedServerRecord = response.data || {};
      const merged = mergeConsentPreference({
        serverRecord: savedServerRecord,
        gpc: gpcEnabled,
      });
      setServerRecord(savedServerRecord);
      setPreference(merged);
      persistLocalCategories(merged);
      setNeedsReconfirm(false);
      setSuccess(t("accountPrivacy.saved"));
    } catch (saveError) {
      const response = saveError?.response;
      if (response?.status === 409) {
        const reloaded = (await getPrivacyPreferences()).data || {};
        const merged = mergeConsentPreference({
          serverRecord: hasPersistedServerPreference(reloaded) ? reloaded : null,
          gpc: gpcEnabled,
        });
        setServerRecord(reloaded);
        setPreference(merged);
        persistLocalCategories(merged);
        setNeedsReconfirm(true);
        setError(t("accountPrivacy.conflict"));
      } else {
        setError(errorMessage(saveError, t("accountPrivacy.saveFailed")));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-14">
        <div className="h-72 animate-pulse rounded-3xl bg-white/[0.035]" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-w-0 max-w-6xl px-4 pb-24 pt-10 sm:pt-14">
      <header className="min-w-0 max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00FF9A]">
          {t("accountPrivacy.eyebrow")}
        </div>
        <h1 className="mt-3 break-words text-4xl font-black tracking-[-0.035em] text-[#E7EDF7] sm:text-5xl">
          {t("accountPrivacy.title")}
        </h1>
        <p className="mt-4 break-words text-base leading-7 text-[#9AA7BD]">
          {t("accountPrivacy.description")}
        </p>
      </header>

      {error ? (
        <div className="mt-7 rounded-2xl border border-red-300/20 bg-red-300/[0.07] px-4 py-3 text-sm leading-6 text-red-100" role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-7 rounded-2xl border border-[#00FF9A]/20 bg-[#00FF9A]/[0.07] px-4 py-3 text-sm text-[#7BFFCA]" role="status">
          {success}
        </div>
      ) : null}

      <div className="mt-9 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <section className="min-w-0 rounded-3xl border border-white/10 bg-[#0B111B] p-5 sm:p-7">
          <div className="flex min-w-0 flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7F8BA0]">
                {t("accountPrivacy.policy")}
              </div>
              <h2 className="mt-2 break-words text-2xl font-bold text-[#E7EDF7]">
                {policy?.title || t("accountPrivacy.privacyPolicy")}
              </h2>
              <p className="mt-2 break-words text-sm text-[#9AA7BD]">
                {t("accountPrivacy.version")}: {policy?.version || acceptance?.releaseVersion || "—"}
              </p>
            </div>
            <StatusPill accepted={acceptance?.accepted === true}>{acceptanceLabel}</StatusPill>
          </div>

          <dl className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-2">
            <div className="min-w-0 rounded-2xl bg-white/[0.03] p-4">
              <dt className="text-xs text-[#7F8BA0]">{t("accountPrivacy.requiredGeneration")}</dt>
              <dd className="mt-2 break-words font-mono text-lg font-bold text-[#E7EDF7]">
                {acceptance?.requiredGeneration ?? policy?.acceptanceGeneration ?? "—"}
              </dd>
            </div>
            <div className="min-w-0 rounded-2xl bg-white/[0.03] p-4">
              <dt className="text-xs text-[#7F8BA0]">{t("accountPrivacy.acceptedGeneration")}</dt>
              <dd className="mt-2 break-words font-mono text-lg font-bold text-[#E7EDF7]">
                {acceptance?.acceptedGeneration ?? "—"}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-4 text-sm font-semibold">
            <Link className="min-h-11 py-3 text-[#7BFFCA] hover:text-[#00FF9A]" to="/privacy">
              {t("accountPrivacy.viewPolicy")}
            </Link>
            <span className="min-h-11 py-3 text-[#9AA7BD]">
              {t("accountPrivacy.status")}: {acceptanceLabel}
            </span>
          </div>
        </section>

        <aside className="min-w-0 rounded-3xl border border-[#00FF9A]/15 bg-[#00FF9A]/[0.045] p-5 sm:p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7BFFCA]">
            {t("accountPrivacy.gpc")}
          </div>
          <div className="mt-3 break-words text-xl font-bold text-[#E7EDF7]">
            {gpcEnabled ? t("accountPrivacy.gpcOn") : t("accountPrivacy.gpcOff")}
          </div>
          <p className="mt-3 break-words text-sm leading-6 text-[#9AA7BD]">
            {t("accountPrivacy.gpcDescription")}
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4 text-xs leading-5 text-[#AAB5C8]">
            {t("accountPrivacy.advertisingUnavailable")}
          </div>
        </aside>
      </div>

      <section className="mt-6 min-w-0 rounded-3xl border border-white/10 bg-[#0B111B] p-5 sm:p-7">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-bold text-[#E7EDF7]">
            {t("accountPrivacy.choices")}
          </h2>
          <p className="mt-2 break-words text-sm leading-6 text-[#8F9CB1]">
            {t("accountPrivacy.choicesDescription")}
          </p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PreferenceRow
            checked={preference.preferences}
            description={t("accountPrivacy.preferencesDescription")}
            label={t("accountPrivacy.preferences")}
            onChange={(event) =>
              setPreference((current) => ({ ...current, preferences: event.target.checked }))
            }
          />
          <PreferenceRow
            checked={preference.functional}
            description={t("accountPrivacy.functionalDescription")}
            label={t("accountPrivacy.functional")}
            onChange={(event) =>
              setPreference((current) => ({ ...current, functional: event.target.checked }))
            }
          />
          <PreferenceRow
            checked={preference.marketingEmail}
            description={t("accountPrivacy.marketingDescription")}
            label={t("accountPrivacy.marketing")}
            onChange={(event) =>
              setPreference((current) => ({ ...current, marketingEmail: event.target.checked }))
            }
          />
          <PreferenceRow
            checked={false}
            description={t("accountPrivacy.advertisingUnavailable")}
            disabled
            label={t("accountPrivacy.advertising")}
            onChange={() => {}}
          />
        </div>

        {needsReconfirm ? (
          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4">
            <p className="break-words text-sm leading-6 text-amber-100">{t("accountPrivacy.conflict")}</p>
            <button
              className="mt-3 min-h-11 rounded-full border border-amber-200/30 px-5 text-sm font-bold text-amber-100 hover:bg-amber-200/10"
              onClick={() => {
                setNeedsReconfirm(false);
                setError("");
              }}
              type="button"
            >
              {t("accountPrivacy.reconfirm")}
            </button>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            className="cta-primary min-h-11 w-full px-6 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            disabled={saving || needsReconfirm}
            onClick={handleSave}
            type="button"
          >
            {saving ? t("accountPrivacy.saving") : t("accountPrivacy.save")}
          </button>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="min-w-0 rounded-3xl border border-white/10 bg-[#0B111B] p-5 sm:p-7">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="break-words text-xl font-bold text-[#E7EDF7]">
                {t("accountPrivacy.recentRequests")}
              </h2>
              <p className="mt-2 break-words text-sm text-[#8F9CB1]">
                {t("accountPrivacy.recentRequestsDescription")}
              </p>
            </div>
            <Link className="shrink-0 text-sm font-semibold text-[#7BFFCA]" to="/privacy-requests">
              {t("accountPrivacy.viewAll")}
            </Link>
          </div>
          {recentRequests.length ? (
            <div className="mt-5 divide-y divide-white/8">
              {recentRequests.map((request) => (
                <div className="flex min-w-0 items-start justify-between gap-3 py-4" key={request.id}>
                  <div className="min-w-0">
                    <div className="truncate font-mono text-sm text-[#E7EDF7]">
                      {request.requestNo || `#${request.id}`}
                    </div>
                    <div className="mt-1 break-words text-xs text-[#7F8BA0]">
                      {t(`privacyRequests.types.${request.requestType}`)} · {request.createTime || "—"}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-[#AAB5C8]">
                    {t(`privacyRequests.statuses.${request.status}`)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm text-[#7F8BA0]">{t("privacyRequests.empty")}</p>
          )}
        </div>

        <div className="min-w-0 rounded-3xl border border-red-300/15 bg-red-300/[0.035] p-5 sm:p-7">
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-red-200">
            {t("accountPrivacy.accountControl")}
          </div>
          <h2 className="mt-3 break-words text-xl font-bold text-[#E7EDF7]">
            {t("accountPrivacy.requestDeletion")}
          </h2>
          <p className="mt-3 break-words text-sm leading-6 text-[#9AA7BD]">
            {t("accountPrivacy.deletionDescription")}
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center rounded-full border border-red-200/25 px-5 text-sm font-bold text-red-100 hover:bg-red-200/10"
            to="/privacy-requests"
          >
            {t("accountPrivacy.startDeletionRequest")}
          </Link>
        </div>
      </section>
    </main>
  );
}
