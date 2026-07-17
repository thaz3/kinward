# Kinward Test Family Overview

> **Status:** Current supporting synthetic-family validation reference; D-8 through D-17 closed and verified by targeted systems audit
> **Version:** 0.1
> **Last updated:** 2026-07-16
> **Governing or related decisions:** D-1 through D-17; F-01-R, F-02-R, F-17 through F-19

## Document Purpose

This document explains the planned Kinward experience through one entirely fictional family. Every name, relationship, event, instruction, and care situation below is synthetic. Nothing is based on or intended to imitate a real patient, family, clinician, treatment plan, or healthcare organization.

This is a product-planning document, not application behavior or medical guidance. It distinguishes approved MVP decisions from remaining operational and edge-case decisions instead of silently inventing rules.

## Approved MVP Decisions Used in This Overview

- Each adult Care Recipient owns and controls their medical and personal information.
- Each adult Care Recipient is the sole owner of their record; joint ownership is excluded from the MVP.
- Other adults receive access only through explicit role permissions, Shared Management grants, Delegated Management grants, or separately recorded legal authority handled through the approved review process; family relationship alone creates no access.
- Circle Heads manage assigned shared Circle settings but receive no automatic medical access.
- Each adult owns their private well-being entries and chooses whether to share a full entry, limited status, request for help, or nothing.
- Each adult Care Recipient chooses Self-Managed, Shared Management, or Delegated Management.
- A Designated Care Representative receives explicit, recorded, revocable Kinward permissions and no automatic legal authority.
- Delegation expiration is optional: the interface prefills 90 days, permits a deliberate “Until revoked” choice, and schedules a recurring 90-day access review when no expiration is set.
- Children and teenagers use managed Extended Circle profiles controlled by an authorized adult; they do not sign in independently.
- Daily Care Check contains separate Patient and Caregiver Check-Ins. Symptoms are a section inside the Patient Check-In.
- The MVP navigation is Today, Care, Schedule, Tasks, and Circle.
- Treatment Journey and Appointments are separate Schedule views. Diet and hydration and Gentle movement are separate Care tools.
- One user may belong to multiple Family Circles, and one Circle may have multiple Care Recipients with strict context separation.
- Shared Household tasks are non-sensitive, use no active Care Recipient, and route to the Circle-wide Family Coordinator queue when unassigned, declined, or overdue.
- Patient Today summaries require the relevant Care Recipient-specific permission; caregiver summaries follow the caregiver author's choice; Extended Circle members see neither by default.
- Clinicians do not have Kinward accounts in the MVP.
- A Patient Check-In records reported information without scoring, diagnosis, triage, medication changes, or Kinward-created thresholds.
- Emergency actions open approved contacts and instructions; Kinward does not determine that an emergency exists.
- Legal roles and documents remain separate from Kinward permissions, and Kinward does not declare them valid.

---

## 1. What Kinward Is

Kinward is a private place for a family to organize care during cancer treatment or another serious illness. It reduces the need for the patient and spouse to answer the same questions repeatedly, remember every task, or personally coordinate every helper.

Kinward helps the family understand:

- What the patient needs today.
- What the primary caregiver needs today.
- Which appointments and treatment events are coming up.
- Who has accepted each ride, meal, household task, or caregiving shift.
- Which updates are safe to share with the wider family.
- Which information must remain private.
- How to find the family's written healthcare-team instructions and contact information.

Kinward serves the patient, the household caregiver, trusted core helpers, backup caregivers, and a limited Extended Circle. Each person sees a different version based on their role and the audience chosen for each item.

Kinward does not provide medical care. It does not diagnose symptoms, decide whether something is urgent, choose treatment, change medication, create food or exercise plans, or tell a family what is medically safe. Medical instructions displayed in Kinward must come from the patient's healthcare team and show their source.

---

## 2. The Test Family

The **Vale Family Circle** is entirely fictional. Melvina is receiving outpatient chemotherapy in a synthetic scenario. Her fictional healthcare team has provided written preparation, contact, appointment, and portable-pump instructions. This document does not state those instructions as general advice.

### Melvina Vale — Care Recipient and Circle Head

- **Relationship:** The patient at the center of the Circle.
- **Responsibilities:** Owns her medical and personal information, chooses her Care Management Mode, grants access, and helps manage shared Circle settings as a Circle Head.
- **Can see:** Her full Patient Check-In history, sourced healthcare-team instructions, all appointments, care tasks, Circle membership, privacy settings, and approved caregiver support needs.
- **Cannot do through Kinward:** Diagnose herself, receive treatment recommendations, or assume that a saved entry has been reviewed.

### DoMonique Vale — Spouse, Circle Head, Primary Caregiver, and Designated Care Representative

- **Relationship:** Melvina's spouse and the adult living with her.
- **Responsibilities:** Coordinates the household, helps with daily care, completes his own Caregiver Check-In, and exercises only the Kinward management permissions Melvina explicitly delegates.
- **Can see:** Shared Circle information, household tasks, his own caregiver records, and Melvina's information within her recorded delegation.
- **Private area:** DoMonique's detailed caregiver well-being entries remain visible only to DoMonique and people DoMonique deliberately approves. Practical requests such as “I need coverage this evening” may be shared without the private explanation.
- **Authority boundary:** Marriage and Circle Head status do not grant medical access. In this fictional example, Melvina chooses Delegated Management and separately appoints DoMonique.

### T.J. Vale — Family Coordinator and Backup Circle Administrator

- **Relationship:** Melvina's adult sister.
- **Responsibilities:** Drafts Circle updates, watches open tasks, proposes invitations, keeps family communication organized, and may provide approved non-medical Circle administration continuity after Backup Circle Administrator activation if DoMonique is unavailable.
- **Can see:** Coordination information, limited calendar details, shared Circle updates, and task status.
- **Cannot see:** Symptoms, treatment notes, private caregiver entries, test information, or other detailed medical records by default. Backup Circle Administrator status does not expand that access.

### Akira Cho — Medical Lead

- **Relationship:** A trusted adult family friend.
- **Responsibilities:** Records information supplied by the fictional healthcare team, keeps healthcare contacts current, prepares a question list for Melvina, and maintains appointment details.
- **Can see:** The approved medical scope, Patient Check-In Symptoms history, full appointment information, and sourced healthcare-team instructions.
- **Cannot do:** Interpret symptoms or results, change instructions, create medical advice, or share detailed information outside the approved audience.

### Sharae Brooks — Care Lead

- **Relationship:** A close friend of Melvina and DoMonique.
- **Responsibilities:** Coordinates meals, rides, errands, household help, companionship, and caregiver respite.
- **Can see:** Practical needs, task status, visit preferences, and caregiver requests that DoMonique has chosen to share.
- **Cannot see:** Detailed medical information or DoMonique's private Caregiver Check-In by default.

### Martin Vale — Chemo Care Lead

- **Relationship:** Melvina's adult brother.
- **Responsibilities:** Coordinates treatment-day transportation, preparation tasks, recovery coverage, and any portable-pump logistics copied from the healthcare team's written plan.
- **Can see:** Treatment dates, necessary logistics, sourced instructions within the treatment window, and assigned recovery tasks.
- **Cannot see:** The entire medical history or create preparation and recovery advice.

### Dee Green — Backup Caregiver 1

- **Relationship:** A trusted neighbor.
- **Responsibilities:** Covers short household and companionship shifts when DoMonique requests relief.
- **Can see:** The specific shift, needed household details, approved contacts, and only the instructions needed during that shift.
- **Access limit:** Access begins and ends with the approved coverage window.

### Carlos Martin — Backup Caregiver 2

- **Relationship:** DoMonique's adult nephew.
- **Responsibilities:** Provides transportation and pharmacy pickup when assigned.
- **Can see:** Pickup details, timing, and the minimum contact or location information required for the task.
- **Access limit:** No Patient Check-In Symptoms history, treatment notes, or unrelated appointments.

### Barbie Ford — Backup Caregiver 3

- **Relationship:** Melvina's retired aunt.
- **Responsibilities:** Provides daytime companionship and gives DoMonique a planned break.
- **Can see:** Her coverage window, visit preferences, approved household notes, and family contacts needed for handoff.
- **Access limit:** She does not receive permanent access to medical or caregiver records.

Melvina identifies Barbie as her **Trusted Decision Contact**. This means First & 8th may contact Barbie if authority or consent later requires review. It gives Barbie no automatic Kinward access, medical decision-making authority, or legal status.

### Mia Vale — Managed Child Extended Circle Profile

- **Relationship:** Melvina and DoMonique's fictional nine-year-old child.
- **MVP participation:** DoMonique manages Mia's profile. Mia does not sign in. DoMonique may share an approved child-appropriate update and submit a drawing, message, prayer, or supervised voice note on her behalf.
- **Can receive:** Simple information such as “Mom has a clinic day and will rest afterward. Aunt T.J. will pick you up.”
- **Must not receive through Kinward:** Symptoms, diagnoses, treatment details, private caregiver concerns, emergency speculation, or adult task responsibility.

### Noah Vale — Managed Teen Extended Circle Profile

- **Relationship:** Melvina and DoMonique's fictional sixteen-year-old child.
- **MVP participation:** DoMonique manages Noah's profile. Noah does not sign in. DoMonique may share a separately approved teen update and submit a supervised message, drawing, prayer, or voice note on his behalf.
- **Can receive:** Information such as “Treatment is Wednesday. The family has rides and dinner covered. Please check with Dad before inviting friends over.”
- **Must not receive through Kinward:** The adult medical record, symptom history, test details, private Caregiver Check-In, or responsibility for medical decisions or primary care.

Neither minor receives symptoms, medication information, prognosis, emergency information, private documents, adult caregiver records, medical or emergency alerts, sensitive locked-screen notifications, or adult caregiving responsibility. Direct minor accounts remain postponed for future legal, privacy, consent, and child-safety review.

---

## 3. How the Family Sets Up Kinward

### Step 1: Create the Family Circle

Melvina starts the fictional **Vale Family Circle**, creates her Care Recipient profile, and becomes a Circle Head. She invites DoMonique as a second Circle Head and identifies him as primary caregiver. Kinward explains that Circle administration does not create medical authority.

Melvina selects **Delegated Management** and appoints DoMonique as her Designated Care Representative. She chooses “Grant all Kinward management permissions,” reviews every included scope, records explicit consent, and deliberately selects “Until revoked” instead of the prefilled 90-day expiration. The record stores Melvina as grantor, DoMonique as recipient, scope, start date, optional expiration, status, and future change history. Because there is no expiration, Kinward schedules a recurring 90-day access-review reminder. Melvina retains access and may change, suspend, or revoke it while able to do so.

This appointment concerns Kinward app management only. It does not create healthcare power of attorney, legal authority, or a finding that Melvina lacks decision-making ability.

The Vale Circle contains one Care Recipient in this walkthrough, but the product supports additional Care Recipients. Every screen must display the active Circle and Care Recipient. Shared Household tasks are labeled with no active Care Recipient.

### Step 2: Invite Adult Members

Melvina or DoMonique enters each adult's verified email address and proposed role within their authorized scope. T.J. may prepare invitation suggestions, but an authorized Circle Head or representative approves them.

Each invitation:

- Expires after a defined period.
- Works only after the recipient verifies and uses the matching invited email identity.
- Shows the proposed role and a plain-language access summary before acceptance.
- Warns that private family information must not be forwarded or copied outside the Circle.
- Requires the Care Recipient or an authorized representative to confirm detailed medical access.

No government identification, selfie, or medical record is requested for ordinary invitations.

### Step 3: Accept Invitations

Each adult opens the one-time invitation, verifies and uses the matching invited email identity, confirms their display name, reviews the role, and accepts or declines.

