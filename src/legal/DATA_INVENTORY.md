# Player Site Data Inventory

This engineering register reflects the approved destinations and operational
retention controls. A specific fraud investigation, payment dispute, litigation,
regulatory matter or other applicable legal hold suspends deletion only for
affected data.

| ID | Data and purpose | System / sharing | Retention |
| --- | --- | --- | --- |
| player-account | Username, email, password hash and profile; operate the account | `vb_player`; Tencent Cloud Virginia | While active; remove password and non-required profile data on closure; necessary dispute records up to 6 years |
| authentication-telemetry | Registration/login IP, time, security logs and session metadata; secure accounts | Application and Redis on Tencent Cloud Virginia | 12 months |
| order-payment | Order, amount, currency, provider references and status; payment, finance and support | `vb_order`; Stripe and PayPal | 6 years after completion or cancellation |
| refund-payment-and-claims | Player or encrypted external claimant reference, order, reason, description, amount, policy snapshot, provider payment/refund references, review decision, status and audit events; receive, decide, execute, reconcile and audit refunds | `vb_payment_transaction`, `vb_refund_request`, `vb_refund_transaction`, `vb_refund_request_log`; Stripe and PayPal | Up to 6 years after closure, subject to legal hold |
| refund-claim-verification | Email hash and ciphertext, hashed code and claim token, IP address, failed-attempt count, expiry and use times; verify an external cardholder without exposing account existence | `vb_refund_claim_verification`; configured SMTP provider | Application enforces challenge expiry and attempt limits; deletion of expired rows in the target environment is `[unverified]` |
| refund-evidence | Private object reference, original name, detected MIME type, size, SHA-256, scan state, uploader and retention deadline; investigate completed-order claims | `vb_refund_evidence`; private Cloudflare R2 evidence bucket | Code records a 6-year retention deadline; malware scanning and deletion from target R2 at that deadline are `[unverified]` |
| game-delivery-credentials | Game account, encrypted password and Backup Codes; fulfilment | `vb_order_game_account` | Clear password and Backup Codes transactionally on order completion or approved terminal cancellation; retain the account identifier only where still required |
| order-snapshots-and-media | Fulfilment screenshots, metadata and object references; delivery evidence | `vb_order_game_snapshot`; Cloudflare R2 | 180 days after completion; extend only until an active dispute ends |
| reviews | Rating, text, display identity and helpful-vote identifier; publish and moderate reviews | `vb_review`, `vb_review_helpful` | While published; delete or irreversibly anonymise after account deletion |
| customer-support | Visitor/player reference, messages and images; support continuity | Support tables; Cloudflare R2 media | 2 years after conversation closure |
| policy-publication | Terms, Privacy, Cookies and Refund type, English canonical JSON, release/version, SHA-256 and publication times | `vb_legal_policy`; public legal API; exact bundled fallback | Immutable; replaced versions are archived |
| consent-evidence | Terms, Privacy and Refund policy references, age and immediate-performance confirmation, player, order, server time, IP and bounded User-Agent; evidence | `vb_consent_event`, `vb_consent_event_policy` | 6 years after acceptance ceases to apply or the account closes |
| privacy-requests | Request, identity verification, preview, administrator approval, execution outcome and immutable history; rights workflow | `vb_privacy_request`, `vb_privacy_request_log`, `vb_privacy_execution` | 6 years after closure; extra verification material within 30 days after verification |
| browser-storage | Consent, auth/session keys and device-local optional choices | Browser localStorage/sessionStorage | Until logout, user deletion, withdrawal or no longer needed |
| backup-data | Deleted records awaiting backup rotation | Infrastructure backups | Remove by rotation within 90 days; do not restore into ordinary use |

## Browser Key Register

| Category | Keys | Default / withdrawal |
| --- | --- | --- |
| Necessary | `valbri_consent`, `player_token`, `player_info`, `cs_visitor_token` | Always active; optional withdrawal never clears these |
| Preferences | `language`, `cs_floating_position`, `cs_welcome_shown` | Default off; withdrawal clears all three |
| Functional | `valbri_voter_token`, `valbri_helpful_voted` | Default off; withdrawal clears both |
| Analytics | None | Not used; unavailable |
| Advertising / sharing | None | Not used; unavailable; GPC prevents future enablement |

## Controls

- Never store complete payment-card data in Valbri systems or logs.
- Keep provider payment and refund identifiers out of public/player responses while retaining
  the server-side references required for reconciliation and audit.
- Keep refund evidence private and quarantined until a configured scanner marks it clean;
  target-environment scanner and R2 lifecycle verification remain `[unverified]`.
- Keep game-delivery credentials encrypted and out of general DTOs and logs.
- A deletion request must pass identity verification and administrator approval
  before a separate manual execution; there is no scheduled or automatic privacy
  deletion.
- Retain order, payment, consent and audit records where required by law, and
  minimise retained content rather than deleting evidence indiscriminately.
- Registration, ordering and payment are for individuals aged 18 or older;
  parent or guardian consent is not accepted and there is no guardian flow.
- Keep the policy API read-only and public only for legal GET endpoints.
- Keep optional browser reads and writes behind category-aware `safeStorage`.
- Update this inventory before adding a processor, destination, tracker, browser
  key, export, retention job or privacy-request field.
