# Kinward Milestone One Visual Wireframes

> **Status:** First low-fidelity planning set; not approved; no implementation authorized
> **Version:** 0.1
> **Last updated:** 2026-07-16
> **Governing decisions:** D-1 through D-17

**Low-fidelity planning wireframe — not final interface design.**

## Purpose

This folder turns the approved written wireframe specification into mobile-first visual planning artifacts for targeted design review. It contains no application code, framework, database, infrastructure, environment configuration, real family information, or beta authorization.

All examples use synthetic Harbor Circle labels. The artifacts cover only accounts, Circles, Care Recipient ownership, roles, management modes, delegation, managed minors, backup administration, permission states, audit history, and the mobile navigation shell.

## Artifact Set

1. `01-identity-and-circle.md` — screens 1–7
2. `02-care-recipient-ownership.md` — screens 8–13
3. `03-roles-and-management-modes.md` — screens 14–18
4. `04-delegation-setup.md` — screens 19–22
5. `05-delegation-lifecycle.md` — screens 23–26
6. `06-minor-backup-and-continuity.md` — screens 27–31
7. `07-audit-and-system-states.md` — screens 32–37
8. `08-mobile-navigation-shell.md` — screen 38 and cross-screen context behavior

`WIREFRAME_INDEX.md` supplies the required purpose, user, entry, information, actions, permissions, empty/error states, accessibility notes, user-flow trace, and acceptance-test trace for every screen.

## Reading the Frames

- `[ Primary action ]` represents a large touch target of at least 48 by 48 CSS pixels in implementation.
- `( )` represents an unselected option; `(x)` represents a selected option, always paired with text.
- `!` introduces a text warning or blocked state; meaning never depends on color.
- `FOCUS →` shows a visible keyboard-focus example.
- Circle and Care Recipient context appears at the top of protected screens.
- Hidden or inaccessible records are omitted without revealing names, counts, or placeholders.

## Scope Boundary

There are no Patient or Caregiver Check-Ins, symptoms, treatment, medication, medical alerts, documents, uploads, support impersonation, real-data entry, environment provisioning, or restricted-pilot activation screens in this set.