An authorized Circle Head sees who accepted. If the accepting verified email identity does not match the invitation, access is not granted and an authorized Circle Head receives a generic security notice.

### Step 4: Assign Roles and Time Limits

Melvina approves access to her information directly or through DoMonique's active delegated scope. Circle roles remain separate from medical access. Dee, Carlos, and Barbie receive Backup Caregiver access only for assigned coverage windows.

The test default is:

- Medical Lead access is reviewed periodically.
- Chemo Care Lead access is limited to approved treatment-cycle information.
- Backup Caregiver access automatically expires after the coverage window.
- New role access does not reveal old private records unless Melvina or an authorized representative shares them deliberately.

Melvina and DoMonique designate T.J. as dormant Backup Circle Administrator for non-medical Circle continuity. The designation grants no usable backup permissions before approved activation. Melvina identifies Barbie as Trusted Decision Contact. The setup explains that neither designation creates medical access, legal authority, or automatic succession.

### Step 5: Create Managed Minor Profiles

DoMonique creates managed Extended Circle profiles for Mia and Noah and accepts responsibility for supervising them. The setup explains that they cannot sign in, receive medical or emergency alerts, view restricted information, or hold adult caregiving responsibility.

DoMonique may submit an approved prayer, message, drawing, voice note, or supervised contribution on a minor's behalf. Every contribution identifies the minor and the adult who submitted it.

### Step 6: Choose Privacy Settings

The setup asks about each information class separately for each Care Recipient and adult information owner:

- Detailed medical information.
- Patient Check-In entries, including the Symptoms section.
- Caregiver well-being.
- Appointment details.
- Family tasks.
- Contacts and locations.
- Circle updates.
- Prayer, meditation, and encouragement.
- Managed minor profiles and age-appropriate contributions.

Before saving, Kinward displays the active Circle, active Care Recipient, information owner, and “Who will see this?” in plain language. Detailed medical information can never be shared with Extended Circle members or managed minors.

### Step 7: Enter Emergency Contacts

Melvina and DoMonique enter fictional placeholders for:

- Local emergency services for the selected launch region.
- The healthcare team's urgent contact.
- The healthcare team's after-hours contact.
- DoMonique as primary family contact.
- Dee as nearby backup contact.

Kinward labels each contact by purpose. It does not decide which contact is medically appropriate or call anyone automatically.

### Step 8: Enter Healthcare-Team Instructions

Akira records a fictional instruction supplied by the fictional care team. The record includes:

- Source: “Fictional Cancer Center treatment handout.”
- Date received.
- Entered by Akira.
- Whether the wording was copied or summarized.
- Approved audience.
- Last-updated time and edit history.

The instruction appears in a visibly different style from family notes. No unsourced medical checklist item is added.

### Step 9: Set Notification Preferences

Each adult chooses in-app, push, email, or generic SMS notifications where supported. The default lock-screen and SMS text is limited to wording such as:

> Kinward: You have a new update. Open Kinward to view it.

Private content appears only after authentication. The setup explains that notification delivery can be delayed or fail and that Kinward notifications are not emergency alerts.

Mia and Noah do not receive direct notifications in the MVP.

---

## 4. Permission and Privacy Walkthrough

### Information Levels

#### Private Medical Information

Example: “Melvina recorded a new symptom at 8:10 a.m. and added a private note for Akira.”

- Visible to Melvina, DoMonique within Melvina's active delegated scope, and Akira within his Medical Lead scope.
- Not visible to T.J., Sharae, the Extended Circle, Mia, or Noah.
- Never copied into a general update automatically.

#### Core Care-Team Information

Example: “Treatment appointment Wednesday at the fictional clinic. DoMonique is driving. Martin is coordinating the return-home plan.”

- Full details are visible to Melvina, her authorized representative within scope, Akira, and approved treatment-window roles.
- Sharae may see logistics needed to arrange support.
- A Backup Caregiver sees only the details needed for an assigned shift.
- Extended Circle members do not see treatment type, facility details, or healthcare instructions.

#### Family Circle Update

Example: “Wednesday is a quiet day for the household. Dinner is covered. Please hold calls until DoMonique posts another update.”

- Drafted by T.J., Akira, Sharae, or Martin.
- Approved by Melvina or by DoMonique when Melvina's active delegation includes update approval. Melvina may revoke or change that authority while able to do so.
- Visible only to the selected adult audience.

#### Age-Appropriate Extended Circle Update

Example for Mia: “Mom has a clinic day and will rest. Aunt T.J. will handle school pickup.”

Example for Noah: “Wednesday's treatment plan and rides are covered. Please ask Dad before having visitors.”

- Separately written; never automatically generated by shortening the medical record.
- Approved by Melvina or an authorized adult for the managed minor profile.
- Delivered through the managing adult; the minor does not sign in.

### Role-by-Role Permissions

#### Care Recipient: Melvina

- **See:** Her information, grants, delegated actions, tasks, schedules, contacts, and approved Circle information.
- **Add:** Her records, tasks, notes, contacts, and updates.
- **Edit:** Her entries and authorized shared records; healthcare-team instruction edits retain history.
- **Share:** Her information through explicit audience choices and previews.
- **Hidden:** DoMonique's private caregiver entries and another Care Recipient's information unless the owner shares them.
- **Approval:** Approves access and updates about herself or explicitly delegates that action.

#### Circle Head and Designated Care Representative: DoMonique

- **See:** Shared Circle administration plus Melvina's records within her current delegated scopes.
- **Add:** Circle information and on-behalf-of records permitted by delegation.
- **Edit:** Authorized settings and records, with every delegated action attributed to DoMonique acting for Melvina.
- **Share:** Only within Melvina's active grant or DoMonique's own information ownership.
- **Hidden:** Any scope Melvina did not grant, another Care Recipient's information, and other adults' private well-being entries.
- **Approval:** May approve updates about Melvina only because she explicitly delegated that scope—not because he is her spouse or Circle Head.

#### Family Coordinator: T.J.

- **See:** General tasks, shared schedule summaries, membership status, and approved Circle updates.
- **Add:** Draft updates, proposed invitations, and coordination tasks.
- **Edit:** Drafts and general tasks within her scope.
- **Share:** Cannot publish beyond the audience approved by the relevant information owner or authorized representative.
- **Hidden:** Symptoms, medical notes, tests, full appointments, and private caregiver entries.
- **Approval:** The Care Recipient or authorized representative approves updates about that person; a Circle Head may approve only assigned non-medical Circle content.

#### Medical Lead: Akira

- **See:** Approved detailed medical records, symptom entries, full appointments, sourced instructions, and healthcare contacts.
- **Add:** Healthcare-team instructions with source details, appointment notes, and question lists.
- **Edit:** Sourced instructions within scope, with a visible edit history.
- **Share:** May draft a summary but cannot expand its audience.
- **Hidden:** DoMonique's private caregiver entries and unrelated household details.
- **Approval:** The Care Recipient or authorized representative approves family-facing medical summaries.

#### Care Lead: Sharae

- **See:** Practical needs, tasks, visit preferences, shared caregiver support requests, and limited schedule logistics.
- **Add:** Meals, rides, chores, companionship, and respite tasks.
- **Edit:** Care tasks and coverage within scope.
- **Share:** May draft general updates about practical needs.
- **Hidden:** Symptom details, treatment notes, test information, and unshared caregiver entries.
- **Approval:** The relevant information owner or authorized representative approves wider updates.

#### Chemo Care Lead: Martin

- **See:** Approved treatment-window logistics and sourced instructions needed for coordination.
- **Add:** Preparation, transportation, recovery, and pump-appointment tasks.
- **Edit:** Treatment-cycle tasks and sourced instruction records within his approved scope, with history.
- **Share:** May draft a treatment-day logistics update without clinical details.
- **Hidden:** Unrelated medical history, private caregiver notes, and records outside his time-limited scope.
- **Approval:** The Care Recipient or authorized representative approves wider updates.

#### Backup Caregivers: Dee, Carlos, and Barbie

- **See:** Only assigned coverage, necessary contacts, household details, and approved instructions for that window.
- **Add:** Completion and handoff notes.
- **Edit:** Their own task status and handoff notes.
- **Share:** Cannot publish Circle updates by default.
- **Hidden:** The broader medical record, unrelated appointments, and private caregiver information.
- **Approval:** The Care Recipient or a representative with that explicit scope approves expanded access.

#### Extended Circle Adults

The fictional test family does not include an additional adult Extended Circle persona, but the role is still part of the product model.

- **See:** Deliberately shared non-clinical updates and claimable practical tasks.
- **Add:** Encouragement and optional prayer or meditation content if the applicable Circle and content-owner permissions allow it.
- **Edit:** Their own contributions and accepted task status.
- **Share:** Cannot republish Kinward content through the product.
- **Hidden:** All detailed medical information, symptoms, treatment notes, private caregiver entries, unshared appointments, and child-specific information.
- **Approval:** An authorized Circle Head approves general Circle updates; the Care Recipient or representative approves content about that person.

#### Mia and Noah: Managed Minor Profiles

- **See:** No direct in-app content because minors do not sign in.
- **Add or edit:** DoMonique may submit an approved prayer, message, drawing, voice note, or supervised contribution on their behalf.
- **Share:** The managing adult controls any permitted audience.
- **Receive:** Adult-mediated, separately approved, age-appropriate summaries.
- **Hidden:** Symptoms, medications, prognosis, emergency information, private documents, adult caregiver information, and all other restricted content.
- **Approval:** The authorized managing adult and relevant Care Recipient approve each item according to its content.

---

## 5. Complete Screen-by-Screen Product Tour

The approved primary navigation is:

- **Today:** Circle Today, Patient Today, Caregiver Today, Daily Care Check, and prayer or meditation.
- **Care:** Patient Check-In history, Diet and hydration, Gentle movement, Recovery support, and healthcare-team instructions.
- **Schedule:** Treatment Journey, Appointments, Pre-chemo preparation, pump disconnection when applicable, and recovery phases.
- **Tasks:** Family assignments, caregiver coverage, meals, transportation, pharmacy support, and household support.
- **Circle:** Roles and permissions, Circle updates, Emergency contacts, Privacy, and Settings.

The header always identifies the active Family Circle and Care Recipient and provides a clear switcher. Shared Household tasks are labeled “Shared Household — no active Care Recipient” rather than appearing under one Care Recipient. Switching Circles or Care Recipients must never carry over private content, filters, search results, drafts, or notifications from the previous context.

### Circle Today

- **Primary users:** Every authenticated adult, with a Circle- and Care-Recipient-filtered version.
- **Displays:** Today's approved updates, relevant tasks, permission-filtered Patient and Caregiver summaries, limited schedule items, and the next useful action. Patient summaries require that Care Recipient's specific permission. Caregiver summaries follow the caregiver author's sharing preference and do not appear automatically to a spouse, Circle Head, Family Coordinator, Care Recipient, or other adult. Extended Circle members see neither card by default.
- **Actions:** Claim, accept, decline, complete, or open an allowed item.
- **Private:** Medical details, symptoms, private caregiver entries, and unshared locations never leak into the general feed.
- **Empty state:** “Nothing has been shared with you today. You can check your tasks or come back later.”
- **Accessibility:** One clear main action, large controls, headings announced by screen readers, no color-only status, and comfortable text resizing.

### Patient Today

- **Primary users:** The active Care Recipient and a Designated Care Representative or other adult explicitly permitted to act on their behalf.
- **Displays:** Today's appointments, sourced healthcare-team instructions, support plan, and Patient Check-In Symptoms section entry point.
- **Actions:** Record a check-in, review instructions, request practical help, open contacts, and approve a family-safe update.
- **Private:** Detailed entries stay within the approved medical audience.
- **Empty state:** “There is nothing scheduled today. You can record how today is going or request help.”
- **Accessibility:** Short sections, plain labels, large “Record today's check-in” and “Contacts” buttons, and no dense charts.

