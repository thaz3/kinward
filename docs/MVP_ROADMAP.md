# Kinward MVP Roadmap

> **Status:** Current supporting delivery plan; Milestone One application coding authorized (D-18)
> **Version:** 0.2
> **Last updated:** 2026-07-17
> **Governing or related decisions:** D-1 through D-18; F-17 through F-19

## Roadmap Purpose

This roadmap sequences planning, validation, and Milestone One implementation. Dates for later stages remain intentionally unset.

The MVP should prove that a family can coordinate today's care while preserving privacy, medical boundaries, accessibility, and caregiver well-being.

## Approved Delivery Sequence

1. Non-medical Milestone One foundation.
2. Wireframes and technical architecture.
3. Local synthetic development. **← current (D-18)**
4. Controlled synthetic hosted preview.
5. Gate C security and privacy architecture review.
6. Secure real-data environment preparation.
7. Secure document-sharing slice, if separately approved for the pilot.
8. Restricted real-family beta readiness review.
9. Invite-only **Restricted real-care family pilot**.
10. Later public-beta and release gates.

D-18 authorizes step 3 within Milestone One foundation scope. It does not authorize real-data entry, beta launch, medical features, or document uploads. Patient and Caregiver Check-Ins remain outside non-medical Milestone One. Gate C occurs before real-environment use because the restricted pilot may eventually contain real health information.

## Phase 0: Resolve Product Governance

### Outcomes

- Confirm the founder representing First & 8th as product owner.
- Before non-medical milestone-one coding, complete product-owner approval and privacy and permission review against approved Kinward requirements, confirm that no real patient data will be used, and apply the already approved WCAG 2.2 Level AA baseline.
- Adopt Care Recipient ownership, scoped Circle Head administration, and separate legal authority.
- Define Self-Managed, Shared Management, and Delegated Management consent and audit requirements.
- Define Trusted Decision Contact and Backup Circle Administrator boundaries.
- Define incapacity, disagreement, separation, death, and account succession review without granting automatic spouse authority.
- Confirm that each adult owns their private well-being entries and can request help without sharing the reason.
- Decide whether clinicians have any role in the MVP; current planning assumes they do not.
- Record later qualified-review gates without inventing reviewer names or credentials.
- Approve a policy prohibiting real patient information in all development and sample environments.

### Exit Criteria

- The product owner is named; reviewer functions may remain “Unassigned” until their named gate.
- Milestone-one privacy and permission review is complete, and the approved WCAG 2.2 Level AA baseline is confirmed for implementation verification.
- Synthetic-data-only development is confirmed.
- High-risk open decisions have written resolutions.
- Product claims and safety boundaries are approved.

## Phase 1: Validate Family Workflows

### Outcomes

- Interview or test concepts with patients, primary caregivers, older adults, and family coordinators using synthetic scenarios only.
- Map the daily coordination journey before treatment, on treatment days, during recovery, and between appointments.
- Validate the distinctions among Circle Today, Patient Today, and Caregiver Today.
- Define task assignment, decline, reassignment, backup, and completion flows.
- Determine the minimum useful calendar and emergency-contact information.
- Validate optional prayer and meditation support across different family preferences.

### Exit Criteria

- Core workflows are understandable in plain language.
- Caregiver needs have equal visibility in the daily model.
- Older adults can identify the next action without assistance in prototypes.

## Phase 2: Finalize Safety and Permissions

### Outcomes

- Approve the role and record-level permission model.
- Define Extended Circle summaries and verify that no detailed medical information can appear.
- Define managed minor profiles, authorized-adult controls, age-appropriate information, supervised contributions, and retention.
- Define the Patient Check-In Symptoms section content, limitations, contacts, and response expectations.
- Approve healthcare-team instruction sourcing and correction workflows.
- Define emergency copy and behavior for supported locations.
- Threat-model invitations, role changes, notifications, exports, support access, shared devices, and account recovery.

### Exit Criteria

- Permission matrix and safety copy are approved.
- Every sensitive information type has an owner and default audience.
- No workflow implies diagnosis, treatment advice, continuous monitoring, or guaranteed response.

## Phase 3: Design the MVP

### Outcomes

