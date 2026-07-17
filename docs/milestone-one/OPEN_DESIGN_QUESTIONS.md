# Kinward Milestone One Open Design Questions

> **Status:** OQ-01 through OQ-10 resolved, verified, and closed for planning purposes
> **Version:** 0.2
> **Last updated:** 2026-07-16
> **Governing decisions:** D-1 through D-17; `PRE_BUILD_DECISIONS.md`; `MILESTONE_ONE_READINESS.md`

## Scope

This document preserves the original questions, rationale, and proposed defaults while recording the approved answers. These resolutions do not authorize implementation, real-data use, or the restricted real-family beta. D-1 through D-7 remain unchanged.

## OQ-01 — Adult Authentication Channel for Milestone One

- **Decision:** D-8
- **Original question:** Does Milestone One assume verified email only, or verified email plus SMS or phone authentication?
- **Why it matters:** Channel choice affects invitation binding, recovery, accessibility, cost, abuse controls, and provider configuration.
- **Earlier recommended default:** Use verified email first and preserve an identity abstraction for later phone support.
- **Approved answer:** Verified email is the only Milestone One authentication, invitation-binding, and account-verification channel. SMS login, phone OTP, phone recovery, and SMS invitation delivery are deferred. Identity remains separate from contact methods.
- **Gate:** Gate A before authentication coding.
- **Status:** Verified and Closed for Planning — D-8

## OQ-02 — Care Recipient Owner-Onboarding Mechanism

- **Decision:** D-9
- **Original question:** Does another adult Care Recipient activate through a dedicated ownership invitation or ordinary membership plus separate ownership acceptance?
- **Why it matters:** The adult must consent to sole ownership before a private record becomes active.
- **Earlier recommended default:** Use a distinct ownership-acceptance record linked to a verified adult identity; create no active private record before acceptance.
- **Approved answer:** Create a pending inactive Care Recipient, dedicated ownership invitation to verified email, and separate acceptance and consent history. No private data is entered before acceptance. Acceptance activates the record and Circle membership without another invitation; the invitation states the Circle, proposer, sole-ownership effect, consequences, permissions, and right to decline.
- **Gate:** Gate A before the Care Recipient activation slice.
- **Status:** Verified and Closed for Planning — D-9

## OQ-03 — Recent and Strong Reauthentication Standard

- **Decision:** D-10
- **Original question:** What authentication age and method satisfy recent and strong reauthentication?
- **Why it matters:** The answer affects session experience, audit evidence, provider capabilities, and unattended-device risk.
- **Earlier recommended default:** Use a short recent-authentication window for consequential actions and a fresh provider-supported challenge for backup activation; do not require biometrics.
- **Approved answer:** Routine authorized access does not repeat authentication. Consequential authority actions require authentication within the prior 15 minutes. Backup activation, recovery, future top-level authority transfer, and later strong actions require a fresh provider-supported challenge each time. Biometrics are optional convenience only.
- **Gate:** Gate A security and permission confirmation before affected coding.
- **Status:** Verified and Closed for Planning — D-10

## OQ-04 — Approved Backup Recovery Branch

- **Decision:** D-11
- **Original question:** What recovery process may approve backup activation when no authorized Circle Head can act?
- **Why it matters:** D-4 prohibits self-activation and does not define legal evidence or successor authority.
- **Earlier recommended default:** Implement only authorized-Circle-Head approval and keep an alternate recovery branch unavailable until reviewed.
- **Approved answer:** Milestone One implements only Circle Head-approved activation. If none can approve, show a neutral unavailable message. Do not determine incapacity, death, succession, disputed control, legal authority, or replacement. Record approval source for a possible future reviewed pathway.
- **Gate:** Named recovery and qualified-authority review before any alternate branch.
- **Status:** Verified and Closed for Milestone One Planning — D-11; alternate branch remains deferred

## OQ-05 — Audit-History Retention Duration

- **Decision:** D-12
- **Original question:** How long are audit events retained in prototype, test, and later production environments?
- **Why it matters:** Immutable history requires lifecycle rules without prematurely selecting a legal production period.
- **Earlier recommended default:** Preserve all synthetic events during controlled testing, keep retention configurable, and choose no production duration.
- **Approved answer:** Retain all synthetic audit events for the full life of each active test environment. Delete the complete synthetic dataset only through a documented reset or retirement. Include timestamps and a configurable retention classification. Production duration and automation remain Gate C decisions.
- **Gate:** Gate C before production or real-family retention automation.
- **Status:** Verified and Closed for Milestone One Planning — D-12; production retention remains a Gate C decision

