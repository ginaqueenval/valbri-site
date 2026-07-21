import {
  BROWSER_STORAGE,
  POLICY_RELEASE_VERSION,
} from "../legal/policies.js";

export const CONSENT_STORAGE_KEY = "valbri_consent";
export const CONSENT_CHANGED_EVENT = "valbri:consent-changed";
export const OPEN_COOKIE_SETTINGS_EVENT = "valbri:open-cookie-settings";
export const CONSENT_SYNC_STATUS_EVENT = "valbri:consent-sync-status";

let pendingConsentSyncStatus = null;

const UNAVAILABLE_CATEGORIES = new Set(["analytics", "advertising", "sharing"]);
const STORAGE_CATEGORY = new Map(BROWSER_STORAGE.map(({ key, category }) => [key, category]));

function resolveStorage(storage) {
  if (storage !== undefined) return storage ?? null;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function safeRead(storage, key) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeWrite(storage, key, value) {
  try {
    storage?.setItem(key, value);
    return Boolean(storage);
  } catch {
    return false;
  }
}

function safeRemove(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage denial must not prevent the remainder of a withdrawal cleanup.
  }
}

function currentNavigator(value) {
  if (value !== undefined) return value;
  try {
    return globalThis.navigator ?? null;
  } catch {
    return null;
  }
}

export function isGlobalPrivacyControlEnabled(navigatorValue) {
  return currentNavigator(navigatorValue)?.globalPrivacyControl === true;
}

export function readConsentRecord(storage) {
  const raw = safeRead(resolveStorage(storage), CONSENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const record = JSON.parse(raw);
    if (
      record?.policyVersion !== POLICY_RELEASE_VERSION ||
      record?.necessary !== true ||
      typeof record?.preferences !== "boolean" ||
      typeof record?.functional !== "boolean" ||
      typeof record?.gpc !== "boolean" ||
      typeof record?.timestamp !== "string" ||
      !Number.isFinite(Date.parse(record.timestamp))
    ) {
      return null;
    }
    return Object.freeze({
      policyVersion: record.policyVersion,
      necessary: true,
      preferences: record.preferences,
      functional: record.functional,
      timestamp: record.timestamp,
      gpc: record.gpc,
    });
  } catch {
    return null;
  }
}

export function clearConsentCategory(category, storage) {
  const target = resolveStorage(storage);
  for (const item of BROWSER_STORAGE) {
    if (item.category === category) safeRemove(target, item.key);
  }
}

function notifyConsentChanged(record) {
  try {
    globalThis.window?.dispatchEvent(
      new CustomEvent(CONSENT_CHANGED_EVENT, { detail: record }),
    );
  } catch {
    // CustomEvent is not available in Node and may be restricted in embedded browsers.
  }
}

export function saveConsentChoices(
  choices = {},
  {
    storage,
    navigator: navigatorValue,
    now = () => new Date(),
    notify = true,
  } = {},
) {
  const target = resolveStorage(storage);
  const date = now();
  const record = Object.freeze({
    policyVersion: POLICY_RELEASE_VERSION,
    necessary: true,
    preferences: choices.preferences === true,
    functional: choices.functional === true,
    timestamp: (date instanceof Date ? date : new Date(date)).toISOString(),
    gpc: isGlobalPrivacyControlEnabled(navigatorValue),
  });

  if (!record.preferences) clearConsentCategory("preferences", target);
  if (!record.functional) clearConsentCategory("functional", target);
  if (!safeWrite(target, CONSENT_STORAGE_KEY, JSON.stringify(record))) return null;
  if (notify) notifyConsentChanged(record);
  return record;
}

export function withdrawOptionalConsent(options = {}) {
  return saveConsentChoices({ preferences: false, functional: false }, options);
}

export function hasConsentForCategory(category, { storage } = {}) {
  if (category === "necessary") return true;
  if (UNAVAILABLE_CATEGORIES.has(category)) return false;
  if (category !== "preferences" && category !== "functional") return false;
  const record = readConsentRecord(storage);
  return record?.[category] === true;
}

export function categoryForStorageKey(key) {
  return STORAGE_CATEGORY.get(key) ?? null;
}

export function isStorageWriteAllowed(key, { storage } = {}) {
  if (key === CONSENT_STORAGE_KEY) return true;
  const category = categoryForStorageKey(key);
  return category !== null && hasConsentForCategory(category, { storage });
}

export function openCookieSettings() {
  try {
    globalThis.window?.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
  } catch {
    // A missing event API only affects the convenience reopen action.
  }
}

export function notifyConsentSyncStatus(status) {
  pendingConsentSyncStatus = status || null;
  try {
    globalThis.window?.dispatchEvent(
      new CustomEvent(CONSENT_SYNC_STATUS_EVENT, { detail: pendingConsentSyncStatus }),
    );
  } catch {
    // The pending status is still available when browser events are restricted.
  }
}

export function consumeConsentSyncStatus() {
  const status = pendingConsentSyncStatus;
  pendingConsentSyncStatus = null;
  return status;
}
