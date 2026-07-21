import { resolvePublishedPolicy } from "../legal/policyClient.js";

export const REQUIRED_CHECKOUT_POLICY_TYPES = Object.freeze(["terms", "privacy", "refund"]);

export const withPublicationMetadata = (policy, record) => ({
  ...policy,
  acceptanceGeneration:
    record?.acceptanceGeneration ?? policy?.content?.acceptanceGeneration ?? null,
  changeSummary: record?.changeSummary ?? policy?.content?.changeSummary ?? "",
});

export const loadCheckoutLegalPolicies = async (
  records,
  resolvePolicy = resolvePublishedPolicy,
) => {
  if (!Array.isArray(records)) {
    throw new Error("Checkout policies are unavailable");
  }
  const entries = await Promise.all(
    REQUIRED_CHECKOUT_POLICY_TYPES.map(async (type) => {
      const record = records.find((candidate) => candidate?.policyType === type);
      const policy = await resolvePolicy(type, record);
      if (!policy) throw new Error(`Checkout policy ${type} is unavailable`);
      return [type, withPublicationMetadata(policy, record)];
    }),
  );
  const releaseVersions = entries.map(([, policy]) => policy.releaseVersion?.trim());
  if (releaseVersions.some((version) => !version) || new Set(releaseVersions).size !== 1) {
    throw new Error("Checkout policies must use the same release");
  }
  return Object.fromEntries(entries);
};

export const isPolicyReconsentError = (error) => {
  const errorKey = error?.response?.data?.errorKey;
  return errorKey === "POLICY_VERSION_STALE" || errorKey === "RECONSENT_REQUIRED";
};