- Produce mobile-first flows for multiple Circles, multiple Care Recipients, the Care Recipient switcher, Care Management Mode, daily views, Patient and Caregiver Check-Ins, tasks, Schedule, treatment preparation, recovery support, prayer or meditation, and emergency contacts.
- Organize primary navigation into Today, Care, Schedule, Tasks, and Circle.
- Keep Treatment Journey and Appointments separate inside Schedule.
- Keep Diet and hydration and Gentle movement separate inside Care.
- Define family coordination flows for meals, hydration, and gentle movement without generating medical guidance.
- Define a design system with large touch targets, readable type, high contrast, visible focus, and plain language.
- Design empty, loading, error, offline, stale-information, and permission-denied states.
- Design privacy previews that show who will see an item before it is shared.
- Prototype caregiver check-ins and requests for relief without guilt-inducing language.
- Test accessibility with screen readers, text enlargement, keyboard input, and reduced motion.

### Exit Criteria

- WCAG 2.2 Level AA is reflected in acceptance criteria.
- Prototypes pass usability review with older adults and stressed or fatigued users.
- Sensitive information never appears in an unauthorized role's prototype.

## Phase 4: Define Technical and Data Architecture

This phase begins only after the preceding product decisions are approved.

### Outcomes

- Select an application architecture based on the approved requirements.
- Define identity, authentication, invitation, consent, role, delegation, legal-role metadata, and session models.
- Enforce strict separation between Family Circles and between Care Recipients within one Circle.
- Support shared household tasks that are not tied to one Care Recipient without leaking private context.
- Route unassigned, declined, or overdue Shared Household tasks to the Circle-wide Family Coordinator queue; show “No routing lead assigned” if none is active.
- Define encryption, audit, backup, recovery, retention, deletion, and export controls.
- Define safe notification behavior and lock-screen privacy.
- Define environment separation and synthetic-data tooling.
- Establish accessibility, security, privacy, and permission test strategies.

### Exit Criteria

- Architecture has privacy, security, safety, and accessibility approval.
- The data model supports record-level audiences and temporary access.
- No production data is needed for development or testing.

## Phase 5: Implement and Verify the MVP

Implementation is intentionally out of scope for the current project phase.

When authorized, suggested delivery slices are:

1. Multiple-Circle setup, Circle Heads, Care Recipients, roles, context switching, and emergency contacts.
2. Care Management Mode, explicit delegation, revocation, and delegated-action audit.
3. Circle Today, shared household tasks, family assignments, and limited Circle updates.
4. Patient Today, Patient Check-In, Treatment Journey, Appointments, and sourced healthcare-team instructions.
5. Caregiver Today, privately owned well-being check-ins, respite, and backup coverage.
6. Managed minor profiles and adult-mediated, age-appropriate participation.
7. Pre-chemo preparation, pump disconnection when applicable, and recovery phases.
8. Diet and hydration, Gentle movement, and Recovery support inside Care.
9. Optional prayer and meditation.

Each slice should include permission tests, applicable accessibility review, and synthetic sample data from the start. Medical-safety review is required before Patient or Caregiver Check-In development and for later medically sensitive workflows, not for the non-medical milestone-one foundation.

## Proposed MVP Scope

### Include

- Multiple private Family Circles per user.
- Multiple Care Recipients within one Circle with strict data separation.
- Care Recipient, Circle Head, the initial coordination roles, primary caregiver, Trusted Decision Contact, Backup Circle Administrator, and Designated Care Representative designations.
- Self-Managed, Shared Management, and Delegated Management with explicit, scoped, revocable consent and audit history.
- Managed minor profiles without independent sign-in.
- Circle Today, Patient Today, and Caregiver Today.
- Daily Care Check with separate Patient and Caregiver Check-Ins.
- Patient-reported condition, temperature, symptoms, food and hydration, medication references, rest and movement, port or pump concerns, and support needs without diagnosis or interpretation.
- Adult-owned caregiver well-being entries and relief requests that do not expose the private reason.
- Family tasks with assignment and backup.
- Separate Treatment Journey and Appointments views within Schedule.
- Pre-treatment and recovery support checklists.
- Diet, hydration, and gentle movement coordination based on preferences or sourced healthcare-team instructions.
- Optional prayer and meditation content.
- Emergency and healthcare-team contacts.
- Permission-filtered limited family updates.
- Audit history for sensitive changes.