### Caregiver Today

- **Primary users:** DoMonique as primary caregiver.
- **Displays:** DoMonique's tasks, coverage, planned breaks, private check-in, and open requests for help.
- **Actions:** Record capacity, request backup, share only a practical need, and hand off a shift.
- **Private:** DoMonique's feelings and detailed notes remain in DoMonique's chosen audience.
- **Empty state:** “No caregiver plan is set for today. Add a break or ask for backup.”
- **Accessibility:** Nonjudgmental language, an obvious “I need backup” action, large touch targets, and no shame-based streaks or scores.

### Daily Care Check

- **Primary users:** Melvina for the Patient Check-In and DoMonique for his own Caregiver Check-In; an approved adult may complete a Patient Check-In only within explicit scope.
- **Displays:** Two clearly separated paths. Patient Check-In includes overall condition, temperature, symptoms, food and hydration, medications, rest and movement, port or pump concerns, and support needs. Caregiver Check-In includes energy, stress, physical capacity, rest, workload, tasks needing coverage, and backup need.
- **Actions:** Choose the correct person, record a neutral check-in, select an audience, and optionally create a practical task or contact someone.
- **Private:** Patient and caregiver records never merge automatically or inherit the same audience.
- **Empty state:** “No check-in has been recorded today. Recording is optional.”
- **Accessibility:** One question per step, a clear progress indicator, save-and-return support, and no forced completion.

### Family Tasks

- **Primary users:** Care Recipients, authorized representatives, Circle Heads, T.J., Sharae, Martin, Backup Caregivers, and Extended Circle adults within scope.
- **Displays:** Open, assigned, accepted, declined, overdue, and completed practical tasks. Unassigned, declined, or overdue Shared Household tasks route to the Circle-wide Family Coordinator queue. When none is active, the task displays “No routing lead assigned”; a Circle Head may assign a Family Coordinator or directly assign the non-sensitive task.
- **Actions:** Create, claim, assign, decline, reassign, complete, and request backup.
- **Private:** Shared Household task cards contain no diagnoses, symptoms, medications, private caregiver information, or other person-specific sensitive information. Sensitive tasks are tied to the relevant Care Recipient.
- **Empty state:** “No tasks need attention. Add a practical need when the family is ready.”
- **Accessibility:** Large status buttons with text labels, forgiving confirmation, clear due dates, and alternatives to drag-and-drop.

### Treatment Journey

- **Primary users:** The active Care Recipient, an authorized representative, Akira, and approved treatment-window roles.
- **Displays:** Treatment cycles as a simple timeline with preparation, appointment, recovery, and rebuilding periods.
- **Actions:** Open a cycle, view sourced instructions, add coordination milestones, and create tasks.
- **Private:** Treatment names, clinical notes, symptoms, and facility details stay within approved audiences.
- **Empty state:** “No treatment cycle has been added. Add one only from the patient's care plan.”
- **Accessibility:** A list alternative to the timeline, text labels for every phase, no color-only meaning, and no language that predicts recovery.

### Appointments

- **Primary users:** The active Care Recipient, an authorized representative, Akira, and role-limited helpers.
- **Displays:** Date, time, location, purpose, transportation, participants, source, and sharing level.
- **Actions:** Add, edit, assign transportation, prepare questions, and share a limited summary.
- **Private:** Clinical purpose, notes, and full location can be hidden from logistics-only roles.
- **Empty state:** “No appointments have been added.”
- **Accessibility:** Clear local time and time zone, calendar plus list view, large call and directions actions, and readable change history.

### Pre-Chemo Preparation

- **Primary users:** The active Care Recipient, an authorized representative, Akira, Martin, Sharae, and assigned helpers.
- **Displays:** Family logistics and a separate section for healthcare-team-provided instructions.
- **Actions:** Assign rides, meals, childcare, supplies, household preparation, and caregiver coverage.
- **Private:** Medical instructions and treatment details appear only to approved roles.
- **Empty state:** “No preparation plan has been added. Start with family logistics or add a sourced care-team instruction.”
- **Accessibility:** Checklist items use large checkboxes, plain ownership labels, and no default medical advice.

### Recovery Support

- **Primary users:** Melvina, DoMonique, Sharae, Martin, and assigned Backup Caregivers.
- **Displays:** Rest coverage, meals, household support, approved contacts, and sourced recovery instructions.
- **Actions:** Request help, assign coverage, record completion, and contact the healthcare team deliberately.
- **Private:** Symptoms and private caregiver entries remain outside the general recovery plan.
- **Empty state:** “No recovery support is planned. Add a practical task or a sourced instruction.”
- **Accessibility:** Low-reading-load cards, large contact buttons, clear handoffs, and no countdowns implying a required recovery pace.

### Diet and Hydration

- **Primary users:** Melvina, DoMonique, Sharae, and assigned meal helpers.
- **Displays:** Non-medical preferences, meal tasks, grocery requests, and clearly sourced healthcare-team instructions when provided.
- **Actions:** Request a meal or drink, list preferences, assign shopping, and mark a practical task complete.
- **Private:** Medical restrictions and intake details remain within their approved audience.
- **Empty state:** “No meal or drink support is requested.”
- **Accessibility:** Plain labels, large choices, no calorie-style dashboards, no intake scoring, and no assumptions that a food or amount is suitable.

### Gentle Movement

- **Primary users:** Melvina and approved support people.
- **Displays:** Patient preferences, companionship requests, and any sourced movement instruction from the healthcare team.
- **Actions:** Request company, schedule practical support, and mark a family task complete.
- **Private:** Medical reasons, measurements, and clinical restrictions stay private.
- **Empty state:** “No movement support is planned. Add something only if the patient wants it or the healthcare team has provided instructions.”
- **Accessibility:** No performance goals, streaks, pressure, or motion-heavy interface; provide text alternatives and reduced motion.

### Prayer and Meditation

- **Primary users:** Anyone in an audience chosen by the content author, relevant Care Recipient, and applicable Circle permissions.
- **Displays:** Optional family-written prayers, meditations, reflections, encouragement, and participation preferences.
- **Actions:** Read, contribute, respond, mute, or opt out.
- **Private:** Beliefs and private requests are not exposed to people outside the selected audience.
- **Empty state:** “This space is optional. Add a prayer, meditation, reflection, or encouragement if it fits your family.”
- **Accessibility:** Inclusive wording, no assumption of faith, screen-reader-friendly text, and no automatic sound.

### Emergency Contacts

- **Primary users:** Every authenticated adult, with contacts filtered by role.
- **Displays:** Local emergency services, healthcare-team urgent and after-hours contacts, and approved family contacts.
- **Actions:** Deliberately call or copy a number and open the written emergency plan.
- **Private:** Household access notes and detailed medical context remain restricted.
- **Empty state:** “Emergency contacts have not been added. An authorized person should add and verify them before using Kinward.”
- **Accessibility:** Persistent access, very large labeled buttons, confirmation of the number selected, and no reliance on icons alone.

### Circle Roles and Permissions

- **Primary users:** Care Recipients for their own grants, Circle Heads for assigned Circle administration, Designated Care Representatives for delegated scope, and other adults viewing their own role.
- **Displays:** Members, roles, temporary access windows, pending invitations, and recent access changes.
- **Actions:** Invite, approve, decline, remove, change a role, expire access, and preview permissions.
- **Care Management actions:** Choose a mode, create or modify delegation, review scope, revoke access, and inspect “acted by/on behalf of” audit history.
- **Private:** Members cannot browse another person's hidden records or private permission history.
- **Empty state:** “No other adults are in this Circle. Invite a trusted adult when you are ready.”
- **Accessibility:** Plain-language permission summaries, confirmation before sensitive changes, visible focus, and no hidden gesture actions.

### Circle Updates

- **Primary users:** Care Recipients, authorized representatives, Circle Heads within non-medical scope, and approved adult contributors; Extended Circle adults receive only approved updates.
- **Displays:** Official family-facing updates, author, audience, approval status, and time.
- **Actions:** Draft, review, preview audience, approve, publish, correct, and archive.
- **Private:** No medical or caregiver detail is copied into an update automatically.
- **Empty state:** “No Circle updates have been shared.”
- **Accessibility:** Clear draft versus published labels, readable audience names, undo or correction flow, and no color-only approval state.

### Settings and Privacy

- **Primary users:** Circle Heads for assigned Circle settings, Care Recipients for their information and Care Management Mode, Designated Care Representatives within scope, and each adult for personal settings.
- **Displays:** Circle and Care Recipient context, sharing defaults, delegation scopes, notification settings, verified email, active sessions, exports, deletion, Trusted Decision Contact, and Backup Circle Administrator settings.
- **Actions:** Change preferences, sign out sessions, request export or deletion, and review access history.
- **Private:** One member cannot view another adult's private notification destination or Caregiver Check-In.
- **Empty state:** Not applicable; safe defaults are preselected and explained.
- **Accessibility:** Grouped settings, plain consequences, large switches with text states, confirmation for major actions, and easy reversal where possible.

---

## 6. A Normal Day in Kinward

### Morning

At 7:30 a.m., Melvina opens Patient Today. She records a neutral Patient Check-In: she slept poorly, wants a quiet morning, and would like help with lunch. Kinward saves her words without rating or interpreting them. She shares the practical lunch request with Sharae but keeps the rest within her approved medical audience, including DoMonique through active delegation and Akira through his Medical Lead grant.

DoMonique opens Caregiver Today. He records that he has limited energy and would like a two-hour break after lunch. His private explanation stays hidden. Kinward creates a practical coverage request that says only: “Backup caregiver requested, 1:00–3:00 p.m.”

### Circle Today

T.J. sees two coordination items: lunch is unclaimed and a backup shift is open. She does not see Melvina's symptom entry or DoMonique's private note.

Sharae assigns the meal task to Carlos, who accepts. Dee accepts the backup shift. Their lock screens show only “You have a Kinward update.” They authenticate to see the task details.

### Midday

Carlos sees only the meal preference, pickup time, and delivery instruction. A family preference says that soup is welcome; it is labeled as a preference, not medical guidance. No calorie, fluid, or dietary target appears.

Melvina also requests that the drink she selected be placed within reach. Kinward treats this as a practical hydration-support task, not a recommendation or intake target.

Melvina chooses to record that she finished part of lunch and some of her selected drink. Kinward stores the note but does not praise, score, interpret, or judge the amount.

### Family Communication

T.J. drafts: “Quiet day at home. Lunch and afternoon coverage are handled. Please text T.J. instead of calling Melvina or DoMonique.” Melvina approves it for the adult Extended Circle.

For Mia, DoMonique shares an adult-mediated message: “Mom is having a quiet day. Dee will be here this afternoon.” Noah receives a slightly fuller adult-mediated update without symptoms or private caregiver details.

### Prayer or Meditation

Melvina has opted into a small family reflection audience. Barbie adds a short encouragement. No one is required to participate. DoMonique may submit an approved drawing or message through Mia's or Noah's managed profile, but the minors do not sign in or receive direct notifications.

### Evening Review

Dee marks the coverage shift complete and leaves a practical handoff note: “DoMonique is home. Kitchen task is done.” She does not make a medical assessment.

DoMonique sees that tomorrow's ride is assigned. Melvina reviews her own entry and chooses not to contact anyone. Kinward does not infer that the day was medically stable and does not claim that Akira reviewed the entry.

---

## 7. The First Chemotherapy Cycle

This fictional cycle demonstrates coordination only. Every medical instruction mentioned in the product is represented as coming from the fictional healthcare team. The workflow must not be reused as general preparation, pump, recovery, diet, hydration, or movement advice.

### Two Days Before Treatment

