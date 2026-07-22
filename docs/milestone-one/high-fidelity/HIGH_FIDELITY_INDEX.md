# Complete Milestone One High-Fidelity Index

> **Verified thirty-nine-screen Milestone One high-fidelity baseline — coding authorized (D-18 / GOV-006); GOV-007 Closed — PASS.**
>
> **Package status:** All thirty-nine specifications are verified. Eleven representative and seven Batch One screens retain prior verification. Twenty-one repaired G1–G3 screens passed the targeted final artifact re-audit on 2026-07-20 (GOV-007 Closed — PASS). Medical features, uploads, real-family beta, and production release remain unauthorized.

The inventory contains exactly one specification for every governing Screen 1–39. `REP` means the verified representative board, `B1` the verified Batch One boards, and `G1`–`G3` the production-group boards verified by the final package re-audit. All paths are relative to this directory.

## Complete traceability matrix

| # | Screen | Specification | Low-fidelity source | Flow | Acceptance tests | Governing decisions / permission scope | Visual / calibrated evidence | Status |
|---:|---|---|---|---|---|---|---|---|
| 1 | Welcome and verified-email sign-in | `screens/SCREEN_01_WELCOME.md` | `01-identity-and-circle.md` | UF-01 | AT-014, AT-015, AT-030 | D-8; public/identity shell | `representative-screens.svg` / n/a | Verified representative |
| 2 | Email verification | `screens/SCREEN_02_EMAIL_VERIFICATION.md` | `01-identity-and-circle.md` | UF-01 | AT-014, AT-028, AT-030 | D-8; identity only | `batch-01-screens-02-10.svg` / `batch-01-enlarged-text.svg` | Verified Batch One |
| 3 | My Kinward dashboard | `screens/SCREEN_03_MY_KINWARD.md` | `01-identity-and-circle.md` | UF-01, UF-23 | AT-001, AT-036 | D-8, D-16; identity-bound | REP / `enlarged-text-examples.svg` | Verified representative |
| 4 | Create a Family Circle | `screens/SCREEN_04_CREATE_CIRCLE.md` | `01-identity-and-circle.md` | UF-01 | AT-001, AT-025 | D-1, D-8; authenticated adult | B1 / `batch-01-enlarged-text.svg` | Verified Batch One |
| 5 | Circle overview | `screens/SCREEN_05_CIRCLE_OVERVIEW.md` | `01-identity-and-circle.md` | UF-02 | AT-001–AT-003 | D-1–D-3; Circle + per-action | REP / n/a | Verified representative |
| 6 | Invite an adult member | `screens/SCREEN_06_INVITE_ADULT.md` | `01-identity-and-circle.md` | UF-04 | AT-014–AT-016, AT-030 | D-8, D-10; explicit inviter/scope | B1 / `batch-01-enlarged-text.svg` | Verified Batch One |
| 7 | Pending invitation | `screens/SCREEN_07_INVITATION_PENDING.md` | `01-identity-and-circle.md` | UF-04, UF-05 | AT-015, AT-016 | D-8, D-10; Circle invitation scope | B1 / `batch-01-enlarged-text.svg` | Verified Batch One |
| 8 | Propose adult Care Recipient | `screens/SCREEN_08_PROPOSE_RECIPIENT.md` | `02-care-recipient-ownership.md` | UF-03 | AT-027, AT-028, AT-030 | D-9; Circle administration only | B1 / `batch-01-enlarged-text.svg` | Verified Batch One |
| 9 | Dedicated ownership invitation | `screens/SCREEN_09_OWNERSHIP_INVITATION.md` | `02-care-recipient-ownership.md` | UF-03 | AT-027–AT-030 | D-8, D-9; matching identity | B1 / `batch-01-enlarged-text.svg` | Verified Batch One |
| 10 | Pending Care Recipient ownership | `screens/SCREEN_10_OWNERSHIP_PENDING.md` | `02-care-recipient-ownership.md` | UF-03 | AT-027–AT-029 | D-9; authorized admin/proposer | B1 / `batch-01-enlarged-text.svg` | Verified Batch One |
| 11 | Ownership acceptance | `screens/SCREEN_11_OWNERSHIP_ACCEPTANCE.md` | `02-care-recipient-ownership.md` | UF-03 | AT-027, AT-030 | D-8, D-9, D-12; matching identity | G1 / `draft-group-01-calibrated-200.svg` | Verified production group |
| 12 | Ownership decline | `screens/SCREEN_12_OWNERSHIP_DECLINE.md` | `02-care-recipient-ownership.md` | UF-03 | AT-028 | D-8, D-9; matching identity | G1 / `draft-group-01-calibrated-200.svg` | Verified production group |
| 13 | Care Recipient switcher | `screens/SCREEN_13_RECIPIENT_SWITCHER.md` | `02-care-recipient-ownership.md` | UF-02, UF-05 | AT-002, AT-003 | D-2, D-3; server-filtered | REP / `enlarged-text-examples.svg` | Verified representative |
| 14 | Circle member list | `screens/SCREEN_14_CIRCLE_MEMBER_LIST.md` | `03-roles-and-management-modes.md` | UF-03, UF-05 | AT-002, AT-004 | D-1, D-2, D-10; membership view | G1 / `draft-group-01-calibrated-200.svg` | Verified production group |
| 15 | Circle-wide role assignment | `screens/SCREEN_15_CIRCLE_ROLE_ASSIGNMENT.md` | `03-roles-and-management-modes.md` | UF-05 | AT-004, AT-017, AT-025 | D-1, D-2, D-10, D-14; explicit assigner | G1 / `draft-group-01-calibrated-200.svg` | Verified production group |
| 16 | Care Recipient-specific role assignment | `screens/SCREEN_16_RECIPIENT_ROLE_ASSIGNMENT.md` | `03-roles-and-management-modes.md` | UF-05 | AT-002–AT-004, AT-017 | D-1–D-3, D-10; owner/granted manager | G1 / `draft-group-01-calibrated-200.svg` | Verified production group |
| 17 | Self-Managed mode | `screens/SCREEN_17_SELF_MANAGED_MODE.md` | `03-roles-and-management-modes.md` | UF-06 | AT-006 | D-2, D-3; owner only | G1 / `draft-group-01-calibrated-200.svg` | Verified production group |
| 18 | Shared Management setup | `screens/SCREEN_18_SHARED_MANAGEMENT_SETUP.md` | `03-roles-and-management-modes.md` | UF-07 | AT-007 + S9-01, S9-03–S9-08 (Slice 9) | Milestone decision 3; owner only | G1 / `draft-group-01-calibrated-200.svg` | Verified production group |
| 19 | Delegated Management setup | `screens/SCREEN_19_DELEGATED_MANAGEMENT_SETUP.md` | `04-delegation-setup.md` | UF-08 prefix | S9-02, S9-07–S9-09 (Slice 9); AT-008–AT-013 complete in Slice 10 | Milestone decisions 3–5; owner only | G2 / `draft-group-02-calibrated-200.svg` | Verified production group |
| 20 | Delegation scope selection | `screens/SCREEN_20_DELEGATION_SCOPE_SELECTION.md` | `04-delegation-setup.md` | UF-08 prefix | S9-02–S9-09 (Slice 9); AT-008 completes in Slice 10 | Milestone decisions 3–5; owner only | G2 / `draft-group-02-calibrated-200.svg` | Verified production group |
| 21 | Delegation expiration selection | `screens/SCREEN_21_DELEGATION_EXPIRATION.md` | `04-delegation-setup.md` | UF-08, UF-09 | AT-009, AT-010 (Slice 10) | Milestone decision 6, D-16; owner only | G2 / `draft-group-02-calibrated-200.svg` | Verified production group |
| 22 | “Until revoked” selection | `screens/SCREEN_22_UNTIL_REVOKED.md` | `04-delegation-setup.md` | UF-08, UF-10 | AT-011 (Slice 10) | Milestone decision 6, D-16; explicit owner consent | G2 / `draft-group-02-calibrated-200.svg` | Verified production group |
| 23 | Delegation detail | `screens/SCREEN_23_DELEGATION_DETAIL.md` | `05-delegation-lifecycle.md` | UF-08–UF-12 | AT-008–AT-013 (Slice 10) | Milestone decisions 6–8, D-16; grant/field scoped | G2 / `draft-group-02-calibrated-200.svg` | Verified production group |
| 24 | Access review due | `screens/SCREEN_24_ACCESS_REVIEW_DUE.md` | `05-delegation-lifecycle.md` | UF-23 | AT-011, AT-036 (Slice 10) | Milestone decision 6, D-16; owner only | REP / n/a | Verified representative |
| 25 | Suspend delegation | `screens/SCREEN_25_SUSPEND_DELEGATION.md` | `05-delegation-lifecycle.md` | UF-11 | AT-012 (Slice 10) | Milestone decisions 7–8; owner + recent auth | G2 / `draft-group-02-calibrated-200.svg` | Verified production group |
| 26 | Revoke delegation | `screens/SCREEN_26_REVOKE_DELEGATION.md` | `05-delegation-lifecycle.md` | UF-12 | AT-013 (Slice 10) | Milestone decisions 6–8; owner + recent auth | G2 / `draft-group-02-calibrated-200.svg` | Verified production group |
| 27 | Managed minor profile | `screens/SCREEN_27_MANAGED_MINOR.md` | `06-minor-backup-and-continuity.md` | UF-16 | AT-020, AT-043 | D-11; managing adult only | REP / n/a | Verified representative |
| 28 | Backup designation | `screens/SCREEN_28_BACKUP_DESIGNATION.md` | `06-minor-backup-and-continuity.md` | UF-17 | AT-018 | D-6, D-7, D-15; Circle Head only | G3 / `draft-group-03-calibrated-200.svg` | Verified production group |
| 29 | Backup activation / fresh verification | `screens/SCREEN_29_BACKUP_ACTIVATION.md` | `06-minor-backup-and-continuity.md` | UF-18, UF-22 | AT-019, AT-032, AT-042, AT-044 | D-6, D-7, D-15; filtered designated backup | G3 / `draft-group-03-calibrated-200.svg` | Verified production group |
| 30 | Recovery unavailable | `screens/SCREEN_30_RECOVERY_UNAVAILABLE.md` | `06-minor-backup-and-continuity.md` | UF-18, UF-22 | AT-033, AT-042, AT-044 | D-6, D-7, D-15; neutral terminal | G3 / `draft-group-03-calibrated-200.svg` | Verified production group |
| 31 | Last active Circle Head block | `screens/SCREEN_31_LAST_HEAD_BLOCKED.md` | `06-minor-backup-and-continuity.md` | UF-22 | AT-034, AT-042, AT-044 | D-6, D-14, D-15; final head | REP / n/a | Verified representative |
| 32 | Role and permission audit history | `screens/SCREEN_32_AUDIT_HISTORY.md` | `07-audit-and-system-states.md` | UF-26 | AT-024, AT-035, AT-044 | D-14; row/field filtered | REP / `enlarged-text-examples.svg` | Verified representative |
| 33 | Consequential denied action | `screens/SCREEN_33_CONSEQUENTIAL_DENIED.md` | `07-audit-and-system-states.md` | UF-21, UF-26 | AT-022, AT-035, AT-044 | D-2, D-3, D-5, D-14; actor-safe denial | G3 / `draft-group-03-calibrated-200.svg` | Verified production group |
| 34 | Empty states | `screens/SCREEN_34_EMPTY_STATES.md` | `07-audit-and-system-states.md` | All applicable | AT-001–AT-030 | D-1–D-3, D-14; authorized true empty | G3 / `draft-group-03-calibrated-200.svg` | Verified production group |
| 35 | Error and recovery states | `screens/SCREEN_35_FORM_ERROR.md` | `07-audit-and-system-states.md` | All applicable | AT-003, AT-015, AT-029, AT-030 | D-1–D-3; authorized envelope | REP / n/a | Verified representative |
| 36 | Loading states | `screens/SCREEN_36_LOADING_STATES.md` | `07-audit-and-system-states.md` | All applicable | AT-001–AT-030 | D-1–D-3, D-14; pre-query safe | G3 / `draft-group-03-calibrated-200.svg` | Verified production group |
| 37 | Permission denied | `screens/SCREEN_37_PERMISSION_DENIED.md` | `07-audit-and-system-states.md` | UF-21, UF-26 | AT-022, AT-027, AT-044 | D-1–D-5, D-14; neutral denial | G3 / `draft-group-03-calibrated-200.svg` | Verified production group |
| 38 | Mobile navigation shell | `screens/SCREEN_38_MOBILE_NAV.md` | `08-mobile-navigation-shell.md` | All applicable | AT-001–AT-004, AT-026 | D-1–D-3; destination-filtered | REP / `enlarged-text-examples.svg` | Verified representative |
| 39 | Care Recipient context reset | `screens/SCREEN_39_CONTEXT_RESET.md` | `09-care-recipient-context-reset.md` | UF-25 | AT-041 | D-2, D-3; clear-before-query | REP / `enlarged-text-examples.svg` | Verified representative |

