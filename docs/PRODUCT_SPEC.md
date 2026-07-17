# Kinward Product Specification

> **Status:** Current core product requirements; D-8 through D-17 closed and verified by targeted systems audit
> **Version:** 0.1
> **Last updated:** 2026-07-16
> **Governing or related decisions:** D-1 through D-17; F-01-R, F-02-R, F-17 through F-19

## 1. Product Summary

Kinward is a private family care-coordination application created by First & 8th. It helps a family coordinate practical, emotional, spiritual, and schedule-based support during cancer treatment and other serious illnesses.

Kinward answers three everyday questions:

1. What does the patient need today?
2. What does the primary caregiver need today?
3. What can each member of the family circle do to help?

Kinward coordinates care; it does not provide medical care. It does not diagnose, interpret symptoms, recommend treatment, or replace the patient's healthcare team.

## 2. Product Goals

- Reduce the coordination burden on the patient and primary caregiver.
- Give family members a clear, permission-appropriate view of today's needs.
- Make responsibilities visible without exposing unnecessary private information.
- Help the family prepare for treatment days and support recovery days.
- Track caregiver capacity and well-being as a first-class concern.
- Preserve each Care Recipient's control over their medical and personal information.
- Preserve each adult caregiver's control over their private well-being entries.
- Support shared and delegated management without turning family relationships or Circle administration into automatic medical authority.
- Provide a calm, accessible experience during periods of stress and fatigue.

## 3. Non-Goals

The initial product will not:

- Diagnose a condition or determine the cause or severity of a symptom.
- Recommend treatment, medication, dosage, supplements, diet changes, or clinical actions.
- Create automatic medical decisions or generic emergency or symptom thresholds.
- Replace calls, messages, portals, or visits with the healthcare team.
- Provide emergency dispatch or continuous clinical monitoring.
- Guarantee that a family member, caregiver, or clinician has reviewed an entry.
- Expose detailed medical information to the Extended Circle.
- Serve as a public social network or fundraising platform.

## 4. Users and Roles

The initial roles and designations are:

- **Care Recipient:** an adult receiving care who owns their medical and personal information and chooses a Care Management Mode.
- **Circle Head:** an adult who manages approved Circle membership, shared household preferences, and non-medical Circle settings. Circle Head status does not grant medical access.
- **Family Coordinator:** organizes people, assignments, and general family communication.
- **Medical Lead:** records and coordinates healthcare-team instructions and appointment details without creating medical advice.
- **Care Lead:** coordinates daily practical support for the patient and caregiver.
- **Chemo Care Lead:** coordinates preparation and recovery support around chemotherapy or another configured treatment cycle.
- **Backup Caregiver:** steps into approved caregiving responsibilities when needed.
- **Extended Circle:** receives limited, intentionally shared updates and practical ways to help, without detailed medical access.
- **Designated Care Representative:** an adult appointed by a Care Recipient to exercise explicit Kinward management permissions on that person's behalf. This is a designation, not legal healthcare authority.
- **Trusted Decision Contact:** a person identified for contact if authority or consent later requires review. The designation does not transfer authority.
- **Backup Circle Administrator:** an adult with a separate, dormant contingency role that may maintain approved non-medical Circle administration after approved activation if a Circle Head is unavailable. Dormant status grants no usable backup permissions, and the designation grants no automatic medical access or succession authority.

Children and teenagers may appear only as managed Extended Circle profiles controlled by an authorized adult in the MVP. They do not sign in independently.

One adult may hold more than one role, but every permission remains scoped to a Circle, a Care Recipient, an information type, and—where appropriate—a time window. A spouse or Circle Head receives no detailed medical access or delegated authority solely because of that relationship or role.

### 4.1 Care Management Mode

Every adult Care Recipient chooses one mode:

1. **Self-Managed:** the Care Recipient primarily manages their profile, permissions, information, and updates.
2. **Shared Management:** the Care Recipient shares selected Kinward management responsibilities with one or more approved adults.
3. **Delegated Management:** the Care Recipient appoints an adult Designated Care Representative to operate selected parts of Kinward on their behalf.

