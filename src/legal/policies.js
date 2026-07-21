export const POLICY_TYPES = Object.freeze(["terms", "privacy", "cookies", "refund"]);
export const POLICY_RELEASE_VERSION = "2026-07-16.1";
export const POLICY_EFFECTIVE_DATE = "2026-07-16";

export const LEGAL_ENTITY = Object.freeze({
  name: "GUARDIAN ANGEL GROUP. Ltd.",
  registrationNumber: "17306617",
  website: "https://www.valbri.net",
  supportEmail: "support@valbri.net",
  privacyEmail: "privacy@valbri.net",
  legalEmail: "legal@valbri.net",
  address:
    "Office 1882 R A, 182-184 High Street North, Area 1/1, East Ham, London, United Kingdom, E6 2JA",
});

export const BROWSER_STORAGE = Object.freeze([
  {
    key: "language",
    storage: ["localStorage"],
    category: "preferences",
    purpose: "Remember the selected site language",
  },
  {
    key: "player_token",
    storage: ["localStorage", "sessionStorage"],
    category: "necessary",
    purpose: "Authenticate player requests and restore the signed-in session",
  },
  {
    key: "player_info",
    storage: ["localStorage", "sessionStorage"],
    category: "necessary",
    purpose: "Cache the signed-in player's basic profile",
  },
  {
    key: "cs_visitor_token",
    storage: ["localStorage"],
    category: "necessary",
    purpose: "Reconnect a user-initiated active customer-support session",
  },
  {
    key: "cs_floating_position",
    storage: ["localStorage"],
    category: "preferences",
    purpose: "Remember the customer-support launcher position",
  },
  {
    key: "cs_welcome_shown",
    storage: ["localStorage"],
    category: "preferences",
    purpose: "Avoid repeating the first-use support prompt",
  },
  {
    key: "valbri_voter_token",
    storage: ["localStorage"],
    category: "functional",
    purpose: "Identify anonymous helpful votes and reduce duplicate voting",
  },
  {
    key: "valbri_helpful_voted",
    storage: ["localStorage"],
    category: "functional",
    purpose: "Remember recent review votes on this device",
  },
]);