## Slice 1 mapping note

Slice 1 (Application Shell and Accessibility Foundation) uses `WIREFRAME_SPEC.md` sections 24–25, which map to visual Screens **38** and **34–37**. It does **not** use high-fidelity Screens 24–25. Screens 34, 35, 36, 37, and 38 are verified.

## Board and rendered-evidence inventory

- Verified representative: `previews/representative-screens.svg`, `previews/enlarged-text-examples.svg`, with matching PNG evidence.
- Verified Batch One: `previews/batch-01-screens-02-10.svg`, `previews/batch-01-state-evidence.svg`, `previews/batch-01-enlarged-text.svg`, with matching PNG evidence and crops.
- Production group 1: `previews/draft-group-01-screens-11-18.svg`, `previews/draft-group-01-calibrated-200.svg`.
- Production group 2: `previews/draft-group-02-screens-19-26.svg`, `previews/draft-group-02-calibrated-200.svg`.
- Production group 3: `previews/draft-group-03-screens-28-37.svg`, `previews/draft-group-03-calibrated-200.svg`.
- Dedicated state board: `previews/draft-g1-g3-state-evidence.svg`.
- Every production-group SVG has a matching full-resolution PNG under `previews/rendered-evidence/`. The exact active full-board, regional-crop, and targeted-crop filename inventory — including `screen-15-calibrated-containment-crop.png` and `screen-36-calibrated-containment-crop.png` — is maintained in `FINAL_AUDIT_PREPARATION.md` under **Active rendered-evidence inventory**.

Screen 24 copy comparison: the verified high-fidelity screen uses `Keep access`; the low-fidelity/index wording references `Continue access`. No Tier 1 canonical label was found. The verified screen is retained unchanged, and the canonical-label choice remains a non-blocking product-owner copy question.

GOV-004 former UF-identifier conflict remains annotated historically. GOV-005 membership-only invitation remains open and excluded. GOV-007 is Closed — PASS (2026-07-20).
