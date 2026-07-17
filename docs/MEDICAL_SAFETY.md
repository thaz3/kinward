# Kinward Medical Safety

> **Status:** Current core medical-safety requirements; D-8 through D-17 closed and verified by targeted systems audit
> **Version:** 0.1
> **Last updated:** 2026-07-16
> **Governing or related decisions:** D-5, D-6, D-13, D-17; F-07

## Safety Position

Kinward coordinates family care. It is not a medical device, clinical service, healthcare provider, emergency service, or substitute for the patient's healthcare team.

Kinward must not:

- Diagnose or suggest a diagnosis.
- Interpret a symptom, measurement, image, test result, or change in condition.
- Recommend treatment or advise whether to begin, stop, delay, or change treatment.
- Recommend or calculate medication, dosage, supplements, food, fluids, or clinical procedures.
- Predict outcomes or provide personalized medical risk assessments.
- Suggest that an entry has been reviewed by a clinician, caregiver, or family member when it has not.
- Suggest continuous monitoring, automatic escalation, or emergency response unless a future approved feature actually provides it.
- Create generic symptom or emergency thresholds, or make automatic medical decisions.

## Source of Medical Instructions

Medical instructions in Kinward must come from the patient's healthcare team.

Every recorded instruction should include:

- The healthcare source, such as a named clinician, department, facility, or approved care document.
- The date and time received.
- The person who entered it into Kinward.
- Whether the wording is copied, paraphrased, or summarized.
- The last-updated time and edit history.
- The audience approved by the Care Recipient or an explicitly authorized Designated Care Representative.

Family observations, preferences, and coordination notes must be visibly distinct from healthcare-team instructions.

## Daily Care Check Boundaries

Daily Care Check contains a Patient Check-In and a separate Caregiver Check-In. Patient and caregiver records must never merge permissions, even when separate summaries appear together on Circle Today.

### Patient Check-In

The Patient Check-In may record patient-reported overall condition, temperature, symptoms, food and hydration, medications, rest and movement, port or pump concerns, and support needs. Symptoms are one section within the Patient Check-In. Recording a measurement, medication, device concern, or symptom does not authorize Kinward to interpret it.

The Patient Check-In must:

- Use neutral prompts such as “What would you like to record today?”
- Identify who submitted the entry and whether it was entered on the patient's behalf.
- Allow the user to review and correct information before saving.
- State that Kinward is not continuously monitored.
- Provide fast access to the family's healthcare and emergency contacts.
- Display healthcare-team-provided contact instructions only when their source is clear.

The Patient Check-In must not:

- Label a symptom as safe, dangerous, normal, expected, mild, moderate, or severe on Kinward's own authority.
- Generate a clinical score or infer urgency.
- Reassure the user that they do not need care.
- Tell the user to wait, self-treat, change medication, or alter treatment.
- Claim that submitting an entry alerts a clinician or guarantees a family response.

If a future symptom protocol includes thresholds or response instructions, it requires documented healthcare-team authorship, clinical governance, legal and regulatory review, version control, localization review, and testing before release.

### Caregiver Check-In

The Caregiver Check-In may record energy, stress, physical capacity, rest, workload, tasks requiring coverage, and whether backup is needed.

- Each adult owns their own private well-being entry.
- Patient medical information and caregiver well-being use separate permission scopes.
- No Care Recipient, spouse, Circle Head, Backup Circle Administrator, Family Coordinator, or family member receives automatic access.
- The caregiver may share the full entry, a limited status, a request for help, or nothing.
- A family-safe request such as “The caregiver needs backup” may be created only according to the caregiver's selected sharing preference.
- Kinward must not interpret caregiver entries clinically or imply that they have been reviewed.

## Urgent and Emergency Experience

Kinward must provide a persistent, plain-language route to emergency contacts without attempting to determine whether an event is an emergency.

Baseline copy should communicate:

- Kinward is not an emergency service.
- The user should follow the family's healthcare-team instructions for urgent concerns.
- If the person believes there is an immediate or life-threatening emergency, they should contact local emergency services now.
- Contact availability and local emergency numbers vary by location and must not be assumed globally.

Calling a contact should require a clear user action. The application must not promise that a call, message, or alert was received without reliable confirmation.

The emergency plan should distinguish:

1. Local emergency services.
2. The oncology or treating team's urgent contact.
3. After-hours clinical contact.
4. Primary and backup family contacts.
5. Family-authored logistics or access notes.

## Treatment, Pre-Chemo, and Recovery Content

- Checklists may organize logistics and healthcare-team-provided instructions.
- Healthcare instructions must be clearly labeled with source and date.
- Kinward may remind a user about an approved instruction but must not create or modify that instruction.
- Family logistics such as rides, meals, childcare, household tasks, and caregiver coverage must be separated from clinical directions.
- Generic templates must not contain unsourced medical advice.
- “Chemo” language should be configurable when the family is coordinating another treatment type.

## Medication and Measurement Safety

Medication or measurement support is outside the assumed MVP unless explicitly approved later.

If referenced for coordination:

- Display only family-entered or healthcare-team-provided information.
- Preserve units and wording exactly where accuracy matters.
- Do not calculate doses, convert units, check interactions, or recommend timing.
- Do not infer meaning from temperature, blood pressure, weight, oxygen level, pain rating, or other measurements.
- Provide a clear route back to the source and healthcare-team contact instructions.

## Diet, Hydration, and Movement Safety

- Kinward may coordinate meals, drinks, grocery support, reminders, and help with gentle movement.
- Dietary, fluid, and movement instructions must come from the healthcare team and show their source.
- Family preferences and practical requests must be labeled as non-medical information.
- Kinward must not generate intake targets, exercise plans, restrictions, or judgments about what is safe or appropriate.
- Generic templates must not assume that a food, drink, supplement, amount, or activity is suitable for a patient.

## Content and Interaction Rules

Use language that is calm, direct, and honest about system limits.

Prefer:

- “Recorded for your family.”
- “Healthcare-team instruction, entered by [person] on [date].”
- “Kinward is not monitored by your healthcare team.”
- “Use your healthcare team's instructions or contact them with medical questions.”

Avoid:

- “You're fine.”
- “This is normal.”
- “You should take…”
- “No action is needed.”
- “Your care team has been notified” unless confirmed and true.
- “Kinward recommends…” for any medical action.

Do not use alarming visual treatment for uncertain conditions. Do not hide safety limitations in tooltips, legal text, or settings.

## Privacy as a Safety Requirement

- Detailed medical information is restricted to approved roles and never available to the Extended Circle.
- Each Care Recipient's information is separate from every other Care Recipient's information, even within one Circle.
- Each adult's private well-being entries are separate from Care Recipient medical information.
- Managed minor profiles receive only separately approved, age-appropriate information through an authorized adult.
- Managed minors cannot sign in independently, receive medical or emergency alerts, view symptoms, medications, prognosis, emergency information, or private documents, or hold adult caregiving responsibility.
- Sensitive notifications must conceal content by default.
- Medical information must not appear in analytics, crash reports, URLs, logs, or support tools without an explicit safe design.
- Real patient information must never be used in development, tests, demos, screenshots, or sample data.

## Human Review and Governance

Review follows the staged gates approved in D-6:

- **Before non-medical Milestone One coding:** the founder representing First & 8th provides product-owner approval; privacy and permission review is completed against approved Kinward requirements; the WCAG 2.2 Level AA baseline is approved; and real patient data in development is prohibited.
- **Before Patient or Caregiver Check-In development:** a qualified medical-safety reviewer examines questions, wording, information sources, and escalation boundaries. The reviewer function may remain “Unassigned” until this gate.
- **Before real family health information is stored:** Gate C security and privacy architecture review is completed, environment isolation and operational access are verified, incident response and data lifecycle are approved, and `REAL_FAMILY_BETA_READINESS.md` is signed. Reviewer functions may remain “Unassigned” until this gate.
- **Before public beta or App Store release:** qualified privacy/legal, security, accessibility, and child-safety review is completed.

Medical-safety governance must also define a process for approving, versioning, and retiring safety copy; incident reporting for harmful or misleading content; healthcare-team source attribution; and periodic review as features, jurisdictions, and care settings change. This document does not invent reviewer names, credentials, approvals, or legal conclusions.

Kinward must not be described as HIPAA-compliant based on product intent, encryption, or isolated technical controls. Any future compliance claim requires a documented assessment of applicable law, contracts, policies, operations, vendors, and implemented safeguards.

Local development and controlled hosted preview environments use synthetic information only. The future **Restricted real-care family pilot** is not authorized by planning. Real scans, reports, and care documents require a separate secure-document implementation and readiness review outside non-medical Milestone One.

## Delegation and Legal Authority Safety

- Self-Managed, Shared Management, and Delegated Management are Kinward app modes, not legal findings.
- A Designated Care Representative acts only within explicit, recorded, current Kinward permission scopes.
- A spouse or Circle Head receives no automatic medical access or delegated authority.
- Every delegated action must show who acted and on whose behalf.
- Unclear, disputed, expired, or withdrawn delegation uses the more private behavior.
- Legal roles such as Healthcare Agent, Health Care Proxy, Power of Attorney, Guardian, or Personal Representative are recorded separately from app permissions.
- Kinward may record that legal documentation exists but must not declare it valid, determine incapacity, or resolve competing claims.
- Applicable law and verified documentation govern incapacity, emergency succession, and legal authority.

## Decisions by Named Gate

- **Before Patient or Caregiver Check-In development:** decide whether the Symptoms section uses neutral recording fields or a qualified-reviewer-approved instrument; define any user-directed contact behavior; define measurement and medication-reference fields; and define correction, conflicting-instruction, and outdated-instruction behavior.
- **Before emergency or external-notification features:** approve the supported launch regions, emergency copy, downtime language, delayed-notification language, and failed-delivery language.
- **Before healthcare-team instruction imports:** decide whether instructions remain manually entered or may also be imported, including sourcing and correction controls.
- **Before legal-document or disputed-authority features:** define the qualified-review process without allowing Kinward to declare legal validity or resolve authority.
- **At D-6 review gates:** assign and document the applicable medical-safety, privacy/legal, security, accessibility, and child-safety reviewers without treating an unassigned function as approval.