const CANONICAL_CONTENT_JSON = Object.freeze({
  terms: `{"effectiveDate":"2026-07-16","title":"Terms and Conditions","version":"2026-07-16.1","sections":[{"heading":"Operator","body":"These Terms are issued by GUARDIAN ANGEL GROUP. Ltd. for services offered at https://www.valbri.net."},{"heading":"Eligibility","body":"Registration, ordering, and payment are available only to individuals aged 18 or older."},{"heading":"Orders and payment","body":"Orders cover the digital service and fulfilment description shown before payment. Stripe and PayPal process payments."},{"heading":"Cancellation and refunds","body":"Unpaid orders may be cancelled. Paid-order refund eligibility, timing, original-payment-method requirements, and completed-order exceptions are governed by the current Refund Policy accepted at checkout."},{"heading":"Governing law and courts","body":"These Terms are governed by the laws of England and Wales without excluding mandatory consumer rights."}]}`,
  privacy: `{"effectiveDate":"2026-07-16","title":"Privacy Policy","version":"2026-07-16.1","sections":[{"heading":"Controller and contact","body":"GUARDIAN ANGEL GROUP. Ltd. is the controller. Privacy enquiries may be sent to privacy@valbri.net."},{"heading":"Refund and dispute data","body":"Valbri processes account and order identifiers, payment-provider references, refund reasons, external claimant email verification, card last four digits, correspondence, and optional evidence to receive, investigate, execute, secure, and audit refund claims."},{"heading":"Processors and transfers","body":"Tencent Cloud hosts application and database services in Virginia, Cloudflare R2 stores private evidence, Stripe and PayPal process payments, and the configured SMTP provider sends service mail."},{"heading":"Retention","body":"Refund, payment, consent, dispute, and audit records and necessary evidence are retained for up to six years after closure, subject to legal hold. Expired verification challenges and unnecessary temporary data are deleted sooner."},{"heading":"Rights","body":"Individuals may exercise applicable privacy rights through the Privacy Center or privacy@valbri.net."}]}`,
  cookies: `{"effectiveDate":"2026-07-16","title":"Cookies Policy","version":"2026-07-16.1","sections":[{"heading":"Necessary storage","body":"Strictly necessary storage supports authentication, security, checkout, refund claim verification, and active support sessions."},{"heading":"Optional storage","body":"Optional preference and functional storage remains off until chosen and may be withdrawn."},{"heading":"Refund policy","body":"Refund eligibility and timing are governed only by the current Refund Policy."},{"heading":"Law and eligibility","body":"This policy follows the laws of England and Wales and the service is for users aged 18 or older."}]}`,
  refund: `{"effectiveDate":"2026-07-16","title":"Our Website Refund Policy","version":"2026-07-16.1","sections":[{"heading":"Before order completion","body":"Buyers may request a full refund at any time before an order is completed, with no conditions."},{"heading":"72-hour guarantee","body":"If an order cannot be completed within 72 hours after successful payment, Valbri will issue a full refund. Missing or incorrect customer information does not pause this period."},{"heading":"Completed orders","body":"Completed orders are not refundable except that cardholders may submit a claim within 14 calendar days after payment for a defective product or service, service not delivered as described, or an unauthorized or fraudulent charge. Approved claims receive a full refund."},{"heading":"Original payment method","body":"Refunds are issued only to the original payment method. Provider and bank settlement may take an estimated 3 to 10 business days."},{"heading":"Customer information","body":"When required information is missing, Valbri emails after one hour and again after 24 hours. When submitted information is incorrect, Valbri emails when correction is required and follows up after 24 hours if no correction is received."},{"heading":"Other issues","body":"Contact Valbri through Live Chat or support@valbri.net for other issues preventing completion."}]}`,
});

export const BUNDLED_POLICY_METADATA = Object.freeze({
  terms: Object.freeze({
    type: "terms",
    version: POLICY_RELEASE_VERSION,
    contentSha256: "dd4f0ae256476ed9373f7cc918c61fed1e9233c49b4aa1a9bdb8b7de8d8ee057",
  }),
  privacy: Object.freeze({
    type: "privacy",
    version: POLICY_RELEASE_VERSION,
    contentSha256: "79d4073e32c70253847acd7cbea01d45caca8fd8b3eebe15cc70bcdae03146d5",
  }),
  cookies: Object.freeze({
    type: "cookies",
    version: POLICY_RELEASE_VERSION,
    contentSha256: "2c41dd9adfc03ff92cb7c9cc39b3e4ec1e160c55735915ed9fa6e2e9d029f023",
  }),
  refund: Object.freeze({
    type: "refund",
    version: POLICY_RELEASE_VERSION,
    contentSha256: "e27790a8cb4d82457d382e329b841f584ed317c91c7ea729b4f7b502ce7b0ef9",
  }),
});

function makeBundledPolicy(type) {
  const contentJson = CANONICAL_CONTENT_JSON[type];
  const content = Object.freeze(JSON.parse(contentJson));
  const metadata = BUNDLED_POLICY_METADATA[type];
  return Object.freeze({
    id: null,
    type,
    policyType: type,
    locale: "en",
    version: metadata.version,
    releaseVersion: POLICY_RELEASE_VERSION,
    effectiveDate: content.effectiveDate,
    title: content.title,
    legalEntity: content.legalEntity,
    sections: content.sections,
    content,
    contentJson,
    contentSha256: metadata.contentSha256,
  });
}

export const LEGAL_POLICIES = Object.freeze(
  Object.fromEntries(POLICY_TYPES.map((type) => [type, makeBundledPolicy(type)])),
);

const retention = (rule) => Object.freeze({ rule });

