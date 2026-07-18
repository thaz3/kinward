# Full 39-Screen Package — Final Audit Preparation

> **Status:** Thirty-nine screen specifications exist. Eighteen screens remain previously verified. Twenty-one screens have completed the additional repair pass, including Green 100 / Mineral 300 / sans-serif typography corrections and calibrated Screen 15 / Screen 36 containment fixes. Stale serif calibrated crops were regenerated from current full boards. The package remains draft pending targeted final artifact re-audit. This record does not claim approval. Application implementation remains unauthorized.

## Inventory and status

- Verified representative (11): 1, 3, 5, 13, 24, 27, 31, 32, 35, 38, 39.
- Verified Batch One (7): 2, 4, 6, 7, 8, 9, 10.
- Repaired draft, pending targeted final re-audit (21): 11, 12, 14–23, 25, 26, 28–30, 33, 34, 36, 37.
- Total: 39 unique numbered specifications; one specification for every Screen 1–39.
- Coding remains unauthorized.

## New-screen completion checklist

| Screen | Specification | Standard | Calibrated 200% | Required distinctive evidence | Status |
|---:|---|---|---|---|---|
| 11 | Ownership acceptance | G1 | G1-200 | consent, focus separator, success/error/expired/denied | Repair complete · pending re-audit |
| 12 | Ownership decline | G1 | G1-200 | destructive confirmation, safe-focus restoration | Repair complete · pending re-audit |
| 14 | Circle member list | G1 | G1-200 | list, long identity, pending/empty/error/denied | Repair complete · pending re-audit |
| 15 | Circle-wide role assignment | G1 | G1-200 | full-row role cards, discard confirmation, last-head error | Repair complete · pending re-audit |
| 16 | Recipient role assignment | G1 | G1-200 | recipient scope, selected/unselected rows, context clearing | Repair complete · pending re-audit |
| 17 | Self-Managed mode | G1 | G1-200 | selected mode, confirmation, no inferred authority | Repair complete · pending re-audit |
| 18 | Shared Management setup | G1 | G1-200 | form, long identity, scope selection, empty/error | Repair complete · pending re-audit |
| 19 | Delegated setup | G2 | G2-200 | form/step, representative boundary, discard | Repair complete · pending re-audit |
| 20 | Scope selection | G2 | G2-200 | full-row selected/unselected, zero-selected disabled primary | Repair complete · pending re-audit |
| 21 | Expiration selection | G2 | G2-200 | full-row duration cards, validation, until-revoked branch | Repair complete · pending re-audit |
| 22 | Until revoked | G2 | G2-200 | explicit confirmation, recurring-review copy | Repair complete · pending re-audit |
| 23 | Delegation detail | G2 | G2-200 | long metadata, stacked Modify/Suspend/Revoke | Repair complete · pending re-audit |
| 25 | Suspend delegation | G2 | G2-200 | confirmation, safe-default focus separator, immediate effect | Repair complete · pending re-audit |
| 26 | Revoke delegation | G2 | G2-200 | destructive confirmation, safe Keep-access focus | Repair complete · pending re-audit |
| 28 | Backup designation | G3 | G3-200 | eligible adult card, Dormant status, zero-authority | Repair complete · pending re-audit |
| 29 | Backup activation | G3 | G3-200 | fresh verification, unavailable, no automatic succession | Repair complete · pending re-audit |
| 30 | Recovery unavailable | G3 | G3-200 | terminal neutral outcome, safe exit | Repair complete · pending re-audit |
| 33 | Consequential denied | G3 | G3-200 | non-leaking denial, focus separator, unchanged state | Repair complete · pending re-audit |
| 34 | Empty states | G3 | G3-200 | authorized true-empty vs denial/error | Repair complete · pending re-audit |
| 36 | Loading states | G3 | G3-200 | loading, context clearing, stale disposal | Repair complete · pending re-audit |
| 37 | Permission denied | G3 | G3-200 | neutral denial, focus separator, no identifiers/counts | Repair complete · pending re-audit |

`G1`, `G2`, and `G3` refer to the matching `previews/draft-group-*-screens-*.svg`; `G1-200` through `G3-200` refer to the matching calibrated boards.

## State-evidence coverage matrix