In Self-Managed mode, other people may retain non-management coordination or care roles, but those roles grant no management access to the Care Recipient's private information. Other-adult access exists only through explicit role permissions, Shared Management grants, Delegated Management grants, or separately recorded legal authority handled through the approved review process. Family relationship alone creates no access. Joint ownership of an adult Care Recipient record is excluded from the MVP.

Delegation may grant customized permissions or all Kinward management permissions. Available permission scopes include daily care, Patient Check-Ins, care and medical information, Circle updates, appointments and treatment schedules, Circle membership, privacy settings, documents, caregiving assignments, notifications, and emergency contacts.

Delegation requires explicit recorded consent and records the grantor, recipient, scope, start date, optional expiration, current status, changes, and revocation history. The interface recommends and prefills a 90-day expiration, while allowing the Care Recipient to deliberately choose “Until revoked.” Every delegation supports `active`, `suspended`, `expired`, and `revoked`. A delegation without an expiration generates a recurring 90-day access-review reminder. Immediate suspension or revocation removes permissions, preserves audit history, and invalidates active delegated sessions where technically possible. No family relationship, including spouse, creates an exception. Every delegated action shows who acted and on whose behalf. The Care Recipient retains access and may change, suspend, restore, or revoke delegation while able to do so.

Kinward permissions are separate from legal roles such as Healthcare Agent, Health Care Proxy, Power of Attorney, Guardian, or Personal Representative. Kinward may record that documentation exists but does not determine that it is valid or sufficient.

Role definitions and boundaries are detailed in `FAMILY_ROLES.md`.

## 5. Core Product Areas

### 5.1 Circle Today

A simple, permission-filtered view of what the family circle can do today.

Initial capabilities:

- Show open tasks the viewer is permitted to see or claim.
- Show approved schedule information and family updates.
- Make the next helpful action prominent.
- Hide private symptom, medical, and caregiver details unless explicitly permitted by role.
- Show Patient Today summary cards only to viewers with the relevant Care Recipient-specific permission.
- Show Caregiver Today summary cards only according to the caregiver author's sharing preference.
- Do not show a Caregiver Today summary automatically to a spouse, Circle Head, Family Coordinator, Care Recipient, or other adult.
- Show neither summary card to Extended Circle members by default; they may receive only manually approved family-safe Circle Updates.
- Keep summary access isolated per Care Recipient so access to one person's summary never reveals another person's summary.

### 5.2 Patient Today

A private daily view centered on the patient's schedule, support needs, comfort, and approved check-ins.

Initial capabilities:

- Show today's appointments and healthcare-team instructions.
- Offer the Patient Check-In, including its Symptoms section.
- Show assigned support and recovery tasks.
- Provide quick access to emergency contacts and the family emergency plan.
- Clearly identify the source and time of medical instructions.

### 5.3 Caregiver Today

A daily view for the primary caregiver that carries equal product importance to Patient Today.

Initial capabilities:

- Ask about caregiver capacity, rest, stress, and immediate support needs in plain language.
- Show caregiver-specific tasks, relief coverage, and breaks.
- Make it easy to request backup without guilt-inducing language.
- Keep detailed caregiver check-ins private to the approved audience.
- Surface unresolved caregiver needs to authorized coordinators without making clinical judgments.

### 5.4 Daily Care Check

An umbrella feature containing two distinct records that may be summarized together without merging permissions.

#### Patient Check-In

Allows the Care Recipient or an explicitly authorized adult to record overall condition, temperature, symptoms, food and hydration, medications, rest and movement, port or pump concerns, and support needs.

Symptoms are a section within the Patient Check-In. The Patient Check-In records what the person reports, who entered it, when it was entered, and whether it was entered on the Care Recipient's behalf. Kinward does not score, interpret, triage, create thresholds, recommend a response, or change medication.

#### Caregiver Check-In

Allows an adult caregiver to record energy, stress, physical capacity, rest, workload, tasks requiring coverage, and whether backup is needed.

Each adult owns their own private well-being entry. They may share the full entry, a limited status, a request for help, or nothing. A practical request such as “The caregiver needs backup” may be generated only according to that caregiver's selected sharing preference and must not reveal the private reason.

### 5.5 Family Task Assignments