## OQ-06 — Exact First-Family Device and Assistive-Technology Matrix

- **Decision:** D-13
- **Original question:** Which iPhone, Android, desktop, browser, screen-reader, and operating-system configurations will be used?
- **Why it matters:** Reproducible WCAG 2.2 AA verification requires named real configurations.
- **Earlier recommended default:** Test one current iPhone/Safari/VoiceOver, one Android/Chrome/TalkBack, and one desktop keyboard configuration.
- **Approved answer:** Test both Care Recipients' actual iPhones, the integral nurse team member's actual Android, and one desktop keyboard configuration using D-13's required accessibility checks. Record exact models and versions before execution. Both mobile platforms must work before the restricted pilot; broader coverage remains Gate D.
- **Gate:** First-family test planning; broader independent review at Gate D.
- **Status:** Verified and Closed for Planning — D-13

## OQ-07 — Circle Head Continuity When the Last Active Circle Head Leaves

- **Decision:** D-14
- **Original question:** How does Kinward prevent a Circle from losing all active Circle Heads without automatic backup succession?
- **Why it matters:** Losing the last active Circle Head would leave Circle authority undefined.
- **Earlier recommended default:** Block removal of the last active Circle Head until another accepts; use approved backup or future recovery for exceptions.
- **Approved answer:** The last active Circle Head cannot leave, remove the role, be removed, or be downgraded until another verified adult accepts Circle Head. Show a clear block. Backup status does not create automatic succession.
- **Gate:** Gate A before Circle Head or membership-removal coding.
- **Status:** Verified and Closed for Planning — D-14

## OQ-08 — Authorization-Denial Audit Threshold

- **Decision:** D-15
- **Original question:** Which denied actions enter family audit history versus security-only operational logs?
- **Why it matters:** Logging all denied reads creates noise and disclosure risk, while omitting denied authority changes weakens accountability.
- **Earlier recommended default:** Family-audit consequential denied writes; place routine denied reads in privacy-safe security logs.
- **Approved answer:** Consequential denied authority writes enter family-visible audit history. Routine denied reads do not; where appropriate, they enter privacy-safe security or operational logs. The channels remain separate and expose no private content to unauthorized people.
- **Gate:** Gate A privacy and permission confirmation before audit implementation.
- **Status:** Verified and Closed for Planning — D-15

## OQ-09 — “Until Revoked” Review-Due Experience

- **Decision:** D-16
- **Original question:** Where does the recurring 90-day review reminder appear without external notifications?
- **Why it matters:** D-1 requires review while Milestone One excludes email, SMS, and push reminders.
- **Earlier recommended default:** Show an in-app item in My Kinward and the Care Recipient permission summary.
- **Approved answer:** Show “Access review due” in My Kinward, the relevant Care Recipient permission summary, and delegation detail. Keep it visible until continue, modify, suspend, or revoke; then reset 90 days. Record next and last review, reviewer, decision, and audit. Send no external reminder.
- **Gate:** Gate A before delegation-review interface coding.
- **Status:** Verified and Closed for Planning — D-16

## OQ-10 — Preview, Test, and Restricted Pilot Boundary

- **Decision:** D-17
- **Original question:** Which hosting and backend arrangement separates synthetic previews and tests?
- **Why it matters:** Isolation, credentials, logs, cleanup, and future real-data handling depend on explicit environment boundaries.
- **Earlier recommended default:** Separate local and controlled synthetic preview environments with no production data path; defer production infrastructure.
- **Approved answer:** Plan isolated local synthetic, hosted synthetic preview, and restricted real-family beta environments. The beta is the invite-only “Restricted real-care family pilot,” remains unauthorized, and may receive real information only after Gate C. It shares no data path or credentials with synthetic environments. Secure document sharing is a later separately approved slice outside Milestone One.
- **Gate:** Gate A for architecture; Gate C before real information; separate readiness before documents.
- **Status:** Verified and Closed for Milestone One Planning — D-17; Gate C restriction remains in force

## Non-Questions

- D-1 through D-7 remain approved and unchanged.
- Milestone One remains a non-medical foundation.
- These decisions do not authorize application coding, environment provisioning, real-data entry, document upload, or beta launch.
- Gate D still applies before public beta or App Store release.
