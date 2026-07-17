# Kinward Milestone One Visual Wireframes

> **Status:** Verified low-fidelity planning baseline; high-fidelity design authorized by product owner — design only; no implementation authorized
> **Version:** 0.1
> **Last updated:** 2026-07-17
> **Governing decisions:** D-1 through D-17

**Low-fidelity planning wireframe — not final interface design.**

## Purpose

This folder turns the approved written wireframe specification into mobile-first visual planning artifacts for targeted design review. It contains no application code, framework, database, infrastructure, environment configuration, real family information, or beta authorization.

All examples use synthetic Harbor Circle labels. The artifacts cover only accounts, Circles, Care Recipient ownership, roles, management modes, delegation, managed minors, backup administration, permission states, audit history, and the mobile navigation shell.

The canonical set contains **39 low-fidelity planning screens across 9 flow files**.

## Artifact Set

1. `01-identity-and-circle.md` — screens 1–7
2. `02-care-recipient-ownership.md` — screens 8–13
3. `03-roles-and-management-modes.md` — screens 14–18
4. `04-delegation-setup.md` — screens 19–22
5. `05-delegation-lifecycle.md` — screens 23–26
6. `06-minor-backup-and-continuity.md` — screens 27–31
7. `07-audit-and-system-states.md` — screens 32–37
8. `08-mobile-navigation-shell.md` — screen 38 and cross-screen context behavior
9. `09-care-recipient-context-reset.md` — screen 39

`WIREFRAME_INDEX.md` supplies the required purpose, user, entry, information, actions, permissions, empty/error states, accessibility notes, user-flow trace, and acceptance-test trace for every screen.

## Reading the Frames

- `[ Primary action ]` represents an interactive target of at least 48 × 48 CSS pixels. This is Kinward's approved product baseline even where an external standard permits a smaller minimum.
- `( )` represents an unselected option; `(x)` represents a selected option, always paired with text.
- `!` introduces a text warning or blocked state; meaning never depends on color.
- `FOCUS →` shows a visible keyboard-focus example.
- Circle and Care Recipient context appears at the top of protected screens.
- Hidden or inaccessible records are omitted without revealing names, counts, or placeholders.
- Every frame preserves text labels in addition to color or icons, visible focus, screen-reader announcements, 200% primary-content reflow without horizontal scrolling, error summaries with field associations, reduced-motion-safe loading feedback, and one clear primary action.
- Protected frames show active Circle and Care Recipient context in text. Pending, Active, Suspended, Revoked, Dormant, Denied, and Blocked states use text labels. Route/context changes and consequential outcomes have predictable focus and screen-reader announcements; authorized input is retained after validation errors; loading is never spinner-only.

## Scope Boundary

There are no Patient or Caregiver Check-Ins, symptoms, treatment, medication, medical alerts, documents, uploads, support impersonation, real-data entry, environment provisioning, or restricted-pilot activation screens in this set.

The low-fidelity baseline passed its targeted design re-audit with verdict **PASSED — SIX DESIGN REPAIRS VERIFIED**. High-fidelity design is **Authorized by product owner — design only**. Any high-fidelity output remains draft until reviewed; no final interface design or application interface exists. Application coding remains unauthorized; no environment, database, or storage has been provisioned; no real family or health information is authorized; the restricted real-family beta remains unauthorized; and document sharing and medical workflows remain deferred. Gate A, Gate B, Gate C, and Gate D remain in force.