### Defer Unless Research Changes the Decision

- Direct clinician accounts or healthcare-system integration.
- Automated symptom triage or treatment recommendations.
- Medication dosing, interaction checking, or clinical measurement interpretation.
- Public posting, social networking, or fundraising.
- Automated child summaries generated from adult medical content.
- Independent minor accounts.
- Automatic legal-authority validation or transfer based on a Kinward role.
- Third-party analytics that may receive sensitive information.
- Any HIPAA-compliance claim before legal, security, privacy, contractual, and operational review.

## MVP Release Gates

The MVP should not launch until:

- Medical-safety language and flows have clinical and legal review.
- Extended Circle access has been tested to prevent detailed medical disclosure.
- Managed minor profiles cannot sign in, receive medical or emergency alerts, view restricted content, or hold adult caregiving responsibility.
- Caregiver well-being is present and not treated as an optional afterthought.
- Each adult's private well-being scope is tested separately from every Care Recipient's medical scope.
- Spouse, Circle Head, Family Coordinator, and Backup Circle Administrator status do not create automatic medical access.
- Delegation consent, scope, optional expiration, the 90-day recommended prefill and recurring access-review reminder, “Until revoked,” lifecycle states, revocation, session invalidation where technically possible, and “on behalf of” audit behavior are verified.
- Circle and Care Recipient boundaries are tested across screens, search, tasks, notifications, exports, and audit views.
- Core actions meet the selected accessibility standard and pass testing with older adults.
- Authentication, authorization, encryption, audit, notification privacy, backup, recovery, export, retention, and deletion controls are verified.
- Emergency behavior and regional limitations are clear.
- All demonstrations and tests use synthetic data.
- A security and privacy incident response process exists.

## Staged Governance Gates

D-6 governs the timing of these reviews. Requirements in later gates do not block the non-medical Milestone One foundation.

### A. Required Before Non-Medical Milestone One Coding

- Product-owner approval by the founder representing First & 8th.
- Privacy and permission review against approved Kinward requirements.
- Use the approved WCAG 2.2 Level AA accessibility baseline.
- Confirm that only fictional or synthetic development data will be used.

### B. Required Before Patient or Caregiver Check-In Development

- Medical-safety review of the questions.
- Medical-safety review of the wording.
- Review of healthcare-team instruction-source labels.
- Review of escalation boundaries without implying monitoring, diagnosis, or treatment advice.

### C. Required Before Real Family Health Information Is Stored

- Security architecture review.
- Privacy architecture review.
- Review of support-access rules.
- Review of authentication, authorization, session, recovery, and incident-handling rules.
- Production data lifecycle review, including retention, deletion, export, backup, and legal-hold behavior.
- Review of isolated configuration, credentials, database, private storage, logs, backups, operational access, and prevention of data movement into synthetic environments.
- Review of logging, analytics, error-report, and sensitive-content protections.
- Signed `REAL_FAMILY_BETA_READINESS.md` approval before real information is entered.

### D. Required Before Public Beta or App Store Release

- Qualified privacy and legal review.
- Security review.
- Independent accessibility review.
- Child-safety review.
- Public consent and policy review.

### Other Decisions at Their Named Feature Gates

The following decisions remain unresolved but do not block the non-medical Milestone One foundation unless their corresponding feature or data gate begins:

- Legal-document intake, disputed authority, incapacity, separation, death, succession, and representative recovery procedures.
- Managed-minor ownership transfer, contribution retention, deletion, and transition at adulthood.
- Any later sensitive shared-task workflow requiring multiple owners' approval; the MVP uses non-sensitive Shared Household tasks and Family Coordinator routing.
- Patient Check-In content and response expectations, which remain subject to Gate B.
- Emergency behavior, launch geography, notification channels, and locked-screen wording.
- Broader device and assistive-technology coverage beyond D-13's first-family matrix remains a Gate D requirement.
- Alternate identity recovery, final production data policies, final MVP prioritization, and privacy-preserving measures of success.
- Secure document-sharing implementation and readiness, including private storage, authorization, malware protections, audit, retention, deletion, backups, and incident response.
