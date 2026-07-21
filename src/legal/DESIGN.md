# Legal, Privacy and Browser Consent Design

## Goal

Keep the approved English-only published policies immutable, prepare later policy
changes as unpublished drafts, and enforce privacy, age and revocable browser-local
storage controls without weakening authentication, checkout or an active support
session.

## Policy Data Flow

```text
GET /api/legal/policies/{type}
  -> policyClient: type + locale + published status + version + SHA-256
     -> verified API policy -> LegalPolicyPage
     -> unavailable/invalid API
        -> exact bundled type + version + SHA-256 -> display-only policy
        -> mismatch -> unavailable state
```

The API is authoritative. The bundled copy contains the same canonical UTF-8 JSON
as the backend seed, but it is never evidence for registration or payment. Public
pages show policy type, version, effective date and operator, with no publication
workflow labels.

The bundled `2026-07-10.1` release is an immutable published fallback. New wording
is prepared in `vb_legal_policy_draft`; migration never replaces the fallback,
changes a published hash, advances a current marker or publishes the draft.

## Consent Data Flow

```text
CookieConsent / CookieSettingsDialog
  -> consentStorage.saveConsentChoices
     -> valbri_consent (necessary=true, optional choices, timestamp, GPC)
     -> clear keys for every withdrawn optional category

feature code -> safeStorage -> category gate -> browser storage
```

Known key categories:

- Necessary: `player_token`, `player_info`, `cs_visitor_token`.
- Preferences, default off: `language`, `cs_floating_position`,
  `cs_welcome_shown`.
- Functional, default off: `valbri_voter_token`,
  `valbri_helpful_voted`.
- Analytics and advertising: not used and unavailable.

Missing, corrupt or non-current consent records grant no optional access. GPC is
recorded and advertising or data-sharing remains denied. Cross-device consent
synchronization is outside P0.

## Trust Boundaries

- API content is hashed in the browser before rendering as verified.
- Bundled metadata is independent of parsed content and requires an exact type,
  version and SHA-256 match.
- Optional reads and writes use the same category gate so stale values cannot
  silently reactivate before a choice.
- Withdrawal removes optional keys but never auth or active-support keys.
- No analytics or advertising SDK is initialized by this module.

## Deletion and Credential Lifecycle

```text
deletion request
  -> proportionate identity verification
  -> whitelisted preview of delete/anonymise/retain actions
  -> separate administrator approval
  -> separate manual execution
```

A deletion request alone never removes data. Administrator approval must exist
before execution, legal holds can block affected actions, and audit output contains
only category, action, count, reason and result. There is no scheduled or automatic
privacy deletion.

Game passwords and Backup Codes are cleared transactionally when an order enters
completion or an approved terminal cancellation. Order, payment, consent and audit
records remain retained where required by law; retained content is minimised and is
not swept into ordinary privacy deletion.

The prepared Privacy draft must remain unpublished until the deletion
preview/approval/run state machine has been deployed and verified against this
contract.

## Age Boundary

Registration, ordering and payment require an explicit `Boolean.TRUE` age
confirmation for a person aged 18 or older. Missing or false age confirmation uses
HTTP 422 `AGE_CONFIRMATION_REQUIRED`; missing Terms or Privacy references continue
to use `CONSENT_REQUIRED`. Parent or guardian consent is not accepted, and no
guardian endpoint, table or route belongs to this design.

## Approved Infrastructure and Retention

Application, MySQL and Redis run with Tencent Cloud in Virginia, United States.
Cloudflare R2 stores media; Stripe and PayPal process payments. Concrete retention
periods are recorded in `DATA_INVENTORY.md`. Cross-device consent remains later
work; privacy deletion remains an approval-gated manual action, never a scheduled
job.