- **Akira, Medical Lead:** Confirms that the appointment record matches the healthcare team's written schedule and checks that source and date are visible.
- **Martin, Chemo Care Lead:** Opens the preparation plan and assigns transportation, household coverage, meal delivery, school pickup, and the next-day support shift.
- **Sharae, Care Lead:** Checks for missing practical coverage and posts claimable tasks without medical details.
- **Melvina, Care Recipient, and DoMonique, acting under delegation:** Review the audience for each item and approve the family update.
- **T.J., Family Coordinator:** Drafts “Wednesday is a treatment day; please route questions through T.J..”

### Evening Before Treatment

- **Melvina:** Reviews only the sourced instructions supplied by her healthcare team and her own preferences.
- **DoMonique:** Confirms household logistics and his caregiver plan.
- **Martin:** Confirms that the ride and return-home support are accepted.
- **Kinward:** Shows unfinished logistics separately from healthcare-team instructions. It does not generate a preparation checklist containing medical advice.

### Infusion Morning

- **DoMonique:** Starts the caregiving shift and confirms transportation.
- **Carlos:** Handles the school transportation task assigned to him.
- **Martin:** Monitors task completion, not Melvina's medical condition.
- **Melvina:** May record a check-in or skip it.
- **Kinward:** Displays the appointment and approved contact buttons. It does not determine whether Melvina is fit for treatment.

### During the Infusion Appointment

- **Melvina and DoMonique:** Attend the fictional appointment.
- **Akira:** Is assigned to organize questions and may record instructions Melvina or DoMonique provides from the healthcare team, including the source and whether the wording is copied or summarized.
- **T.J.:** Handles family communication so Melvina and DoMonique do not receive repeated calls.
- **Kinward:** Does not connect to clinicians, monitor the infusion, interpret information, or confirm that treatment occurred.

### Portable Pump Care, When Applicable

Not every treatment uses a portable pump. In this fictional scenario, the healthcare team has provided written pump contact and appointment instructions.

- **Akira:** Records the instructions exactly or clearly labels a summary, with source and date.
- **Martin:** Creates only the related logistics and pump-disconnection appointment tasks.
- **DoMonique and an approved Backup Caregiver:** Can view the relevant instructions during the coverage window.
- **Kinward:** Does not generate pump-care instructions, interpret a device signal, determine that the pump is working, or decide what a symptom means. A user must deliberately call the listed healthcare-team contact if they choose to seek help.

### Pump Disconnection

- **Martin:** Confirms the appointment and ride.
- **Dee:** Covers the household during the appointment.
- **Akira:** Updates the sourced record only if Melvina or DoMonique reports new healthcare-team instructions.
- **Kinward:** Treats disconnection as an appointment and coordination event, not a procedure it guides.

### Early Recovery Days

- **Melvina:** Records optional daily check-ins in her own words.
- **DoMonique:** Uses Caregiver Today and requests backup if needed.
- **Sharae:** Coordinates meals, household tasks, companionship, and respite.
- **Barbie and Dee:** Cover assigned shifts with only time-limited access.
- **Akira:** Can review Patient Check-In history if permitted, but Kinward never guarantees that he has done so.
- **Kinward:** Shows trends as dated entries without judging improvement, decline, safety, or urgency.

### Rebuilding Days

- **Melvina:** Chooses whether to request company for a gentle activity that she wants or that her healthcare team has addressed.
- **Sharae:** Coordinates companionship and household support.
- **DoMonique:** Reviews his own workload and schedules a break.
- **Kinward:** Does not set activity goals, predict recovery, or compare Melvina with other patients.

### Preparing for the Next Cycle

- **Martin:** Copies unfinished logistics into a new cycle only after review by Melvina or DoMonique within his delegated scope.
- **Akira:** Confirms that healthcare-team instructions are current and marks outdated instructions clearly rather than silently replacing them.
- **T.J.:** Reviews communication preferences.
- **Melvina and DoMonique:** Adjust privacy, support, and notification choices.
- **The family:** Reviews what coordination worked. They do not use Kinward to decide whether treatment should continue or change.

---

## 8. Daily Care Check and Symptoms Section

Daily Care Check contains separate Patient and Caregiver Check-Ins. Symptoms are a section inside the Patient Check-In, not a separate competing feature.

### Patient Check-In Content

The Patient Check-In may record overall condition, temperature, symptoms, food and hydration, medications, rest and movement, port or pump concerns, and support needs. Kinward stores what the person reports and does not interpret a temperature, medication entry, symptom, or device concern.

### Who May Complete the Patient Check-In

- Melvina may complete her own entry.
- DoMonique, Akira, or an approved Backup Caregiver may enter information on Melvina's behalf only when permitted.
- The entry must show who typed it and that it was entered on Melvina's behalf.
- Extended Circle members, Mia, and Noah cannot submit or view symptom entries under the MVP default.

### Neutral Patient Questions

The Patient Check-In may ask:

1. “What would you like to record today?”
2. “When did you first notice this?”
3. “Has it changed since your last entry?” with the patient's own words, not a Kinward judgment.
4. “How is this affecting today's plans or support needs?”
5. “Would you like to add a private note?”
6. “Would you like to create a practical family task?”
7. “Would you like to record temperature, food or hydration, medications, rest or movement, or a port or pump concern?”
8. “Would you like to open your healthcare-team or emergency contacts?”

The final screen states that Kinward is not continuously monitored and saving does not alert a clinician or guarantee a family response.

### Follow-Up Questions

Follow-up prompts clarify the patient's report rather than interpret it. For example:

- “What words would you use to describe it?”
- “Would you like to record when it started?”
- “Is there a practical task that would help today?”
- “Do you want to contact someone now?”

Kinward must not label the answer mild, moderate, severe, normal, expected, safe, or dangerous on its own authority.

### Recording and Trends

Each entry stores the reporter, author, time, audience, and any linked healthcare-team instruction. The trend view shows dated patient-reported entries in a list or neutral timeline. It does not use red/green judgments, clinical scores, predicted outcomes, or automated conclusions.

### Turning an Entry Into a Task or Concern

Melvina may deliberately choose “Create a practical task” and share only the minimum information, such as “Please cover school pickup.” The symptom text remains private.

Melvina may choose “I want someone to know,” which sends a non-urgent, generic update to an approved adult. The product must clearly say that this is a coordination notification, not medical monitoring, and does not guarantee review.

For medical concern, Kinward opens the family's sourced healthcare-team instructions and contact choices. It does not choose the contact, rank urgency, or create an emergency threshold.

### Healthcare-Team Instructions

An instruction card shows its source, date received, recorder, copied-or-summarized status, audience, and last update. Family notes appear separately. Conflicting or outdated instruction behavior remains an open decision in Section 18.

Kinward does not diagnose, choose treatment, change medication, recommend food or fluids, create activity plans, or create its own emergency thresholds.

### Caregiver Check-In

DoMonique may record energy, stress, physical capacity, rest, workload, tasks requiring coverage, and whether backup is needed. His record is separate from Melvina's Patient Check-In even when Circle Today shows both as separate summaries.

DoMonique chooses whether to share the full entry, a limited status, a practical request for help, or nothing. Kinward may create “The caregiver needs backup” only when that matches DoMonique's selection. It does not reveal the private reason.

---

## 9. Patient Today and Caregiver Today

### Stable Coordination Day

Melvina sees no appointment and records only that she wants a quiet afternoon. DoMonique sees that Dee has accepted a planned break. Kinward presents this as a coordinated day, not a medically “stable” day.

### Difficult Treatment Day

Melvina records several changes in her own words. Kinward stores them without scoring or interpretation and offers contact buttons. DoMonique sees an approved practical need. Akira sees the private entry within scope. The wider family receives only: “No visits today; household support is covered.”

### Caregiver Needs Backup

DoMonique records a private note and taps “I need backup.” Sharae sees only the requested window and type of help. Barbie accepts the shift. DoMonique's private explanation stays hidden.

### Private Clinical Entry

Akira records a healthcare-team instruction with source and date. It is visible only to Melvina and adults with an explicit, current grant for her information. It cannot be copied into Circle Updates automatically.

### Approved Family-Safe Update

T.J. drafts: “The family is resting after a long clinic day. Dinner is covered; please hold calls.” Melvina or DoMonique previews the audience and approves it. No diagnosis, symptom, medication, facility, or caregiver detail appears.

---

## 10. Family Task System

### How a Need Becomes an Assignment

1. An authorized person creates a practical need.
2. The creator chooses a task type, due window, minimum instructions, and allowed audience.
3. Kinward previews who will see it.
4. The task is directly assigned or posted for approved members to claim.
5. The recipient accepts, declines, or requests clarification.
6. A backup person may be named.
7. Completion and handoff are recorded without unnecessary private details.

### Supported Task Examples

- **Transportation:** Carlos receives pickup time and location, not the full clinical purpose.
- **Meals:** Sharae shares food preferences and delivery instructions, not medical diagnoses.
- **Pharmacy pickup:** The assignee receives only the information required by the approved pickup process; medication details are not broadly exposed.
- **Appointment note-taking:** Akira receives the appointment and question list within his medical scope.
- **Caregiver shifts:** Dee receives the time window, household needs, contacts, and approved instructions.
- **Household chores:** Barbie sees the chore and access instructions needed for the task.
- **Companionship:** Melvina's visit and conversation preferences are shown.
- **Respite care:** DoMonique requests relief without sharing his private check-in.

### Unassigned, Declined, and Overdue Tasks

The Circle-wide Family Coordinator receives unassigned, declined, or overdue Shared Household tasks in the shared-task queue. If no active Family Coordinator exists, the task shows “No routing lead assigned,” allowing a Circle Head to assign a Family Coordinator or directly assign the non-sensitive task. Kinward uses neutral language such as “Needs coverage” rather than blame. The system may remind approved members but must not expose medical context in the notification.

### Backup Coverage

If Carlos declines a ride, the task moves to the approved backup list. It does not silently assign another person. The Care Recipient, authorized representative, or responsible lead confirms access within scope. Time-limited details disappear from the active view after the coverage period, subject to retention and cached-data rules.

---

## 11. Communication System

### Official Circle Updates

Official updates are deliberately written for a selected audience and previewed. Content about a Care Recipient requires that person's approval or a representative with the update-approval scope. General non-medical Circle content may be approved by an authorized Circle Head.

### Private Core-Team Notes

Core notes support coordination among approved roles. A medical note, caregiver note, and practical task note remain separate and keep separate audiences.

### Encouragement Messages

Approved members may send short encouragement without requiring a response from Melvina or DoMonique. The content owner or an authorized Circle Head can pause or mute replies within scope.

### Prayer Requests

Prayer, meditation, reflection, and spiritual requests are optional. The author, relevant Care Recipient, and applicable Circle permissions control the audience. An authorized adult may submit a minor's supervised contribution through a managed profile.

### Visit and Call Preferences

The family can publish preferences such as “No calls before noon,” “Text T.J. with questions,” or “Visits by invitation only.” These preferences reduce interruptions without revealing why.

### Reducing Repeated Calls

T.J. posts one approved update and becomes the communication contact. Extended Circle members are directed to Circle Updates instead of repeatedly contacting Melvina and DoMonique.

### Preventing Conflicting Information

- Official updates are labeled separately from comments.
- Only approved roles can draft official updates.
- The relevant Care Recipient, authorized representative, or Circle Head approves the final audience and wording within their scope.
- Corrections remain visible.
- Medical instructions show their healthcare source.
- Family members cannot turn a comment into a healthcare-team instruction.

---

## 12. Diet, Hydration, Movement, and Emotional Support

### Diet and Hydration

Kinward coordinates grocery requests, meal delivery, drink requests, and household help. Melvina may list a personal preference such as “small portions are easier today,” clearly labeled as her preference. A dietary or fluid instruction appears only if the healthcare team supplied it and its source is shown.