export const DATA_INVENTORY = Object.freeze([
  {
    id: "player-account",
    data: ["username", "email", "password hash", "account status"],
    systems: ["vb_player", "Tencent Cloud Virginia"],
    retention: retention("While active; necessary dispute records up to six years after closure"),
  },
  {
    id: "authentication-telemetry",
    data: ["registration IP", "login IP", "security logs", "session metadata"],
    systems: ["Tencent Cloud Virginia application and Redis"],
    retention: retention("12 months"),
  },
  {
    id: "order-payment",
    data: ["order", "payment reference", "amount", "status"],
    systems: ["vb_order", "Stripe", "PayPal"],
    retention: retention("6 years after completion or cancellation"),
  },
  {
    id: "refund-payment-and-claims",
    data: [
      "player or encrypted external claimant reference",
      "order and policy snapshot",
      "refund reason and decision",
      "provider payment and refund references",
      "status and audit events",
    ],
    systems: [
      "vb_payment_transaction",
      "vb_refund_request",
      "vb_refund_transaction",
      "vb_refund_request_log",
      "Stripe",
      "PayPal",
    ],
    retention: retention("Up to 6 years after closure, subject to legal hold"),
  },
  {
    id: "refund-claim-verification",
    data: ["encrypted email", "email hash", "hashed code and token", "IP", "attempts", "expiry"],
    systems: ["vb_refund_claim_verification", "configured SMTP provider"],
    retention: retention(
      "Challenge expiry and attempt limits are enforced; target-environment row deletion is unverified",
    ),
  },
  {
    id: "refund-evidence",
    data: ["private object reference", "file metadata", "SHA-256", "scan state", "uploader"],
    systems: ["vb_refund_evidence", "private Cloudflare R2 evidence bucket"],
    retention: retention(
      "A 6-year deadline is recorded; target R2 scanning and deadline deletion are unverified",
    ),
  },
  {
    id: "game-delivery-credentials",
    data: ["game account", "encrypted password", "encrypted backup codes"],
    systems: ["vb_order_game_account"],
    retention: retention(
      "Clear password and backup codes transactionally on order completion or approved terminal cancellation",
    ),
  },
  {
    id: "reviews",
    data: ["rating", "review text", "helpful-vote identifier"],
    systems: ["vb_review", "vb_review_helpful"],
    retention: retention("While published; delete or irreversibly anonymise after account deletion"),
  },
  {
    id: "customer-support",
    data: ["visitor token", "messages", "images"],
    systems: ["support tables", "Cloudflare R2"],
    retention: retention("2 years after conversation closure"),
  },
  {
    id: "browser-storage",
    data: BROWSER_STORAGE.map(({ key }) => key),
    systems: ["browser localStorage", "browser sessionStorage"],
    retention: retention("Until logout, user deletion, withdrawal, or no longer needed"),
  },
  {
    id: "policy-publication",
    data: ["policy type", "English release and version", "canonical JSON", "SHA-256", "publication time"],
    systems: ["vb_legal_policy", "public legal API", "exact frontend fallback"],
    retention: retention("Immutable published records; archive replaced versions"),
  },
  {
    id: "consent-evidence",
    data: [
      "Terms, Privacy, and Refund references",
      "age confirmation",
      "immediate-performance confirmation",
      "player and order",
      "server time",
      "IP",
      "User-Agent",
    ],
    systems: ["vb_consent_event", "vb_consent_event_policy"],
    retention: retention("6 years after acceptance ceases to apply or the account closes"),
  },
  {
    id: "privacy-requests",
    data: ["request details", "verification status", "outcome", "audit history"],
    systems: ["vb_privacy_request", "vb_privacy_request_log"],
    retention: retention("6 years after closure; extra verification material deleted within 30 days"),
  },
  {
    id: "order-snapshots-and-media",
    data: ["fulfilment screenshots", "media metadata", "object reference"],
    systems: ["vb_order_game_snapshot", "Cloudflare R2"],
    retention: retention("180 days after completion, extended only until an active dispute ends"),
  },
]);