A shared task system for meals, rides, errands, child support, household needs, check-ins, and respite.

Initial capabilities:

- Create, assign, claim, complete, and decline tasks.
- Separate task instructions from private medical context.
- Show only the minimum information needed to perform a task.
- Support backup ownership and handoff.
- Avoid exposing location or contact details beyond the people who need them.

Shared Household tasks use an explicit context with no active Care Recipient. They may cover general meals, groceries, laundry, household cleaning, general transportation logistics, and household coverage. They contain no diagnoses, symptoms, medications, private caregiver information, or other person-specific sensitive information; sensitive tasks belong to the relevant Care Recipient. Kinward does not build a mixed-owner sensitive-content approval workflow in the MVP.

A Shared Household task has a creator, optional assignee, status, and due-date information where applicable. An unassigned, declined, or overdue task routes to the Circle-wide Family Coordinator queue. If no active Circle-wide Family Coordinator exists, the task shows “No routing lead assigned.” A Circle Head may see that state and either assign a Family Coordinator or directly assign the non-sensitive task. No separate Circle-wide coordination role or generic task-level routing role exists.

### 5.6 Treatment Journey

A permission-aware cycle view for treatment preparation, treatment events, pump disconnection when applicable, recovery phases, rebuilding periods, and preparation for the next cycle.

Initial capabilities:

- Organize family logistics around healthcare-team-provided treatment dates and instructions.
- Keep sourced medical information separate from family coordination.
- Show a list alternative to any visual timeline.
- Avoid predicting recovery or recommending treatment actions.

### 5.7 Appointments

A separate event view for healthcare appointments, transportation, participants, and family support.

Initial capabilities:

- Record date, time, location, transportation needs, participants, and source.
- Distinguish healthcare appointments from family support events.
- Allow the Care Recipient or an authorized representative to share a limited event summary without clinical detail.
- Show time zone and last-updated information clearly.

### 5.8 Pre-Chemo Preparation

A reusable coordination checklist before chemotherapy or another configured treatment event.

Initial capabilities:

- Include family logistics and healthcare-team-provided instructions.
- Label each medical instruction with its healthcare-team source.
- Assign transportation, meals, childcare, supplies, and household tasks.
- Avoid generating preparation advice.

### 5.9 Recovery-Day Support

A plan for practical support after treatment.

Initial capabilities:

- Coordinate meals, hydration reminders only when healthcare-team approved, rides, rest coverage, household help, and check-ins.
- Provide quick access to the family's approved contact instructions.
- Track caregiver relief and backup coverage.
- Keep symptom details restricted to authorized roles.

### 5.10 Diet and Hydration

A Care tool for coordinating meals, drinks, and grocery support based on the Care Recipient's preferences and sourced healthcare-team instructions.

Initial capabilities:

- Coordinate family-provided meals, drinks, and grocery needs.
- Record dietary or fluid instructions only when supplied by the healthcare team and clearly label their source.
- Let the Care Recipient or caregiver state non-medical preferences and help requests without presenting them as clinical guidance.
- Avoid targets, calculations, recommendations, or judgments about whether intake is medically appropriate.

### 5.11 Gentle Movement

A separate Care tool for practical movement support based on the Care Recipient's preferences and sourced healthcare-team instructions.

Initial capabilities:

- Coordinate companionship or practical help for an activity the Care Recipient chooses.
- Record movement instructions only when supplied by the healthcare team and clearly label their source.
- Avoid exercise plans, targets, restrictions, performance scores, or judgments about what is safe.

### 5.12 Prayer and Meditation

Optional spiritual or reflective content controlled by the Care Recipient, content author, and applicable Circle permissions.

Initial capabilities:

- Allow the family to opt in or leave the feature unused.
- Support family-authored prayer, meditation, reflection, or encouragement preferences.
- Respect different beliefs and avoid assumptions about faith.
- Let the content author and authorized Circle permissions control who can view or contribute.

### 5.13 Emergency Contacts

A fast, readable list of family-approved contacts and instructions.

Initial capabilities:

- Separate emergency services, healthcare-team contacts, and family contacts.
- Make calling available through a large, clear action on supported devices.
- Show that Kinward does not contact anyone automatically unless that behavior is explicitly designed and approved later.
- Keep the family's written emergency plan easy to find.

