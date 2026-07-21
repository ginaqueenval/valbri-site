# Legal Publication Record

## Approved P0 Decisions

- Operator: `GUARDIAN ANGEL GROUP. Ltd.`, registration number `17306617`, at
  `Office 1882 R A, 182-184 High Street North, Area 1/1, East Ham, London,
  United Kingdom, E6 2JA`.
- Public release: English-only version `2026-07-10.1`, effective `2026-07-10`.
- Registration, ordering and payment are limited to users aged 18 or older;
  parent or guardian consent is not accepted.
- England and Wales law and courts apply, without mandatory arbitration or an
  exclusion of mandatory local consumer rights.
- Refund wording records the approved 2-business-day acknowledgement,
  5-business-day decision target and no-later-than-14-day approved initiation.
- Stripe and PayPal are payment processors. Tencent Cloud hosts the application,
  MySQL and Redis in Virginia, United States. Cloudflare R2 stores media.
- International processing uses applicable contractual or other lawful transfer
  safeguards.
- The approved retention schedule appears in the Privacy and Cookies policies
  and in `DATA_INVENTORY.md`.

## Browser Storage Decisions

- Necessary storage is always active.
- Preferences and functional storage are optional and default off.
- Accept optional, reject optional and settings actions receive equal visibility.
- Withdrawal clears optional keys and prevents future optional reads or writes.
- Authentication and a user-initiated active support session remain available.
- Analytics and advertising storage are not used or available.
- Global Privacy Control (GPC) prevents future advertising or data-sharing
  categories.

## Operational Release Checks

- Backend canonical JSON and frontend bundled JSON must retain identical SHA-256
  values for all three policy types.
- Only published English API records may render as verified.
- Registration and checkout must never treat the display fallback as acceptance
  evidence.
- A future policy change creates a new immutable version and requires new hashes.
- The bundled published `2026-07-10.1` copy and its canonical SHA-256 values remain
  unchanged. The P1 migration creates only one English Privacy `draft`; it does not
  publish the draft or change a current published marker.

## Prepared Privacy Draft Decisions

- A deletion request must complete proportionate identity verification and obtain
  separate administrator approval before deletion or anonymisation is manually
  executed. There is no scheduled or automatic privacy deletion.
- Game passwords and Backup Codes are cleared transactionally on order completion
  or approved terminal cancellation.
- Order, payment, consent and audit records are retained where required by law;
  dispute evidence and records under a legal hold remain protected and minimised.
- The service remains limited to individuals aged 18 or older. Parent or guardian
  consent is not accepted, and no guardian consent endpoint, table or route is
  approved.
- Missing or false registration age confirmation returns HTTP 422
  `AGE_CONFIRMATION_REQUIRED`; missing Terms or Privacy references remain
  `CONSENT_REQUIRED`.

This draft must not be published until the backend deletion preview, approval and
separate execution path has been deployed and verified. Real provider refunds and
cross-device consent synchronization remain outside this policy-copy change.

## Excluded Claims

Seller listings, cash withdrawals, Payoneer, affiliate rewards, KYC purchasing
limits, social-login binding, analytics and advertising must not appear as current
player-site capabilities until implemented, inventoried and approved.