| State | New-screen visual evidence | Specification coverage |
|---|---|---|
| Default / selected | 11, 14–23, 28 | All applicable new screens |
| Loading / context clearing / stale disposal | 36 standard and 200%; protected-screen specs | All protected screens |
| Success / completion | dedicated repaired-cohort state board | 11, 12, 15–18, 22, 23, 25, 26, 28–30, 33, 34, 36, 37 |
| Empty | 34 standard and 200%; contextual specs | 14, 15, 18, 19, 23, 28, 34 |
| Validation / system error | dedicated repaired-cohort state board plus screen-specific specification | 11, 15–22, 25, 26, 28, 29, 34, 36 |
| Neutral denial | 33 and 37 standard and 200% | Every new protected screen |
| Disabled / unavailable / expired / revoked / suspended / pending | 20, 22, 23, 25, 26, 29, 30 | Exact lifecycle specs |
| Destructive confirmation | 12 and 26 standard/200%; 25 deliberate confirmation | 12, 25, 26 |
| Unsaved/discard confirmation | dedicated repaired-cohort state board | 11, 15–22, 28 |
| Focus with explicit 2 px white separator | 11, 12, 15, 20, 21, 25, 26, 28, 29, 33, 36, 37 calibrated; state board | All new screens specify focus behavior |
| Full-row duration selection | Screen 21 standard, calibrated, and state board | Screen 21 |
| Long identity / metadata | 14, 18, 23 standard/200% | 14, 18, 23, 28 |
| Narrow / calibrated 200% | all 21 new screens on G1-200 through G3-200 | All 21 new specs |

Shared visual patterns are reused where the consequence and layout are not materially different; unique permission boundaries, confirmations, lifecycle consequences, and system states are shown directly.

## Permission and privacy review

The 21 new specifications and boards preserve verified-email-only identity, adult Care Recipient sole ownership, explicit and revocable management/delegation, Circle and recipient isolation, deny-by-default reads/writes, filtered audit rows/fields, last-active-Circle-Head protection, dormant backup zero authority, managed-minor restrictions, recurring 90-day review without automatic access change, clear-before-query, and stale-response disposal. Neutral denials omit protected names, identifiers, counts, event existence, attempted values, and reasons. No screen infers authority from marriage, household, family relationship, caregiving, or Circle administration.

## Static accessibility and contrast review

- Standard new-board roles use 28 px headings, 18 px body/action labels, and 16 px support/context labels.
- Calibrated boards use 56 px headings, 44 px section headings, 36 px body/action labels, and 32 px support/context labels; layouts expand vertically and stack actions.
- Visible controls meet or exceed the 48 × 48 px target baseline; selection cards and calibrated actions exceed it naturally.
- Primary labels carry explicit `fill="#FFFFFF"` on Evergreen 700 `#17634D`; the verified ratio is approximately 7.17:1.
- Required interactive boundaries use Ink/green/red treatments, not Mineral 300. Focus evidence uses a 3 px Violet 600 ring with an explicit 2 px White `#FFFFFF` separation outline (not implied gap alone).
- Success surfaces use verified Green 100 `#E2F1E6` (not `#E3F1E8`). Screen 36 loading skeletons use verified decorative Mineral 300 `#C9D2CD` as a non-interactive neutral fill; Mineral 300 remains decorative-only and is not used as an interactive control boundary.
- Draft G1–G3 and state-evidence SVG typography uses explicit `font-family` / `font-size` / `font-weight` declarations with the verified native sans stack; CSS `font:` shorthand is avoided because the local renderer falls back to serif when shorthand is used.
- Status, selection, denial, and destruction use wording plus mark/boundary/position; color is not the sole signal.

Static evidence cannot prove runtime browser, iOS, Android, keyboard, screen-reader, text-resize, focus, authorization, concurrency, audit filtering, or stale-response behavior. Those remain implementation-only verification requirements after implementation is separately authorized.

## Direct rendered inspection record

Seven full-resolution repaired-board PNGs remain current. After the containment pass, `draft-group-01-calibrated-200.png` and `draft-group-03-calibrated-200.png` were regenerated and opened. Screen 15 keeps `medical access.` inside the selected-role fill, card boundary, white separator, and violet focus ring. Screen 36 keeps `counts, or drafts.` inside the loading card with Mineral 300 skeletons unchanged. All retained G1/G2/G3 calibrated top, middle, lower, and dense crops were regenerated from the current sans-serif full PNGs (Swift CGImage crops; prior `sips --cropOffset` middle crops were identical to top and are superseded). Targeted `screen-15-calibrated-containment-crop.png` and `screen-36-calibrated-containment-crop.png` document the containment repairs. No active evidence crop retains serif typography. Runtime behavior remains unverified.