Kinward does not set intake targets, count progress toward a medical goal, recommend foods or supplements, or claim that a meal or drink treats cancer or treatment effects.

### Gentle Movement

Melvina may ask for company during an activity she chooses or that her healthcare team has discussed. The app coordinates the companion and time. It does not generate an exercise plan, set goals, judge safety, or pressure Melvina with streaks.

### Emotional Support

Melvina and DoMonique can state communication, companionship, quiet-time, encouragement, prayer, or meditation preferences. Kinward does not provide psychotherapy, assess mental-health risk, or replace professional support. Any future crisis-support behavior requires professional review and region-appropriate design.

---

## 13. Notifications

All lock-screen, email-subject, and SMS notifications use generic language by default. Private details appear only after authentication.

| Notification | Recipient | When | Lock-screen or SMS text | Private information excluded |
| --- | --- | --- | --- | --- |
| Invitation | Invited adult | Invitation sent | “You have a Kinward invitation.” | Patient name, illness, role details |
| Invitation accepted | Authorized Circle Head | Adult accepts | “A Kinward invitation was accepted.” | Medical access details |
| Sensitive role approval | Care Recipient or authorized representative | Second approval needed | “A Kinward access change needs review.” | Role scope and medical categories |
| Daily patient reminder | Melvina, if opted in | Chosen daily time | “Your Kinward check-in is available.” | Symptoms and appointments |
| Daily caregiver reminder | DoMonique, if opted in | Chosen daily time | “Your Kinward check-in is available.” | Caregiver state and workload |
| Check-in recorded | Approved adult, if enabled | Entry saved | “A Kinward update is available.” | Symptoms, author, urgency claims |
| Task assigned | Assignee | Assignment made | “You have a new Kinward task.” | Task type, address, medical context |
| Task due | Assignee | Chosen reminder time | “A Kinward task needs attention.” | Due details and household information |
| Shared Household task unassigned, declined, or overdue | Circle-wide Family Coordinator, or Circle Head for the missing-lead state | Status changes | “A Kinward task needs review.” | Person's reason and private context |
| Backup requested | Approved caregivers | Request published | “A Kinward coverage request is available.” | Caregiver note and patient condition |
| Appointment reminder | Approved attendee | Chosen time | “You have a Kinward schedule reminder.” | Facility, specialty, treatment type |
| Circle update | Selected audience | Authorized person publishes | “A new Kinward Circle update is available.” | Update content and family circumstances |
| Prayer or reflection | Selected audience, opt-in | Content shared | “A Kinward reflection is available.” | Belief, prayer text, patient condition |
| Access expiring or review due | Temporary role holder and authorized owner | Before expiration or at the 90-day no-expiration review | “Kinward access is scheduled for review.” | Sensitive scope |
| Security change | Account owner | Contact or session changes | “Your Kinward account settings changed.” | Phone number or email details |

Notifications must never claim that a clinician, family member, or emergency service has reviewed an entry. Delivery delays and failures must be explained. SMS remains optional, requires a verified number and consent, and is not an emergency channel.

---

## 14. Emergency Experience

An “Emergency contacts” action remains easy to find from Patient Today, Daily Care Check, Recovery Support, and the main navigation.

When opened, the screen says in plain language:

- Kinward is not an emergency service.
- Follow the patient's written healthcare-team instructions for urgent concerns.
- If the user believes there is an immediate or life-threatening emergency, contact local emergency services now.
- Kinward does not determine whether the situation is an emergency.

The screen then presents large, labeled choices:

1. Local emergency services for the supported region.
2. Healthcare-team urgent contact.
3. Healthcare-team after-hours contact.
4. DoMonique, primary family contact.
5. Dee, nearby backup contact.
6. Open the written emergency plan.

The user deliberately chooses a contact. Kinward must not call automatically, infer urgency from a symptom entry, or promise that a call or message was received. Contacts must show when they were last verified.

If contacts are missing, Kinward says so plainly and directs a person with emergency-contact permission to add them. It must not fill the gap with invented medical instructions or an assumed global emergency number.

---

## 15. What Kinward Does Not Do

### Medical Boundaries

Kinward does not:

- Diagnose or suggest a diagnosis.
- Interpret symptoms, measurements, images, tests, devices, or changes in condition.
- Label a symptom safe, dangerous, normal, expected, mild, moderate, or severe on its own authority.
- Choose, recommend, start, stop, delay, or change treatment.
- Recommend or calculate medication, dosage, food, fluids, supplements, movement, or clinical procedures.
- Create generic symptom or emergency thresholds.
- Generate a preparation, pump-care, recovery, diet, hydration, or movement plan as medical guidance.
- Replace the healthcare team, patient portal, phone call, visit, or emergency service.

### Monitoring and Communication Boundaries

Kinward does not:

- Continuously monitor a patient or caregiver.
- Guarantee that a saved entry has been seen.
- Automatically alert a clinician in the MVP.
- Guarantee that push, email, or SMS delivery succeeds.
- Treat a family coordination notification as a medical alert.

### Legal and Authority Boundaries

Kinward does not:

- Create healthcare power of attorney, guardianship, or legal decision-making authority.
- Decide that a patient lacks decision-making ability.
- Resolve family disputes about legal authority.
- Provide legal advice.
- Claim HIPAA compliance without documented legal, privacy, security, contractual, and operational review.

### Privacy Boundaries

Kinward does not:

- Give Extended Circle members detailed medical information.
- Automatically turn adult medical content into a child summary.
- Make private information safe after someone has exported, photographed, or copied it.
- Use real patient or family information in development, testing, demonstrations, screenshots, documentation examples, or sample data.
- Send sensitive content to a lock screen or SMS.

---

## 16. MVP Versus Future Versions

### Build First

- Multiple private Family Circles per user and multiple Care Recipients per Circle.
- Adult invitations, Care Recipient ownership, Circle Heads, coordination roles, and primary caregiver designation.
- Self-Managed, Shared Management, and Delegated Management with scoped audit history.
- Multiple Circles, multiple Care Recipients, visible switching, and strict context separation.
- Managed minor profiles with authorized-adult participation and no independent sign-in.
- Circle Today, Patient Today, and Caregiver Today.
- Daily Care Check with separate Patient and Caregiver Check-Ins and no medical interpretation.
- Caregiver well-being check and practical backup request.
- Family tasks with assignment, decline, reassignment, and backup.
- Separate Treatment Journey and Appointments views inside Schedule.
- Pre-treatment and recovery logistics using sourced instructions only.
- Diet, hydration, and movement coordination without medical recommendations.
- Optional prayer, meditation, reflection, and encouragement.
- Emergency and healthcare-team contacts.
- Permission-filtered Circle updates.
- Generic, privacy-safe notifications.
- Audit history for sensitive access and instruction changes.

### Postpone

- Independent child or teen accounts.
- Direct clinician accounts and healthcare-system integration.
- Automated child summaries.
- Public social networking and fundraising.
- Medication management and clinical measurement tools.
- Broad third-party analytics involving sensitive information.
- Automated import of healthcare instructions until sourcing and correction rules are defined.

### Do Not Build Without Professional Review

- Symptom scoring, triage, thresholds, risk predictions, or clinical decision support.
- Automatic medical alerts or any promise of clinician response.
- Medication dosing, interactions, conversions, or recommendations.
- Pump monitoring or device interpretation.
- Nutrition, hydration, supplement, or exercise recommendations.
- Mental-health crisis assessment.
- Independent minor accounts or automated child-facing medical content.
- Claims about HIPAA or other legal or regulatory compliance.
- Features that transfer account authority based on incapacity, death, guardianship, or family status.

---

## 17. Test Scenarios

All scenarios use the synthetic Vale family. No real information may be substituted.

