# Legal Policy Module

This module publishes the player site's English-only Terms, Privacy and Cookies
policies for release `2026-07-10.1`, effective `2026-07-10`.

## Runtime Contract

- `LegalPolicyPage.jsx` loads `/api/legal/policies/{type}` first.
- `policyClient.js` accepts API content only when the published English record,
  embedded version and SHA-256 of the exact UTF-8 `contentJson` agree.
- If the API cannot provide verified content, display may use the bundled copy
  only when its type, version and SHA-256 exactly match immutable metadata.
- A bundled copy is display-only and is returned with `verified: false`; it does
  not authorize registration or checkout. Those flows use backend-confirmed API
  records and fail closed.
- Public policy bodies never follow the surrounding UI locale. Controls around
  the policy, including browser-storage settings, remain translated.

Public HashRouter routes are `/#/terms`, `/#/privacy` and `/#/cookies`.

## Browser Storage

`consentStorage.js` stores `valbri_consent` with the policy version, necessary,
preferences and functional choices, timestamp and observed GPC state. Necessary
storage is always active. Preferences and functional storage default off;
analytics and advertising are not used or available.

`safeStorage.js` denies reads and writes for known optional keys until their
category is granted. Withdrawal clears that category's keys while preserving
authentication and a user-initiated active support session. GPC always prevents
future advertising or data-sharing categories.

## Change Rules

1. Create a new immutable policy version instead of editing published content.
2. Keep frontend canonical JSON byte-for-byte aligned with the backend seed and
   update the expected SHA-256 values together.
3. Keep public policy content English-only.
4. Update both machine-readable and Markdown data inventories when a field,
   browser key, processor, purpose, retention period or destination changes.
5. Run focused tests, full `node --test`, `npm run lint` and `npm run build`.

## Files

- `policies.js`: canonical policy copies, hashes, operator and data inventory.
- `policyClient.js`: API-first verification and exact display fallback.
- `consentStorage.js`: local consent record, GPC, withdrawal and key cleanup.
- `DATA_INVENTORY.md`: human-readable data-flow and retention register.
- `LEGAL_REVIEW.md`: approved publication decisions and operational checks.
- `DESIGN.md`: trust boundaries and runtime data flow.
