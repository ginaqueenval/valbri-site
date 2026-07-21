import {
  BUNDLED_POLICY_METADATA,
  LEGAL_POLICIES,
  POLICY_TYPES,
} from "./policies.js";
import { createBusinessError, getBusinessErrorKey } from "../utils/requestError.js";

const HEX_64 = /^[a-f0-9]{64}$/i;

async function sha256Hex(value) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("SHA-256 is unavailable");
  }
  const bytes = new TextEncoder().encode(value);
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isSupportedType(type) {
  return POLICY_TYPES.includes(type);
}

function parseContent(contentJson) {
  if (typeof contentJson !== "string" || !contentJson) return null;
  try {
    const content = JSON.parse(contentJson);
    if (
      typeof content?.title !== "string" ||
      typeof content?.version !== "string" ||
      typeof content?.effectiveDate !== "string" ||
      !Array.isArray(content?.sections) ||
      !content.sections.every(
        (section) => typeof section?.heading === "string" && typeof section?.body === "string",
      )
    ) {
      return null;
    }
    return content;
  } catch {
    return null;
  }
}

function toDisplayPolicy(type, record, content) {
  return Object.freeze({
    id: record.id ?? null,
    type,
    policyType: type,
    locale: "en",
    version: record.version,
    releaseVersion: record.releaseVersion,
    effectiveDate: content.effectiveDate,
    title: content.title,
    legalEntity: content.legalEntity,
    sections: content.sections,
    content,
    contentJson: record.contentJson,
    contentSha256: record.contentSha256.toLowerCase(),
  });
}

export async function resolvePublishedPolicy(type, candidate) {
  const record = candidate?.data ?? candidate;
  if (
    !isSupportedType(type) ||
    !record ||
    record.policyType !== type ||
    record.locale !== "en" ||
    record.status !== "published" ||
    typeof record.version !== "string" ||
    typeof record.releaseVersion !== "string" ||
    !HEX_64.test(record.contentSha256 || "")
  ) {
    return null;
  }
  const content = parseContent(record.contentJson);
  if (!content || content.version !== record.version) return null;
  const actualHash = await sha256Hex(record.contentJson);
  if (actualHash !== record.contentSha256.toLowerCase()) return null;
  return toDisplayPolicy(type, record, content);
}

export async function resolveBundledPolicy(type, bundled = LEGAL_POLICIES[type]) {
  const expected = BUNDLED_POLICY_METADATA[type];
  if (
    !expected ||
    !bundled ||
    bundled.type !== type ||
    bundled.policyType !== type ||
    bundled.locale !== "en" ||
    bundled.version !== expected.version ||
    bundled.contentSha256 !== expected.contentSha256
  ) {
    return null;
  }
  const content = parseContent(bundled.contentJson);
  if (!content || content.version !== expected.version) return null;
  const actualHash = await sha256Hex(bundled.contentJson);
  return actualHash === expected.contentSha256 ? bundled : null;
}

async function fetchPublishedPolicy(type) {
  const { getPublishedPolicy } = await import("../api/legal.js");
  return getPublishedPolicy(type);
}

export const isWithdrawnPolicyError = (error) =>
  error?.response?.status === 410 || getBusinessErrorKey(error) === "POLICY_WITHDRAWN";

function isWithdrawnPolicyResponse(candidate) {
  const record = candidate?.data ?? candidate;
  return record?.status === "withdrawn" || getBusinessErrorKey(candidate) === "POLICY_WITHDRAWN";
}

export async function loadPolicyForDisplay(type, fetchPolicy = fetchPublishedPolicy) {
  if (!isSupportedType(type)) {
    throw new Error(`Unsupported policy type: ${type}`);
  }
  try {
    const response = await fetchPolicy(type);
    if (isWithdrawnPolicyResponse(response)) {
      throw createBusinessError({
        status: 410,
        data: { errorKey: "POLICY_WITHDRAWN", msg: "Policy withdrawn" },
      });
    }
    const apiPolicy = await resolvePublishedPolicy(type, response);
    if (apiPolicy) {
      return { policy: apiPolicy, source: "api", verified: true };
    }
  } catch (error) {
    if (isWithdrawnPolicyError(error)) {
      throw error;
    }
    // Display may continue only through the independently verified bundled copy.
  }
  const bundledPolicy = await resolveBundledPolicy(type);
  if (!bundledPolicy) {
    throw new Error(`No exact published copy is available for ${type}`);
  }
  return { policy: bundledPolicy, source: "bundled", verified: false };
}