| # | Starting situation | Family member taking action | Expected app behavior | Expected privacy behavior | Pass/fail criteria |
| --- | --- | --- | --- | --- | --- |
| 1 | T.J. is invited as Family Coordinator. | T.J. opens an expired invitation. | Kinward refuses access and offers a safe way to request a new invitation. | No Circle or patient information appears. | Pass if expired links reveal nothing and cannot be reused. |
| 2 | Akira is invited as Medical Lead for Melvina. | Akira verifies the invited email and accepts. | Kinward explains his Care-Recipient-specific scope; Melvina or her authorized representative must confirm it. | Melvina's records remain hidden until approval, and another Care Recipient's records remain hidden afterward. | Pass if accepting alone reveals nothing and the grant stays Care-Recipient-specific. |
| 3 | An invitation is forwarded accidentally. | An unintended recipient opens it. | Verification fails because the recipient does not control the invited destination. | No names, illness details, tasks, or roles are exposed beyond generic invitation text. | Pass if no account or Circle access is granted. |
| 4 | T.J. opens Circle Today. | T.J. checks today's family plan. | She sees open tasks and an approved update. | Melvina's symptom entry and DoMonique's caregiver note are absent from feed, search, and notifications. | Pass if coordination works without medical disclosure. |
| 5 | Akira needs an older symptom entry after receiving his role. | Akira searches history. | Older entries stay hidden until Melvina or an authorized representative deliberately shares one. | Role assignment does not silently reveal past records. | Pass if prospective access is enforced. |
| 6 | Melvina records a new symptom. | Melvina completes the Symptoms section of her Patient Check-In. | Kinward saves her words and offers task and contact choices. | No score, urgency label, automatic medical alert, or Extended Circle exposure occurs. | Pass if the entry remains neutral and within its audience. |
| 7 | DoMonique enters a symptom on Melvina's behalf. | DoMonique records what Melvina reports. | The entry is labeled “entered by DoMonique on Melvina's behalf.” | The author and approved audience are visible; no broader sharing occurs. | Pass if provenance cannot be mistaken. |
| 8 | Melvina wants help after a private entry. | Melvina creates a school-pickup task. | The task contains timing and pickup need only. | The linked symptom text remains hidden from the assignee. | Pass if a task can be shared without its private cause. |
| 9 | DoMonique is exhausted and wants relief. | DoMonique records a private caregiver check and requests backup. | Kinward posts a coverage window to approved caregivers. | The private explanation stays hidden from Melvina, T.J., and caregivers unless DoMonique shares it. | Pass if the practical request works independently of the private note. |
| 10 | Dee accepts a two-hour backup shift. | Dee opens the shift. | She sees household instructions, contacts, and only approved care details for the window. | Unrelated medical history and caregiver entries remain hidden; access expires afterward. | Pass if time and field limits hold before, during, and after coverage. |
| 11 | A chemotherapy appointment is approaching. | Martin opens Pre-Chemo Preparation. | He assigns rides, school pickup, meals, and household coverage. | He sees only approved treatment-window information and cannot create medical instructions. | Pass if all logistics work without unsourced clinical advice. |
| 12 | The fictional treatment uses a portable pump. | Akira records a care-team instruction; Martin adds the disconnection ride. | Source, date, recorder, and appointment appear clearly. | Extended Circle members see no pump or treatment detail. | Pass if Kinward coordinates but never interprets the device or invents instructions. |
| 13 | Carlos declines a pharmacy pickup. | Carlos taps “Decline”; Sharae reviews the task. | The task returns to “Needs coverage” and the approved backup list. | Carlos's reason remains private unless he shares it; medication details remain limited. | Pass if no silent reassignment or medical exposure occurs. |
| 14 | Mia needs to know who handles school pickup. | DoMonique opens Mia's managed profile and reads an approved child summary. | Kinward provides a separately authored summary and no child login. | No adult medical, emergency, document, or caregiver details appear. | Pass if Mia receives useful logistics without restricted records or direct alerts. |
| 15 | Noah asks for more detail about treatment day. | T.J. drafts a teen-appropriate summary; DoMonique reviews it within scope. | An authorized adult edits and approves the specific wording for Noah's managed profile. | Adult records are not automatically summarized or exposed. | Pass if the summary is deliberately authored and no direct sign-in exists. |
| 16 | T.J. drafts a Circle update from a long clinic day. | Melvina previews the audience and publishes. | The update is labeled official, approved, and time-stamped. | No private medical content is copied automatically; Extended Circle sees only approved wording. | Pass if preview exactly matches the recipient view. |
| 17 | A task notification reaches a locked phone. | Barbie views the notification. | It says only “You have a new Kinward task.” | Address, patient name, treatment, and task details remain hidden. | Pass if sensitive content appears only after authentication. |
| 18 | A future external-notification design is reviewed outside Milestone One. | A reviewer examines generic SMS copy. | The scenario remains deferred; Milestone One sends no SMS login, invitation, recovery, or delegation-review reminder. | No implementation or real recipient exists. | Pass if this historical notification concept is clearly excluded from Milestone One and cannot be mistaken for an approved channel. |
| 19 | Melvina believes urgent help may be needed. | Melvina opens Emergency Contacts. | Kinward shows written care-team contacts, local emergency services, and family contacts with large buttons. | It does not diagnose, select a contact, or notify Extended Circle. | Pass if action is deliberate and system limits are prominent. |
| 20 | The healthcare team's instruction changes. | Akira edits the sourced instruction. | Kinward preserves source, date, prior version, editor, and new time. | Only the approved medical audience sees the instruction and history. | Pass if old wording is not silently erased or shown as current. |
| 21 | Melvina removes Martin after a treatment cycle. | Melvina revokes the Chemo Care Lead grant. | Active access and sessions are revoked and an audit entry is created. | Future and unshared records are unavailable; the app does not claim it can recall prior screenshots or exports. | Pass if active access ends immediately and limitations are honest. |
| 22 | Melvina requests a meal. | Sharae creates a meal task using Melvina's preference. | The task coordinates food and delivery without targets or health claims. | Medical dietary instructions remain separate and sourced. | Pass if no food, fluid, supplement, or cure recommendation is generated. |
| 23 | Melvina chooses Delegated Management. | Melvina grants DoMonique all Kinward management permissions. | Kinward records grantor, recipient, scopes, start date, optional expiration, lifecycle status, and consent; DoMonique accepts. | DoMonique sees nothing before activation and gains no legal-authority label. | Pass if every scope is explicit, the access-review rule is preserved, and Melvina retains access. |
| 24 | DoMonique completes Melvina's Patient Check-In under delegation. | DoMonique records Melvina's reported information. | The entry says DoMonique acted on behalf of Melvina and links to the active grant. | DoMonique's own Caregiver Check-In remains a separate record and audience. | Pass if actor, subject, and permission source remain distinct. |
| 25 | Melvina revokes DoMonique's delegation but keeps him as spouse and Circle Head. | Melvina revokes the grant. | Delegated sessions and medical access end while approved non-medical Circle administration remains. | Marriage and Circle Head status do not preserve medical access. | Pass if role and delegation are independently enforced. |
| 26 | A user belongs to the Vale Circle and a second fictional Circle. | The user switches Circles and Care Recipients. | The header, Today view, search, drafts, and tasks reset to the selected context. | No names, notifications, records, or cached results cross contexts. | Pass if strict separation holds throughout the product. |
| 27 | Mia sends Melvina a drawing. | DoMonique submits the drawing through Mia's managed profile. | The contribution is attributed to Mia and submitted by DoMonique for an approved audience. | Mia never signs in or receives medical or emergency content. | Pass if supervised participation works without an independent minor account. |
| 28 | A second synthetic Care Recipient joins the Vale Circle. | T.J. switches between the two Care Recipients while reviewing tasks. | The header, permissions, Today summaries, and records change to the selected Care Recipient; shared household tasks remain clearly labeled. | Melvina's medical information never appears in the other person's context and vice versa. | Pass if Care Recipient isolation holds within the same Circle. |
| 29 | The Vale Circle has Melvina plus a second synthetic adult Care Recipient. | T.J. opens Circle Today with permission to see only the second Care Recipient's Patient Today summary. | Only the second Care Recipient's Patient Today summary card appears. | Melvina's card and underlying records remain absent from feed, search, cached state, and direct access. | Pass if one Care Recipient's summary permission never grants another's summary. |
| 30 | A synthetic family labels two Care Recipients “Dad” and “Mom.” | A viewer has Patient Today summary permission for Dad but not Mom. | Dad's permitted summary appears and Mom's summary does not. | No Mom summary field, count, placeholder, or medical clue is returned to the viewer. | Pass if the authorization result is independently evaluated for each Care Recipient. |
| 31 | DoMonique records a private Caregiver Check-In and shares no summary. | Melvina and T.J. open Circle Today. | No Caregiver Today summary card appears for either viewer. | DoMonique's private entry and the existence of its contents remain hidden. | Pass if caregiver-author sharing controls the card independently of patient and Circle roles. |
| 32 | An Extended Circle adult opens Circle Today. | The adult reviews the day. | Neither Patient Today nor Caregiver Today summary card appears. | No summary content or sensitive empty-state clue is exposed. | Pass if Extended Circle exclusion is the default. |
| 33 | Melvina approves a family-safe Circle Update. | An Extended Circle adult opens the update. | The manually authored and approved Circle Update appears. | No Patient Today or Caregiver Today summary is copied or exposed. | Pass if safe updates work without granting summary access. |
| 34 | A non-sensitive Shared Household task is created with no assignee and no active Circle-wide Family Coordinator. | A Circle Head opens the task board. | The task shows “No routing lead assigned,” and the Circle Head may assign a Family Coordinator or directly assign the task. | No Care Recipient context or sensitive details appear, and no hidden administrator access is created. | Pass if routing uses only canonical roles and the exact missing-lead state. |
| 35 | Melvina chooses “Until revoked” for DoMonique's delegation. | The delegation reaches each 90-day review point without an expiration. | Kinward creates the recurring access-review reminder while leaving the delegation in its existing lifecycle state until an authorized action changes it. | No relationship-based exception suppresses the reminder or revocation controls. | Pass if optional expiration, recurring review reminders, and lifecycle permissions remain distinct. |
| 36 | T.J. is designated dormant Backup Circle Administrator. | T.J. claims that the Circle Heads are unavailable and tries to activate. | Kinward denies self-activation. Milestone One requires authorized Circle Head approval, a fresh provider-supported challenge, a recorded reason, and an audit entry; without an approver it shows the neutral unavailable state. | Dormant status reveals no new Circle or Care Recipient information. | Pass if no alternate recovery branch or self-activation exists and all allowed lifecycle actions remain auditable. |
| 37 | A non-sensitive Shared Household task is declined and another becomes overdue. | T.J. opens the Family Coordinator shared-task queue. | Both tasks appear in the queue. If T.J.'s Family Coordinator role is inactive, both show “No routing lead assigned” to Circle Heads. | Neither task contains or reveals person-specific sensitive content. | Pass if unassigned, declined, and overdue routing all use the same canonical role and fallback state. |
| 38 | Melvina creates a Milestone One account. | Melvina uses her verified email. | Kinward completes signup and verification through email only. | Phone and SMS are not offered as identity, login, recovery, or invitation-binding channels. | Pass if verified email is the only accepted Milestone One identity channel. |
| 39 | Melvina proposes fictional adult Rowan Vale as another Care Recipient. | Melvina submits Rowan's verified email. | Kinward creates an inactive pending Care Recipient and a dedicated ownership invitation with separate acceptance and consent history. | No private Care Recipient information can be entered or viewed before Rowan accepts. | Pass if pending status and private-data prohibition are enforced. |
| 40 | Rowan accepts the dedicated ownership invitation. | Rowan verifies the invited email and reviews the consequences. | Acceptance makes Rowan sole owner, activates the Care Recipient, records consent, and establishes Circle membership. | No second ordinary Circle invitation is required and no access reaches Melvina's records. | Pass if ownership and membership activate atomically within separate scopes. |
| 41 | T.J. returns to a trusted device. | T.J. opens authorized Circle information and performs routine coordination. | Kinward keeps T.J. signed in and does not require repeated authentication. | Only already authorized information appears. | Pass if routine access works without weakening permissions. |
| 42 | T.J. authenticated 14 minutes ago and assigns a permitted role. | T.J. confirms the consequential action. | Kinward accepts the recent-authentication evidence. | The write is authorized and audited. | Pass if the 15-minute window is enforced precisely. |
| 43 | T.J. authenticated more than 15 minutes ago and changes a grant. | T.J. submits the change. | Kinward requires provider-supported reauthentication before proceeding. | No authority change occurs before successful reauthentication. | Pass if stale authentication cannot authorize the write. |
| 44 | A Circle Head approves dormant backup activation. | T.J. begins activation. | Kinward requires a fresh provider-supported challenge every time, plus reason and audit evidence. | Routine session age alone is insufficient and biometrics are not mandatory. | Pass if fresh strong reauthentication is enforced. |
| 45 | No authorized Circle Head is available. | T.J. asks to activate as backup. | Kinward shows a neutral message that recovery activation is unavailable and requires a separately approved process. | T.J. gains no backup permissions and Kinward makes no incapacity or succession decision. | Pass if no recovery branch or self-activation exists. |
| 46 | Melvina is the last active Circle Head. | Melvina tries to leave, remove her role, be removed, or be downgraded. | Kinward blocks the action and explains that another verified adult must accept Circle Head first. | Backup status does not create automatic succession. | Pass if all four paths preserve at least one accepted active Circle Head. |
| 47 | A member attempts a prohibited role or grant change. | The member submits a consequential authority write. | Kinward denies the write and creates a family-visible denied-action audit event. | The event identifies the authority attempt without copying private record content. | Pass if the denial is visible in family audit with safe detail. |
| 48 | A member requests a Care Recipient record they cannot view. | The member attempts a routine read. | Kinward denies access without adding a family-visible audit item. | Where appropriate, a privacy-safe security event records no private content or unauthorized sensitive identifier. | Pass if family audit and security channels remain separate. |
| 49 | An “Until revoked” delegation reaches 90 days. | Melvina opens My Kinward and the relevant permission views. | “Access review due” appears in My Kinward, the Care Recipient permission summary, and delegation detail until reviewed. | No email, SMS, or push reminder is sent. | Pass if all three in-app placements persist. |
| 50 | Melvina reviews the due delegation. | Melvina chooses continue, modify, suspend, or revoke. | Kinward records reviewer, result, last review, next review where applicable, and audit history; the due item clears and a continued grant resets to 90 days. | No relationship-based exception changes the result. | Pass if the reminder clears only after an authorized review decision. |
| 51 | A developer attempts to enter real information locally. | The developer uses a local development environment. | Policy and environment controls prohibit the entry and require fictional or synthetic information. | No real data is stored, logged, or copied. | Pass if local development remains synthetic-only. |
| 52 | An approved tester uses the hosted preview on a phone. | The tester tries to use actual care information. | The clearly test-labeled preview prohibits actual care and real health information. | Preview data paths and credentials remain synthetic and isolated. | Pass if real information cannot be accepted as approved test content. |
| 53 | Pilot preparation begins. | A reviewer compares preview and pilot architecture. | The future “Restricted real-care family pilot” has separate configuration, credentials, database, storage, logs, and access controls. | No data path copies pilot information to preview or local development. | Pass if environment isolation is documented and testable. |
| 54 | Someone proposes entering real family information before Gate C. | The product team opens the beta readiness gate. | Kinward planning blocks entry because Gate C and signed beta readiness are incomplete. | No real patient, family, treatment, scan, report, or health information is entered. | Pass if the pilot remains unauthorized. |
| 55 | A participant tries to upload a real scan or report. | The participant opens the non-medical Milestone One shell. | No document-upload feature exists; the action remains unavailable until separate secure-document readiness is approved. | No file, metadata, preview, URL, or log content is stored. | Pass if document sharing stays outside Milestone One. |
| 56 | First-family compatibility is assessed before the restricted pilot. | Testers use both Care Recipients' iPhones, the nurse tester's Android, and one desktop keyboard setup. | Every D-13 browser, screen-reader, scaling, focus, form, error, orientation, and touch-target check runs; exact versions are recorded. | Test records use no real health content before Gate C. | Pass if both iPhone and Android work before pilot readiness. |
| 57 | The Shared Household queue has no Family Coordinator. | A Circle Head opens the task board after all D-8 through D-17 scenarios. | The exact state remains “No routing lead assigned.” | The operational-decision update creates no new role or sensitive Shared Household access. | Pass if the previously approved state is unchanged. |