## 6. MVP Navigation and Information Separation

### Today

- Circle Today
- Patient Today
- Caregiver Today
- Daily Care Check
- Prayer or meditation

### Care

- Patient Check-In history
- Diet and hydration
- Gentle movement
- Recovery support
- Healthcare-team instructions

### Schedule

- Treatment Journey
- Appointments
- Pre-chemo preparation
- Pump disconnection when applicable
- Recovery phases

### Tasks

- Family assignments
- Caregiver coverage
- Meals
- Transportation
- Pharmacy support
- Household support

### Circle

- Roles and permissions
- Circle updates
- Emergency contacts
- Privacy
- Settings

Treatment Journey and Appointments remain separate views. Diet and hydration and Gentle movement remain separate tools inside Care rather than top-level navigation items.

A user may belong to multiple Family Circles. A Circle may support multiple Care Recipients. The interface must provide a clear Circle and Care Recipient switcher, identify the active context at all times, support shared household tasks that are not tied to one Care Recipient, and strictly prevent information from crossing Circle or Care Recipient boundaries.

## 7. Privacy and Sharing Model

- Each Care Recipient owns and controls their medical and personal information.
- Circle Heads control only the shared Circle settings and membership permissions assigned to them.
- A spouse, Circle Head, Backup Circle Administrator, or family member receives no automatic detailed medical access.
- Detailed medical access requires the Care Recipient's grant or verified legal authority handled outside ordinary role assignment.
- Access is least-privilege and denied by default.
- No Circle role, support function, or internal Kinward account receives undocumented or automatic access to Circle or Care Recipient information.
- Patient medical information and each adult's private well-being information use separate scopes.
- Sensitive content is separated by Circle, Care Recipient, type, audience, and delegated authority.
- Extended Circle members see only information deliberately shared for their participation.
- Detailed medical information is never available to the Extended Circle.
- Managed minor profiles receive only authorized-adult-approved, age-appropriate information and supervised contributions. They cannot sign in, receive medical or emergency alerts, or hold adult caregiving responsibility.
- Unclear, disputed, or withdrawn consent results in the more private behavior and no publication.
- Changes to roles, sharing, and sensitive records should be auditable.

See `PERMISSIONS.md` for the initial access matrix.

## 8. Medical Safety

- Medical instructions must come from the patient's healthcare team.
- Every stored medical instruction must show its source, recorder, and last-updated time.
- Family-entered notes must not be presented as clinician instructions.
- The application must not imply continuous monitoring or clinical review.
- Emergency and urgent concerns must be directed outside Kinward according to the family's approved plan and local services.

See `MEDICAL_SAFETY.md` for detailed boundaries and content rules.

## 9. Experience and Accessibility Requirements

- Design mobile-first, beginning with narrow phone screens.
- Use plain language, short steps, and a calm visual hierarchy.
- Use large touch targets and generous spacing for primary actions.
- Support text resizing without loss of content or function.
- Support screen readers, keyboard operation, visible focus, high contrast, and reduced motion.
- Never rely on color, icons, gestures, or memory alone.
- Keep critical actions reachable with minimal navigation.
- Provide clear confirmation and recovery for consequential actions.
- Avoid dense dashboards, unexplained abbreviations, and time-pressure patterns.
- Test with older adults, caregivers under stress, and users with visual, motor, cognitive, or fatigue-related access needs.

The Kinward MVP accessibility conformance target is WCAG 2.2 Level AA. The exact browser, device, operating-system, screen-reader, and assistive-technology test matrix will be named in the first-family testing plan.

## 10. Data Principles

- Collect only information needed for a defined coordination purpose.
- Use synthetic, obviously fictional data in all non-production environments and materials.
- Do not copy real patient records into development, testing, demos, support examples, or screenshots.
- Encrypt sensitive information in transit and at rest once implementation begins.
- Define retention, deletion, export, backup, recovery, and account-closure policies before storing user data.
- Record access and sensitive changes in a privacy-respecting audit history.
- Avoid analytics or third-party services that receive health or family data without explicit review and approval.
- Do not describe Kinward as HIPAA-compliant unless a future documented review verifies that the product, organization, contracts, and operations support that claim.

