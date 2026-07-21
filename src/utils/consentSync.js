const DEFAULT_PREFERENCE = Object.freeze({
  preferences: false,
  functional: false,
  marketingEmail: false,
  advertising: false,
  dataSharing: false,
});

function normalizedPreference(record = {}) {
  return {
    preferences: record.preferences === true,
    functional: record.functional === true,
    marketingEmail: record.marketingEmail === true,
    advertising: record.advertising === true,
    dataSharing: record.dataSharing === true,
  };
}

function applyGpc(record, gpc) {
  const enabled = gpc === true;
  return {
    ...normalizedPreference(record),
    advertising: enabled ? false : record.advertising === true,
    dataSharing: enabled ? false : record.dataSharing === true,
    gpcEnabled: enabled,
  };
}

export function hasPersistedServerPreference(record) {
  return Number.isInteger(record?.version) && record.version >= 0;
}

export function mergeConsentPreference({ localRecord, serverRecord, gpc } = {}) {
  if (serverRecord) return applyGpc(serverRecord, gpc);
  if (localRecord?.explicitChoice === true) return applyGpc(localRecord, gpc);
  return applyGpc(DEFAULT_PREFERENCE, gpc);
}

function normalizedVersion(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function buildPrivacyPreferencePayload({
  preference,
  version = null,
  policyVersion = null,
  releaseVersion = null,
} = {}) {
  const safePreference = applyGpc(preference, preference?.gpcEnabled === true);
  return {
    preferences: safePreference.preferences,
    functional: safePreference.functional,
    marketingEmail: safePreference.marketingEmail,
    advertising: safePreference.advertising,
    dataSharing: safePreference.dataSharing,
    gpcEnabled: safePreference.gpcEnabled,
    explicitChoice: true,
    version: Number.isInteger(version) && version >= 0 ? version : null,
    policyVersion: normalizedVersion(policyVersion),
    releaseVersion: normalizedVersion(releaseVersion),
  };
}

function explicitLocalRecord(localRecord) {
  if (!localRecord) return null;
  return { ...localRecord, explicitChoice: true };
}

export async function synchronizeConsentOnLogin({
  localRecord,
  gpc,
  loadServer,
  saveServer,
  saveLocal,
}) {
  const serverRecord = await loadServer();
  if (hasPersistedServerPreference(serverRecord)) {
    const preference = mergeConsentPreference({ serverRecord, gpc });
    saveLocal(preference);
    return { source: "server", preference, serverRecord };
  }

  const explicitLocal = explicitLocalRecord(localRecord);
  if (!explicitLocal) {
    return {
      source: "default",
      preference: mergeConsentPreference({ gpc }),
      serverRecord,
    };
  }

  const preference = mergeConsentPreference({ localRecord: explicitLocal, gpc });
  const savedServerRecord = await saveServer(
    buildPrivacyPreferencePayload({
      preference,
      version: null,
      policyVersion: explicitLocal.policyVersion,
      releaseVersion: explicitLocal.releaseVersion || explicitLocal.policyVersion,
    }),
  );
  const savedPreference = mergeConsentPreference({
    serverRecord: savedServerRecord || preference,
    gpc,
  });
  saveLocal(savedPreference);
  return {
    source: "local-bootstrap",
    preference: savedPreference,
    serverRecord: savedServerRecord,
  };
}

export async function saveExplicitConsentToAccount({
  localRecord,
  gpc,
  loadServer,
  saveServer,
  saveLocal,
}) {
  const serverRecord = await loadServer();
  const explicitLocal = {
    ...explicitLocalRecord(localRecord),
    marketingEmail:
      typeof localRecord?.marketingEmail === "boolean"
        ? localRecord.marketingEmail
        : serverRecord?.marketingEmail === true,
  };
  const preference = mergeConsentPreference({ localRecord: explicitLocal, gpc });
  const payload = buildPrivacyPreferencePayload({
    preference,
    version: hasPersistedServerPreference(serverRecord) ? serverRecord.version : null,
    policyVersion: serverRecord?.policyVersion || localRecord?.policyVersion,
    releaseVersion:
      serverRecord?.releaseVersion || localRecord?.releaseVersion || localRecord?.policyVersion,
  });

  try {
    const savedServerRecord = await saveServer(payload);
    const savedPreference = mergeConsentPreference({
      serverRecord: savedServerRecord || preference,
      gpc,
    });
    saveLocal(savedPreference);
    return {
      requiresReconfirm: false,
      preference: savedPreference,
      serverRecord: savedServerRecord,
    };
  } catch (error) {
    if (error?.response?.status !== 409) throw error;
    const reloadedServerRecord = await loadServer();
    const reloadedPreference = mergeConsentPreference({
      serverRecord: hasPersistedServerPreference(reloadedServerRecord)
        ? reloadedServerRecord
        : null,
      gpc,
    });
    saveLocal(reloadedPreference);
    return {
      requiresReconfirm: true,
      preference: reloadedPreference,
      serverRecord: reloadedServerRecord,
    };
  }
}