---

## 18. Approved Resolutions and Remaining Product Decisions

### Six Resolved Tensions

1. **Minor participation:** Managed Extended Circle profiles, no independent sign-in, authorized-adult control, supervised contributions, and no restricted or alert content.
2. **Caregiver privacy:** Each adult owns their private well-being entries and chooses whether to share a full entry, limited status, request for help, or nothing.
3. **Patient, spouse, and authority:** Each Care Recipient owns their information; Circle Head and spouse status grant no medical access; legal authority remains separate and disputed consent defaults to privacy.
4. **Daily Care Check:** The umbrella contains separate Patient and Caregiver Check-Ins; Symptoms are a section inside the Patient Check-In.
5. **Navigation:** Today, Care, Schedule, Tasks, and Circle are the primary sections; Treatment Journey and Appointments are separate, while Diet and hydration and Gentle movement live inside Care.
6. **Care Management Mode:** Every adult Care Recipient chooses Self-Managed, Shared Management, or Delegated Management with explicit, scoped, revocable, audited permissions.

### Additional Approved Decisions

- Delegation expiration is optional with a recommended 90-day prefill, a deliberate “Until revoked” choice, four lifecycle states, and a recurring 90-day review reminder when no expiration is set (`D-1`).
- Each adult Care Recipient is the sole owner of their record; Self-Managed permits non-management roles without private-information management access (`D-2`).
- Shared Household tasks are non-sensitive and route through the Circle-wide Family Coordinator queue when unassigned, declined, or overdue, with “No routing lead assigned” when none is active (`D-3`, `D-7`).
- Backup Circle Administrator is a distinct dormant contingency role with controlled, audited activation (`D-4`).
- Patient and Caregiver summary visibility follows owner-specific permissions and excludes Extended Circle by default (`D-5`).
- Professional review uses named staged gates; unassigned reviewer functions are not approvals (`D-6`).
- OQ-01 through OQ-10 are resolved by verified-email identity, dedicated adult ownership acceptance, approved reauthentication, no Milestone One alternate backup recovery, synthetic audit retention, the actual-device accessibility matrix, last-Circle-Head continuity, separate denial-log channels, in-app delegation review, and isolated environments (`D-8` through `D-17`).

### Remaining Decisions

“Before coding” means before implementing the affected data, permission, identity, notification, or legal-review behavior.

| # | Decision in plain language | Safe planning position | Tradeoff | Resolve before coding? |
| --- | --- | --- | --- | --- |
| 1 | Who makes final product and safety decisions? | The founder representing First & 8th is product owner. Complete privacy/permission review, accessibility baseline approval, and synthetic-data confirmation before milestone-one coding; use later qualified-review gates from D-6. | Staged review avoids blocking non-medical foundations while preserving later safety gates. | **Product owner decided; milestone-one reviews still required.** |
| 2 | What legal documents and evidence will First & 8th accept? | Define the intake and verification process per launch region; Kinward records review status but never declares validity. | Safer but operationally demanding. | **Yes.** |
| 3 | What happens when people present competing authority or the Care Recipient cannot revoke access? | Freeze disputed access at the more private state and route it to documented human and legal review. | Protects privacy but may delay needed coordination. | **Yes.** |
| 4 | How are separation, death, guardianship, and succession requests handled? | Remove future access when authorized, preserve history, and require identity checks plus applicable documentation for transfer. | Preserves accountability but needs regional procedures and appeals. | **Yes.** |
| 5 | Who controls a managed minor profile? | Require a defined authorized adult, consent record, contribution rules, and transition policy. | Protects minors but adds family-authority complexity. | **Yes.** |
| 6 | Are legal documents stored or is only their existence recorded? | Prefer minimal metadata unless legal and security review requires document storage. | Minimizes exposure but may make verification slower. | **Yes**, before legal-role features. |
| 7 | How does an alternate backup or representative recovery work when no Circle Head can approve? | D-11 makes that branch unavailable in Milestone One; define it only through future qualified authority review. | Safer but may delay recovery. | **Before any alternate recovery branch, not before the approved Milestone One path.** |
| 8 | How are Shared Household tasks routed and protected? | Use non-sensitive Shared Household content only, route unassigned, declined, or overdue tasks to the Circle-wide Family Coordinator queue, and show “No routing lead assigned” if none is active. | Sensitive mixed-owner tasks require separate Care Recipient-specific tasks. | **Decided by D-3 and D-7; not a milestone-one task feature.** |
| 9 | What exact Patient Check-In questions and units are used? | Use neutral recording fields and no interpretation, scoring, thresholds, unit conversion, or medication guidance. | Less clinical structure but lower safety risk. | **Before check-in development and medical-safety review, not before milestone one.** |
| 10 | What urgent, emergency, and notification language is used, and where does the MVP launch? | Select one launch region, use local emergency information, generic notifications, and no guaranteed response. | Limits reach but makes behavior testable. | **Yes.** |
| 11 | What browsers, devices, and assistive technologies define acceptance? | D-13 requires both Care Recipients' iPhones, the nurse tester's Android, and one desktop keyboard configuration; record exact installed versions before execution. | Adds testing work and leaves broader coverage for Gate D. | **First-family matrix decided; broader coverage before public beta or release.** |
| 12 | What are the exact retention, deletion, legal-hold, backup, cache, export, and succession periods? | Choose documented periods with legal, privacy, security, and operational review. | Short periods improve privacy but reduce recovery. | **Yes**, before storing production data. |
| 13 | What can support staff see? | No routine content access, impersonation, undocumented permission, or automatic access through any Circle role, support function, or internal Kinward account. | Protects families but makes support harder. | **Approved for milestone one; exceptional future access remains separately gated.** |
| 14 | Are healthcare-team instructions manual or imported? | Manual entry for MVP, with source, recorder, copied-or-summarized status, version history, and no claim that Kinward verified the medical content. | More transcription work but avoids integration risk. | **Yes.** |
| 15 | Which illnesses and treatment patterns does the MVP claim to support? | Use a general coordination core validated with chemotherapy-centered synthetic testing; avoid broad clinical claims. | Focused and safer but less comprehensive. | **Before final MVP scope.** |
| 16 | What success measures and analytics are allowed? | Measure coordination, comprehension, permission accuracy, caregiver support, and accessibility without sensitive third-party analytics or medical outcome claims. | Provides less behavioral detail. | **Before analytics implementation.** |

### Remaining Contradictions

After the approved updates, no direct contradiction remains among the reported tensions. Some table entries are approved or assigned to a named gate; the remaining operational and edge-case decisions must not be silently filled in during implementation.

---

## 19. Complete MVP Acceptance Checklist

Before the first family tests Kinward, all items relevant to the test environment must be true.

### Governance and Scope

- [ ] The founder representing First & 8th approves the applicable product requirements as product owner.
- [ ] Before milestone-one coding, privacy and permission review, WCAG 2.2 Level AA baseline approval, and synthetic-data-only confirmation are complete.
- [ ] Before Patient or Caregiver Check-In development, the medical-safety reviewer function is assigned and the D-6 review is complete.
- [ ] Before real family health information is stored, security and privacy architecture reviewers are assigned and the D-6 review is complete.
- [ ] Before public beta or App Store release, qualified legal/privacy, child-safety, accessibility, and security reviews are complete.
- [ ] The launch region and test boundaries are documented.
- [ ] The MVP screen list and naming are approved.
- [ ] No feature claims medical outcomes or comprehensive illness support.

### Synthetic Test Data

- [ ] Every test person and event is fictional.
- [ ] No real patient, family, clinician, facility, phone number, address, or treatment record is used.
- [ ] Screenshots, logs, analytics, support examples, and demonstrations use synthetic content only.
- [ ] Test data is clearly marked as fictional.

### Care Recipient Ownership and Authority

- [ ] Each Care Recipient owns their medical and personal information.
- [ ] Spouse, Circle Head, Family Coordinator, and Backup Circle Administrator status grant no automatic medical access.
- [ ] Unclear, disputed, or withdrawn consent defaults to no publication and the more private state.
- [ ] Trusted Decision Contact and Backup Circle Administrator boundaries are documented.
- [ ] Incapacity, separation, death, guardianship, and succession use documented review rather than automatic transfer.
- [ ] Legal roles and documents remain separate from Kinward permissions.
- [ ] Kinward never declares legal documentation valid or decides incapacity.

### Care Management Mode

- [ ] Every adult Care Recipient can choose Self-Managed, Shared Management, or Delegated Management.
- [ ] Delegation records grantor, recipient, scope, start date, optional expiration, active/suspended/expired/revoked status, consent, changes, and revocation.
- [ ] Delegation creation recommends and prefills 90 days, permits a deliberate “Until revoked” choice, and schedules a recurring 90-day review reminder when no expiration is set.
- [ ] Suspension and revocation remove permissions everywhere and invalidate active delegated sessions where technically possible without deleting audit history.
- [ ] Customized scopes and “Grant all Kinward management permissions” are supported.
- [ ] Every delegated action records who acted and on whose behalf.
- [ ] The Care Recipient retains access and can modify or revoke delegation while able.
- [ ] Revoking delegation does not silently remove an unrelated Circle role or erase historical actions.

### Roles and Permissions

- [ ] Every role has view, add, edit, share, and administer rules.
- [ ] Every permission is scoped to a Circle and Care Recipient where applicable.
- [ ] Detailed medical information is never available to Extended Circle members.
- [ ] Each adult controls their private well-being entries independently of every Care Recipient and Circle role.
- [ ] Backup and treatment-window access expires as designed.
- [ ] New roles do not silently receive old records.
- [ ] Removing a role revokes active access and sessions.
- [ ] Search, exports, activity feeds, notifications, and audit views enforce original permissions.
- [ ] Audience previews match the recipient's actual view.

### Managed Minor Safety

- [ ] Managed minor profiles have an identified authorized adult and no independent sign-in.
- [ ] Adult medical content is never automatically simplified for minors.
- [ ] Age-appropriate updates and prayers, messages, drawings, voice notes, or supervised contributions are submitted by the authorized adult.
- [ ] Managed minors receive no medical or emergency alerts, symptoms, medications, prognosis, emergency information, private documents, or adult well-being entries.
- [ ] Managed minors are not assigned medical or adult caregiving responsibility.
- [ ] Sensitive locked-screen notifications never identify or expose a managed minor.

### Multiple Circles and Care Recipients

- [ ] A user can belong to multiple Family Circles.
- [ ] One Circle can contain multiple Care Recipients.
- [ ] The active Circle and Care Recipient remain visible.
- [ ] Switching context clears private views, search, drafts, and cached results from the previous context.
- [ ] Shared Household tasks are clearly labeled with no active Care Recipient and contain no person-specific sensitive information.
- [ ] Unassigned, declined, or overdue Shared Household tasks route to the Circle-wide Family Coordinator queue or show “No routing lead assigned” when none is active.
- [ ] Circle and Care Recipient separation is tested in notifications, exports, audit views, and support tools.