## 11. Initial Success Measures

Success measures should focus on coordination and usability, not health outcomes. Candidate measures include:

- Patients and caregivers can identify today's support plan quickly.
- Families complete or reassign important tasks with fewer direct coordination messages.
- Primary caregivers regularly communicate their capacity and receive relief when requested.
- Users understand who can see an item before sharing it.
- Older adults can complete core actions independently.
- No Extended Circle workflow reveals detailed medical information.
- Users can distinguish healthcare-team instructions from family notes.

Exact measures and privacy-preserving analytics must be defined before analytics implementation, which is outside milestone one.

## 12. Remaining Product Decisions

- How First & 8th verifies legal authority and supporting documents without declaring them valid.
- How disputed authority, separation, death, guardianship, and account succession are reviewed in each launch region.
- What happens when a Care Recipient cannot revoke delegation and multiple people claim authority.
- Who may create, control, archive, or delete a managed minor profile and how adult-mediated contributions are retained.
- Whether a later version should support sensitive shared tasks requiring approval from multiple information owners; the MVP does not.
- The exact recovery process when a Designated Care Representative or Backup Circle Administrator loses account access.
- Whether clinicians have any direct access in the MVP; the current assumption is no.
- Whether the Symptoms section uses only neutral recording fields or includes a clinician-approved questionnaire.
- How urgent entries are handled without implying monitoring or clinical triage.
- Which notifications are essential and what sensitive information may appear on a lock screen.
- Which serious illnesses and treatment patterns the MVP supports beyond chemotherapy-focused workflows.

## 12.1 Approved Milestone-One Operational Boundaries

- Verified email is the only Milestone One authentication, account-verification, and invitation-binding channel. Identity remains separate from future contact methods.
- Another adult Care Recipient remains pending and inactive until they accept a dedicated ownership invitation and sole ownership. No private Care Recipient information is entered before acceptance; acceptance also establishes Circle membership.
- Routine authorized use does not repeat authentication. Consequential authority actions require authentication within the prior 15 minutes; backup activation and other designated strong actions require a fresh provider-supported challenge.
- The last active Circle Head cannot leave or lose that role until another verified adult accepts Circle Head.
- Backup activation requires an authorized Circle Head in Milestone One. If none is available, Kinward presents a neutral unavailable state and implements no alternate recovery determination.
- Family-visible audit history includes consequential denied authority writes. Routine denied reads use a separate privacy-safe security or operational channel where appropriate.
- “Until revoked” delegations show a recurring in-app 90-day “Access review due” item in My Kinward, the relevant Care Recipient permission summary, and delegation detail. No external reminder is part of Milestone One.
- Synthetic audit history is retained for the life of an active test environment and deleted only with its full synthetic dataset under a documented reset or retirement.
- D-13 defines the first-family iPhone, Android, desktop, and accessibility test matrix; exact installed versions are recorded before execution.
- Local development and hosted preview are synthetic-only. A separate invite-only **Restricted real-care family pilot** may use real information only after Gate C and signed readiness approval. Secure document sharing is a later, separately approved slice outside Milestone One.

## 13. Staged Governance Gates

- **Before non-medical milestone-one coding:** product-owner approval by the founder representing First & 8th; privacy and permission review against approved Kinward requirements; WCAG 2.2 Level AA baseline approval; and confirmation that development uses no real patient data.
- **Before Patient or Caregiver Check-In development:** medical-safety review of questions, wording, information sources, and escalation boundaries. The reviewer function may remain “Unassigned” until this gate.
- **Before storing real family health information:** complete Gate C security and privacy architecture review, including support access, authentication and authorization, recovery, incident response, logging, analytics, retention, deletion, export, backups, legal holds, environment isolation, and operational access. Sign `REAL_FAMILY_BETA_READINESS.md`. Reviewer functions may remain “Unassigned” until this gate.
- **Before public beta or App Store release:** qualified legal/privacy, child-safety, accessibility, and security review.

These are staged review requirements, not invented approvals. Unassigned reviewer functions do not imply that review occurred.