## Active rendered-evidence inventory

All paths are under `previews/rendered-evidence/`. The obsolete pre-containment Screen 15 and Screen 36 crops were removed. Only current sans-serif, post-repair artifacts are listed as active evidence.

### Active full-board evidence

- `representative-screens.png`
- `enlarged-text-examples.png`
- `batch-01-screens-02-10.png`
- `batch-01-enlarged-text.png`
- `batch-01-state-evidence.png`
- `draft-group-01-screens-11-18.png`
- `draft-group-01-calibrated-200.png`
- `draft-group-02-screens-19-26.png`
- `draft-group-02-calibrated-200.png`
- `draft-group-03-screens-28-37.png`
- `draft-group-03-calibrated-200.png`
- `draft-g1-g3-state-evidence.png`

### Active regional crops

- `rep-enlarged-top-row.png`
- `rep-enlarged-lower-row.png`
- `rep-enlarged-s3-primary.png`
- `rep-enlarged-s13-primary.png`
- `rep-enlarged-s39-primary.png`
- `rep-enlarged-s39-return.png`
- `batch-01-enlarged-text-top-crop.png`
- `batch-01-enlarged-text-middle-crop.png`
- `batch-01-enlarged-text-lower-crop.png`
- `batch-01-standard-lower-crop.png`
- `batch-01-state-confirmations-crop.png`
- `draft-group-01-standard-dense-crop.png`
- `draft-group-01-calibrated-top-crop.png`
- `draft-group-01-calibrated-middle-crop.png`
- `draft-group-01-calibrated-lower-crop.png`
- `draft-group-01-calibrated-dense-crop.png`
- `draft-group-02-standard-confirmations-crop.png`
- `draft-group-02-standard-screen21-area-crop.png`
- `draft-group-02-calibrated-top-crop.png`
- `draft-group-02-calibrated-middle-crop.png`
- `draft-group-02-calibrated-lower-crop.png`
- `draft-group-02-calibrated-dense-crop.png`
- `draft-group-03-standard-denial-crop.png`
- `draft-group-03-calibrated-top-crop.png`
- `draft-group-03-calibrated-middle-crop.png`
- `draft-group-03-calibrated-lower-crop.png`
- `draft-group-03-calibrated-denial-crop.png`
- `draft-state-evidence-top-crop.png`
- `draft-state-evidence-middle-crop.png`
- `draft-state-evidence-lower-crop.png`
- `draft-state-evidence-screen21-crop.png`
- `typography-g1-standard-heading-crop.png`
- `typography-g2-calibrated-heading-crop.png`
- `typography-g2-calibrated-dense-crop.png`
- `typography-g3-calibrated-heading-crop.png`
- `typography-state-board-crop.png`

### Active targeted crops

- `screen-11-consent-crop.png`
- `screen-11-calibrated-consent-focus-crop.png`
- `screen-15-calibrated-containment-crop.png`
- `screen-20-disabled-crop.png`
- `screen-20-calibrated-scope-focus-crop.png`
- `screen-21-duration-cards-crop.png`
- `screen-21-calibrated-duration-crop.png`
- `screen-23-actions-crop.png`
- `screen-25-calibrated-safe-focus-crop.png`
- `screen-28-dormant-crop.png`
- `screen-28-calibrated-backup-focus-crop.png`
- `screen-33-calibrated-denial-focus-crop.png`
- `screen-36-skeleton-standard-crop.png`
- `screen-36-calibrated-containment-crop.png`
- `state-success-token-crop.png`
- `state-success-green100-crop.png`

Removed (not active evidence): `typography-g1-calibrated-dense-crop.png` (obsolete pre-containment Screen 15 calibrated crop); `screen-36-skeleton-calibrated-crop.png` (obsolete pre-containment Screen 36 calibrated crop). Do not regenerate those filenames.

## Governance and unresolved items

GOV-004’s former UF identifier conflict remains annotated in the complete index; identifiers were not silently normalized. GOV-005 remains open: membership-only adult invitation behavior is excluded and requires a future product-owner decision. No new contradiction requiring resolution was introduced by the 21 draft screens.

Screen 24 retains verified `Keep access`. Low-fidelity/index `Continue access` is logged as a non-blocking product-owner copy question because no higher-tier canonical choice was identified.