### Medical Safety

- [ ] Kinward does not diagnose, interpret, score, triage, reassure, or recommend treatment.
- [ ] No generic symptom or emergency thresholds exist.
- [ ] Every healthcare-team instruction shows source, date, recorder, status, and history.
- [ ] Family notes are visibly different from healthcare-team instructions.
- [ ] Symptom entries state that Kinward is not continuously monitored.
- [ ] No workflow guarantees review or clinician notification.
- [ ] Medication, measurement, pump, diet, hydration, and movement content stays within approved boundaries.
- [ ] Medical-safety review is complete before Patient or Caregiver Check-In questions, wording, information sources, or escalation boundaries are developed.
- [ ] Legal review is required only at the qualified gates defined by D-6 and does not silently validate medical content or family authority.

### Emergency Experience

- [ ] The supported region's emergency language is approved.
- [ ] Local emergency, healthcare-team, after-hours, and family contacts are visibly distinct.
- [ ] Users deliberately choose a contact.
- [ ] Kinward does not infer urgency or call automatically.
- [ ] Missing and stale contacts have a clear, honest state.

### Caregiver Support

- [ ] Caregiver Today has equal product prominence with Patient Today.
- [ ] A caregiver can record a private check-in.
- [ ] A caregiver can request practical backup without sharing the private explanation.
- [ ] Backup coverage can be accepted, declined, handed off, and expired.
- [ ] Copy avoids guilt, blame, scores, and streak pressure.

### Tasks and Communication

- [ ] Tasks can be created, assigned, claimed, declined, reassigned, completed, and handed off.
- [ ] Task recipients see only necessary details.
- [ ] Unclaimed and overdue states use neutral language.
- [ ] Official updates require audience preview and approval.
- [ ] Corrections are visible and conflicting medical information is not silently resolved.
- [ ] Visit, call, encouragement, prayer, and meditation preferences are optional and enforceable.

### Notifications

- [ ] Notification channels are opt-in where required.
- [ ] Locked screens, email subjects, and SMS contain generic text only.
- [ ] Authentication is required before private details appear.
- [ ] Links do not contain reusable credentials or sensitive data.
- [ ] Delay, failure, retry, and delivery-status language is honest.
- [ ] Notifications are never described as emergency or clinical monitoring.

### Accessibility and Usability

- [ ] WCAG 2.2 Level AA acceptance criteria are defined for every core flow.
- [ ] Controls are large and comfortably spaced on a phone.
- [ ] Text resizing does not remove content or function.
- [ ] Screen readers announce headings, labels, errors, status, and confirmation.
- [ ] Keyboard use and visible focus are supported.
- [ ] Color, icons, motion, gestures, and memory are never the only way to understand or act.
- [ ] Reduced motion and high contrast are supported.
- [ ] Older adults and people experiencing fatigue or stress can complete core tasks in testing.

### Security, Privacy, and Operations

- [ ] Invitations expire and bind to the invited verified email; phone is not a Milestone One identity channel.
- [ ] Sensitive role acceptance requires confirmation by the Care Recipient or an authorized representative with that scope.
- [ ] Authentication, recovery, session, and revocation behavior is tested.
- [ ] Sensitive information is encrypted in transit and at rest in any environment that stores it.
- [ ] Data retention, export, deletion, recovery, and backup removal are defined and tested.
- [ ] No Circle role, support function, or internal Kinward account receives undocumented or automatic access; any future exceptional support access is separately authorized, time-limited, and logged.
- [ ] Audit records avoid duplicating sensitive content.
- [ ] Security and privacy incident response processes exist.
- [ ] No unreviewed third party receives health or family information.
- [ ] No HIPAA or similar compliance claim appears without documented approval.
- [ ] Local development and hosted preview use only fictional or synthetic data.
- [ ] The restricted real-family beta remains isolated and cannot begin before Gate C and signed readiness approval.
- [ ] Real document upload remains unavailable until separate secure-document implementation and readiness approval.

### Test Completion

- [ ] All scenarios in Section 17 pass for every relevant role.
- [ ] Permission-denied, empty, loading, offline, stale, and error states are tested.
- [ ] Safety, privacy, accessibility, and security defects have release-blocking rules.
- [ ] The family tester understands what Kinward does and does not do before beginning.

---

## 20. Plain-Language Glossary

**Access:** What a person is allowed to see or do in Kinward.

**Backup Circle Administrator:** An adult with a separate, dormant contingency role who may preserve assigned non-medical Circle administration only after approved activation. Dormant status grants no usable backup permissions, and the designation grants no automatic medical access or succession authority.

**Age-appropriate update:** A separately written summary intended for a particular child or age group. It is not an automatic copy or shortening of an adult medical record.

**Alert:** A message that may imply something needs attention. Kinward must not describe a coordination notice as a medical alert.

**Appointment:** A scheduled healthcare or support event. Medical purpose and notes may be more private than date and transportation details.

**Audit history:** A record of important actions such as role changes, permission changes, instruction edits, exports, or deletion requests.

**Audience:** The specific people or roles allowed to see an item.

**Backup Caregiver:** An approved adult who provides temporary coverage and receives only the information needed for that period.

**Care Management Mode:** The Care Recipient's choice of Self-Managed, Shared Management, or Delegated Management.

**Care Recipient:** An adult receiving care who owns and controls their medical and personal information in Kinward.

**Care Lead:** The person coordinating meals, rides, chores, companionship, respite, and other practical help.

**Caregiver Check-In:** The caregiver-controlled part of Daily Care Check for recording capacity, rest, stress, workload, and support needs. The caregiver chooses what, if anything, to share.

**Caregiver Today:** The primary caregiver's private daily area for workload, breaks, support, and backup needs.

**Chemo Care Lead:** The person coordinating family logistics around chemotherapy or another configured treatment cycle. The role does not create medical authority.

**Circle:** A private Kinward space for approved members. One Circle may contain multiple Care Recipients and shared household tasks.

**Circle Head:** An adult with assigned shared Circle administration permissions. This role grants no automatic medical access.

**Circle Today:** A role-filtered view of today's updates, tasks, and schedule information.

**Circle update:** An intentionally written, approved message for a selected family audience.

**Clinical:** Related to professional healthcare assessment or treatment. Kinward coordinates family care and does not provide clinical services.

**Coordination information:** Practical details such as rides, meals, chores, coverage, and task timing.

**Core care team:** In this document, the trusted family roles coordinating private care information. It does not mean the patient's clinical healthcare team.

**Daily Care Check:** The approved umbrella containing a separate Patient Check-In and Caregiver Check-In.

**Symptoms:** A section inside the Patient Check-In for recording changes in the Care Recipient's own words. It does not diagnose, score, or triage.

**Detailed medical information:** Symptoms, diagnoses recorded for coordination, treatment details, healthcare-team instructions, medication references, tests, and detailed medical notes.

**Delegated Management:** A mode in which a Care Recipient gives an adult Designated Care Representative explicit Kinward management permissions.

**Designated Care Representative:** An adult with explicit, recorded, revocable permission to perform selected Kinward actions on behalf of a Care Recipient. The designation does not create legal healthcare authority.

**Emergency contact:** A family-approved local emergency, healthcare-team, after-hours, or family contact displayed for deliberate user action.

**Encryption:** Technical protection that makes stored or transmitted information unreadable without authorized access.

**Extended Circle:** Supporters who receive deliberately shared non-clinical updates and limited practical tasks but never detailed medical information.

**Family Coordinator:** The Circle-wide role that organizes general communication, invitations proposed for approval, schedules, task coverage, and the queue for unassigned, declined, or overdue Shared Household tasks.

**Family preference:** A non-medical request or choice, such as visit timing or a preferred meal. It must not be presented as healthcare guidance.

**Gentle movement support:** Coordination of companionship or practical help for an activity chosen by the patient or addressed by the healthcare team. Kinward does not create an exercise plan.

**Healthcare team:** The patient's licensed clinicians and healthcare organization. They are separate from Kinward's family roles and do not have MVP accounts.

**Healthcare-team instruction:** Information that came from the patient's healthcare team and is recorded with source, date, recorder, and history.

**HIPAA:** A United States health-information law. Kinward must not claim HIPAA compliance without a documented legal, privacy, security, contractual, and operational assessment.

**Identity verification:** Confirming that an invited person controls and uses the intended verified email address. It does not mean requiring government identification for ordinary MVP invitations. Phone authentication and phone invitation binding are deferred under D-8; phone numbers may later remain separate contact information.

**Least privilege:** Giving each person only the minimum access needed for their role or task.

**Legal healthcare representative:** A person whose authority comes from applicable law and supporting documents, not from a Kinward role. Kinward does not declare that authority valid.

**Managed minor profile:** A child or teen Extended Circle profile controlled by an authorized adult, without independent sign-in or access to restricted information.

**Medical Lead:** The trusted adult who records and coordinates healthcare-team instructions without diagnosing or recommending treatment.

**Medical-safety reviewer:** A qualified clinical advisor who reviews general product wording and workflows for unsafe medical implications. The reviewer does not monitor family accounts or provide patient care through Kinward.

**MVP:** Minimum viable product—the smallest carefully defined version that can test Kinward's core value safely.

**Notification:** A generic in-app, push, email, or SMS notice that something is available in Kinward. It is not proof of delivery, review, or medical response.

**Patient Today:** The active Care Recipient's private daily area for appointments, sourced instructions, support, and Patient Check-In.

**Patient Check-In:** The Care Recipient-controlled part of Daily Care Check for recording reported information, including the Symptoms section. Kinward does not diagnose, score, triage, or recommend treatment from it.

**Permission:** A rule allowing a person to view, add, edit, share, or administer a particular kind of information.

**Portable pump:** A treatment device that may be part of some care plans. Kinward may coordinate sourced instructions and appointments but does not monitor or interpret the device.

**Primary caregiver:** The one adult designated to provide the main day-to-day household care at a given time. This may or may not be the spouse.

**Prospective access:** Permission that begins now and does not automatically reveal older records.

**Prayer and meditation:** Optional spiritual or reflective content controlled by the family and content author.

**Record-level audience:** A specific sharing choice attached to one entry rather than every item of its type.

**Recovery Support:** Practical family coordination after treatment, separate from medical recovery advice.

**Role:** A named set of coordination responsibilities and default permissions.

**Self-Managed:** A Care Management Mode in which the Care Recipient solely owns and manages their own Kinward record. Other people may retain non-management coordination or care roles, but those roles grant no management access to the Care Recipient's private information.

**Shared Management:** A Care Management Mode in which the Care Recipient shares selected Kinward management responsibilities with approved adults.

**Shared Household:** A non-sensitive task context with no active Care Recipient. Unassigned, declined, or overdue tasks route to the Circle-wide Family Coordinator queue or show “No routing lead assigned” when none is active.

**Sensitive information:** Private health, caregiver, family, contact, location, spiritual, or account information that requires limited access.

**Source:** Where an instruction or fact came from, such as a healthcare-team handout or named department.

**Synthetic data:** Obviously fictional information created for planning, development, testing, or demonstration instead of using real patient or family information.

**Task:** A practical need with a creator, optional assignee, status, due information when applicable, minimum instructions, and optional backup. Shared Household tasks contain no person-specific sensitive information.

**Treatment Journey:** The Schedule view for cycle-level preparation, treatment events, pump disconnection when applicable, recovery phases, and rebuilding coordination. It does not predict or guide treatment.

**Trusted Decision Contact:** A person the Care Recipient identifies for contact if consent or authority later requires review. The designation grants no app or legal authority.

**WCAG 2.2 Level AA:** The accessibility conformance target used to define testable requirements for perceivable, operable, understandable, and robust interaction.
