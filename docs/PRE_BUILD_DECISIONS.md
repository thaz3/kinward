# Kinward Pre-Build Decision Workbook

> **Status:** Current supporting decision workbook; D-8 through D-17 closed and verified by targeted systems audit
> **Version:** 0.1
> **Last updated:** 2026-07-16
> **Governing or related decisions:** D-1 through D-17; MILESTONE_ONE_DECISIONS.md decisions 1 through 21

## Purpose

This workbook turns unresolved product questions into decisions that can be reviewed before application development begins. It uses plain language, fictional examples, and privacy-preserving recommendations.

Recommendations are not approvals. Legal questions require qualified legal review. Medical-safety questions require review by an appropriate healthcare professional who understands Kinward's coordination-only purpose. Kinward must not diagnose, interpret symptoms, recommend treatment, or imply that anyone is continuously monitoring the application.

## How to Use This Workbook

- Use each item's `Decision status` to identify whether it is approved, restricted, deferred to a named gate, pending a product decision, or pending qualified review.
- Record any conditions or reviewer names beside the answer.
- Resolve each item no later than its named gate; Section A no longer implies that every item blocks the non-medical milestone-one foundation.
- Section B may wait, provided the first version does not accidentally promise or implement the postponed behavior.
- Use only fictional information in design, development, testing, demonstrations, and screenshots.

# A. Decisions Required Before the First Application Code

## A1. Exact Patient Check-In Questions

1. **Decision title:** Exact Patient Check-In questions
2. **Why the decision matters:** The questions determine what sensitive information Kinward stores and whether the experience could be mistaken for medical assessment.
3. **Realistic fictional family example:** Melvina wants to tell her family that she is tired, ate a small meal, and would like a quiet afternoon after treatment. Her family needs coordination information, not an app-generated judgment about her condition.
4. **Available options:** Use only a free-text update; use a short fixed question set; or use a longer clinical-style symptom form.
5. **Recommended Kinward MVP default:** Use a short, optional coordination check-in: “How would you describe today?”, “Would you like to record your temperature?”, “What symptoms or changes would you like the family to know about?”, “Anything to share about food or drinks?”, “Any medication note from you or your healthcare team?”, “Anything to share about rest or movement?”, “Any port or pump note?”, “What support would help today?”, and “Would you like to contact someone?” Do not score, interpret, rank, or create medical thresholds. Obtain medical-safety review before approval.
6. **Benefits of the recommended default:** It supports family planning while keeping Kinward outside diagnosis and treatment advice.
7. **Risks or tradeoffs:** Families may want more detail, and even neutral questions can feel clinical if the wording or layout is poor.
8. **Affected areas:** Patient Today, Patient Check-In and its Symptoms section, Circle Today summaries, permissions, check-in records, sharing controls, and contact workflows.
9. **Major rebuild if changed later:** Yes, if fields, permissions, or stored records change substantially. Wording-only changes may be smaller.
10. **Decision status:** **Deferred to Named Gate** — Decide and obtain medical-safety review before Patient Check-In development under D-6. Reviewer: Unassigned.

## A2. Designated Care Representative Account Recovery

1. **Decision title:** Designated Care Representative account recovery
2. **Why the decision matters:** Recovering an account must restore the right person’s identity without silently granting or transferring authority over another person’s information.
3. **Realistic fictional family example:** T.J. loses his phone while serving as Melvina’s designated representative. A replacement login must not let a stranger use his old delegation.
4. **Available options:** Restore access through email or text alone; require stronger identity checks for delegated accounts; or make the Care Recipient issue a new grant after every recovery.
5. **Recommended Kinward MVP default:** Treat identity recovery and delegated authority as separate steps. Recover the person’s account using approved identity checks, suspend sensitive delegation during recovery, and reactivate it only through the Care Recipient or a documented human review process. Legal and security review must approve the process.
6. **Benefits of the recommended default:** A recovered login does not automatically restore powerful access, reducing takeover risk.
7. **Risks or tradeoffs:** Recovery takes longer and may be difficult when the Care Recipient is unavailable.
8. **Affected areas:** Sign-in, recovery records, delegation grants, suspension status, audit history, support workflow, and security notifications.
9. **Major rebuild if changed later:** Yes. Identity, account, and delegated authority must be separate in the first data model.
10. **Decision status:** **Pending Product Decision** — Define the exact recovery and documented human-review process before delegated-account recovery is implemented. D-1 and D-4 do not silently decide recovery evidence.

## A3. Competing or Disputed Authority

1. **Decision title:** Competing or disputed authority
2. **Why the decision matters:** Kinward must not choose between family members, interpret legal documents, or permit destructive actions while authority is disputed.
3. **Realistic fictional family example:** T.J. and Sharae each claim Melvina asked them to control sharing while Melvina is unavailable. Their instructions conflict.
4. **Available options:** Honor the newest claim; honor a role hierarchy; let support choose; or place affected authority on hold for review.
5. **Recommended Kinward MVP default:** Suspend disputed delegated powers, preserve existing records, and block permission expansion, export, ownership transfer, and deletion until the Care Recipient resolves the matter or a documented legal-review process is completed. Kinward does not decide who is legally correct.
6. **Benefits of the recommended default:** It avoids irreversible disclosure or deletion during a conflict.
7. **Risks or tradeoffs:** Legitimate work may pause during an urgent period, and a human review process is operationally demanding.
8. **Affected areas:** Delegation, permissions, support tools, audit history, export, deletion, invitations, and dispute-status workflows.
9. **Major rebuild if changed later:** Yes. The system needs a safe-hold state and restricted actions from the beginning.
10. **Decision status:** **Approved with Prototype Restriction** — Use the disputed-access safe hold approved in milestone-one decision 8. Final legal-review procedures remain pending qualified review.

## A4. Temporary Suspension of Delegated Access

1. **Decision title:** Temporary suspension of delegated access
2. **Why the decision matters:** The Care Recipient may need to pause access without permanently deleting the delegate, records, or history.
3. **Realistic fictional family example:** Melvina wants to pause T.J.’s representative access while the family resolves a misunderstanding, but she may restore it later.
4. **Available options:** Support only active or revoked access; allow timed suspension; or permit support staff to suspend any account.
5. **Recommended Kinward MVP default:** Give delegation four clear states: active, suspended, expired, and revoked. The Care Recipient may suspend immediately and restore later. Support may place a protective freeze but may not grant or restore authority without the approved process.
6. **Benefits of the recommended default:** It gives the Care Recipient fast control and preserves an understandable history.
7. **Risks or tradeoffs:** More states require careful screen copy and testing to avoid accidental access.
8. **Affected areas:** Delegation records, permission checks, account settings, invitations, audit history, alerts, and support workflow.
9. **Major rebuild if changed later:** Yes. Permission checks must recognize suspension everywhere.
10. **Decision status:** **Approved for Milestone One** — D-1 and milestone-one decision 7 approve active, suspended, expired, and revoked states, immediate permission removal, audit history, and session invalidation where technically possible.

## A5. Support-Team Access to Family Information

1. **Decision title:** Kinward support-team access to family information
2. **Why the decision matters:** Support access can expose health, family, schedule, contact, spiritual, and caregiver information that families expect to remain private.
3. **Realistic fictional family example:** Dee cannot accept an invitation and asks Kinward support for help. Support can troubleshoot the invitation without reading Melvina’s check-ins or private tasks.
4. **Available options:** Give support broad access; allow temporary family-approved access; or provide metadata-only tools with no routine content access.
5. **Recommended Kinward MVP default:** Before the first family test, give support access only to the minimum account and delivery metadata needed to troubleshoot. No Circle role, support function, or internal Kinward account receives undocumented or automatic access to Circle or Care Recipient information. Do not provide routine access to check-ins, medical details, task descriptions, spiritual content, child information, or private notes. Any future exceptional access requires explicit family consent, a reason, time limit, logging, and privacy/security approval.
6. **Benefits of the recommended default:** It minimizes insider access and simplifies the privacy promise.
7. **Risks or tradeoffs:** Some problems will be harder to diagnose and may take longer to resolve.
8. **Affected areas:** Support console, staff permissions, audit history, consent records, troubleshooting procedures, and privacy notices.
9. **Major rebuild if changed later:** Moderate. Strict service boundaries now make later controlled support access safer.
10. **Decision status:** **Approved for Milestone One** — Milestone-one decision 19 and D-6 approve no family-content access, no impersonation, and no undocumented or automatic support access.

## A6. Account Deletion

1. **Decision title:** Account deletion
2. **Why the decision matters:** Deleting a login is different from deleting shared family records created by or about that person.
3. **Realistic fictional family example:** Carlos leaves the Extended Circle and wants his Kinward account deleted. His completed grocery task should not disappear from the family’s coordination history without a clear policy.
4. **Available options:** Delete the login only; delete the login and all authored content; or anonymize selected history while preserving shared records.
5. **Recommended Kinward MVP default:** Separate account deletion from shared-record deletion. Disable sign-in, remove profile contact details where allowed, and retain only the minimum attributed or de-identified shared history required by the approved retention policy. Explain the result before confirmation. Obtain legal and privacy review.
6. **Benefits of the recommended default:** It respects the request without silently damaging the Circle’s shared records.
7. **Risks or tradeoffs:** Some history may remain, and the policy must clearly explain what cannot be immediately erased.
8. **Affected areas:** Account settings, identity records, profile records, authored tasks, check-ins, audit history, retention jobs, and privacy notices.
9. **Major rebuild if changed later:** Yes. Identity and shared content need separate ownership and lifecycle rules.
10. **Decision status:** **Approved with Prototype Restriction** — Milestone-one decision 20 approves disable/archive behavior only. Final deletion and retention policy remains pending qualified review.

## A7. Circle Removal

1. **Decision title:** Removing a person from a Circle or closing a Circle
2. **Why the decision matters:** Removing one member, leaving voluntarily, and closing the entire family space have different effects and permissions.
3. **Realistic fictional family example:** Barbie no longer needs access after a recovery period. Melvina wants to remove Barbie without deleting the Vale family Circle.
4. **Available options:** Treat every removal as deletion; revoke future access but retain shared history; or allow the removed member to retain a read-only copy.
5. **Recommended Kinward MVP default:** Removal immediately ends future access and notifications but preserves minimum shared history under the retention policy. Only an authorized owner can close or archive the Circle. Removed members receive a clear confirmation and no continuing access.
6. **Benefits of the recommended default:** It is simple, immediate, and prevents accidental destruction of family records.
7. **Risks or tradeoffs:** Retained history may concern a removed person, and mistakes require a controlled re-invitation.
8. **Affected areas:** Membership records, invitations, permissions, notifications, task assignments, Circle settings, and audit history.
9. **Major rebuild if changed later:** Yes. Membership status must be independent from identity and record retention.
10. **Decision status:** **Approved with Prototype Restriction** — Milestone-one decision 20 approves immediate access removal with preserved minimum audit history. Final retention and closure rules remain pending qualified review.

## A8. Exact Caregiver Check-In Questions

1. **Decision title:** Exact primary caregiver check-in questions
2. **Why the decision matters:** Caregiver well-being is a core requirement and must not be treated as an afterthought or exposed without consent.
3. **Realistic fictional family example:** DoMonique is coordinating meals, rides, and overnight support. She wants to say she needs backup without sharing a private emotional note with the whole Circle.
4. **Available options:** Ask only “How are you?”; use a short structured check-in; or collect a detailed wellness assessment.
5. **Recommended Kinward MVP default:** Ask optional plain-language questions about energy, stress, physical capacity, rest, current workload, tasks needing coverage, and whether backup is needed. End with a sharing choice: full update, limited “help needed” status, or private to the caregiver. Do not diagnose burnout or generate medical conclusions.
6. **Benefits of the recommended default:** It makes caregiver needs visible and actionable while preserving control over sensitive details.
7. **Risks or tradeoffs:** A short check-in may miss nuance, and a private response may limit the family’s ability to help.
8. **Affected areas:** Caregiver Today, Circle Today, task suggestions, backup workflows, privacy settings, caregiver check-in records, and notifications.
9. **Major rebuild if changed later:** Moderate to major, depending on changes to fields, sharing levels, or automation.
10. **Decision status:** **Deferred to Named Gate** — Decide and obtain medical-safety review before Caregiver Check-In development under D-6. Reviewer: Unassigned.

## A9. Measurement Units and Optional Measurements

1. **Decision title:** Measurement units and optional measurements
2. **Why the decision matters:** Measurements can create medical expectations, conversion errors, and pressure to interpret a number.
3. **Realistic fictional family example:** Melvina enters a temperature from a thermometer set to Fahrenheit. Another family member normally uses Celsius and must see exactly what Melvina entered without Kinward deciding what it means.
4. **Available options:** Store no measurements; store temperature only; or support temperature, weight, blood pressure, oxygen level, and other measurements.
5. **Recommended Kinward MVP default:** If approved after medical-safety review, support temperature only as an optional entry. Store the exact number, selected unit (`°F` or `°C`), time, and who entered it. Do not convert, label, highlight, interpret, or trigger a medical alert. Postpone every other measurement.
6. **Benefits of the recommended default:** It limits sensitive structured data and reduces the risk that Kinward appears to monitor health.
7. **Risks or tradeoffs:** Families must use healthcare-team tools or notes for other measurements, and displaying no conversion may be less convenient.
8. **Affected areas:** Patient Check-In, check-in records, display formatting, accessibility labels, exports, and sharing permissions.
9. **Major rebuild if changed later:** Moderate. A flexible measurement model could reduce later migration work, but should not expose unapproved fields.
10. **Decision status:** **Deferred to Named Gate** — Decide and obtain medical-safety review before Patient Check-In measurements are developed under D-6. Reviewer: Unassigned.

## A10. Completing Check-Ins on Another Person's Behalf

1. **Decision title:** Completing a check-in on another person’s behalf
2. **Why the decision matters:** Kinward must distinguish a person’s own words from another person’s observation and prevent impersonation.
3. **Realistic fictional family example:** Melvina is resting, so DoMonique records that Melvina requested soup and quiet time. The entry must not look as though Melvina personally submitted it.
4. **Available options:** Never permit on-behalf entries; permit them for selected roles; or permit any Circle member to enter them.
5. **Recommended Kinward MVP default:** Allow on-behalf entries only after explicit permission from the Care Recipient or an active Designated Care Representative grant. Store the subject, author, permission source, time, and whether the information was reported by the person or observed by the author. Show “Entered by [name] for [name]” wherever it appears.
6. **Benefits of the recommended default:** It supports low-energy days without hiding authorship or weakening accountability.
7. **Risks or tradeoffs:** Permission management adds complexity, and observed information may still be inaccurate or disputed.
8. **Affected areas:** Check-in form, delegation permissions, check-in records, audit history, summaries, correction workflow, and notifications.
9. **Major rebuild if changed later:** Yes. Authorship and delegation need to be represented in the data model from the beginning.
10. **Decision status:** **Deferred to Named Gate** — Decide before check-in development. D-2 approves sole ownership and explicit grants but does not approve exact on-behalf-of check-in permissions.

## A11. Shared Household Tasks Versus Care Recipient-Specific Tasks

1. **Decision title:** Shared household tasks versus Care Recipient-specific tasks
2. **Why the decision matters:** Task scope controls who may see the task and prevents private care details from leaking through an ordinary household list.
3. **Realistic fictional family example:** “Take trash bins to the curb” belongs to the household. “Drive Melvina to oncology” relates specifically to Melvina and should have narrower access.
4. **Available options:** Put all tasks in one shared list; make every task Care Recipient-specific; or require a scope for each task.
5. **Recommended Kinward MVP default:** Use an explicit `Shared Household — no active Care Recipient` context only for non-sensitive general meals, groceries, laundry, household cleaning, general transportation logistics, and household coverage. A Shared Household task has a creator, optional assignee, status, and due-date information where applicable. Route unassigned, declined, or overdue tasks to the Circle-wide Family Coordinator queue; if none is active, show “No routing lead assigned.” Tie every person-specific sensitive task to the relevant Care Recipient, and do not build mixed-owner sensitive-content approval in the MVP.
6. **Benefits of the recommended default:** Permissions remain understandable, and ordinary help can be shared without revealing medical context.
7. **Risks or tradeoffs:** Creating separate tasks adds a small amount of work and may feel repetitive.
8. **Affected areas:** Task creation, Family Task Assignments, Circle Today, task records, filters, permissions, notifications, and audit history.
9. **Major rebuild if changed later:** Yes. Task scope belongs in the core permission and record model.
10. **Decision status:** **Approved with Prototype Restriction** — D-3 and D-7 approve a non-sensitive Shared Household context, Care Recipient-specific sensitive tasks, and Family Coordinator routing. Task implementation is outside milestone one.

## A12. Privacy of Task Titles and Descriptions

1. **Decision title:** Privacy of task titles and descriptions
2. **Why the decision matters:** A task title can disclose a diagnosis, appointment, symptom, location, or family conflict even when the underlying medical record is hidden.
3. **Realistic fictional family example:** Carlos can help with transportation but should see “Ride needed Tuesday at 2:00” rather than a title that names Melvina’s treatment or clinic.
4. **Available options:** Show full task text to every eligible helper; use one generic title plus a private detail field; or require authors to write privacy-safe text manually.
5. **Recommended Kinward MVP default:** Shared Household task titles and descriptions must remain non-sensitive and may not contain a separate sensitive reason field. A sensitive task belongs to the relevant Care Recipient and may later use permission-filtered details after task-field design is approved. Notifications use only privacy-safe text. Do not create a generic task-level routing role.
6. **Benefits of the recommended default:** Helpers receive enough information to act while sensitive context stays restricted.
7. **Risks or tradeoffs:** Authors must maintain two levels of detail, and overly generic titles may cause confusion.
8. **Affected areas:** Task form, task records, role permissions, Circle Today, notifications, search, exports, and audit history.
9. **Major rebuild if changed later:** Yes. Separate public-safe and private fields should exist in the first task model.
10. **Decision status:** **Approved with Prototype Restriction** — D-3 and D-7 prohibit sensitive content in Shared Household tasks. Exact privacy-safe task-field design remains deferred until task workflow design.

## A13. Care Recipient Record Deletion

1. **Decision title:** Permanent deletion of a Care Recipient record
2. **Why the decision matters:** This action can erase the central record for a family and affect other people’s shared history, legal rights, and expectations.
3. **Realistic fictional family example:** Melvina asks to permanently delete her care record after treatment. Tasks authored by relatives and an audit trail of prior sharing also exist.
4. **Available options:** Let any owner or delegate delete it; allow only the Care Recipient; or postpone permanent deletion and support archive plus reviewed requests.
5. **Recommended Kinward MVP default:** Build no one-click permanent deletion for the first family test. Allow the Care Recipient to archive and restrict the record, then use a documented reviewed process for permanent deletion. A delegate cannot permanently delete the Care Recipient’s record. Legal and privacy review must define exceptions and retention obligations.
6. **Benefits of the recommended default:** It prevents irreversible mistakes while still giving the Care Recipient immediate privacy control.
7. **Risks or tradeoffs:** A reviewed request is slower and requires secure operations outside the normal screen flow.
8. **Affected areas:** Care Recipient settings, Circle archive, deletion requests, record ownership, retention, audit history, and support workflow.
9. **Major rebuild if changed later:** Yes. Ownership, dependency, and lifecycle rules must be explicit before records are created.
10. **Decision status:** **Approved with Prototype Restriction** — Milestone-one decision 20 approves archive/restrict behavior and no delegate permanent deletion. Final deletion policy remains pending qualified review.

## A14. Audit-History Retention

1. **Decision title:** Audit-history content and retention
2. **Why the decision matters:** Audit records help explain access and changes, but retaining too much detail creates another sensitive data source.
3. **Realistic fictional family example:** Melvina wants to know when Barbie’s access ended. The audit record needs the action and time, not a copy of every private note Barbie saw.
4. **Available options:** Keep no audit history; retain full content indefinitely; or retain minimal event metadata for a reviewed period.
5. **Recommended Kinward MVP default:** Store minimal metadata for security and accountability: actor, affected record or permission, action, time, and result. Do not copy sensitive content into the audit event. Make retention configurable and require legal, privacy, and security approval before choosing the exact period.
6. **Benefits of the recommended default:** It supports investigations and family transparency while limiting duplicated sensitive information.
7. **Risks or tradeoffs:** Minimal logs may not answer every dispute, and an exact retention period remains unresolved.
8. **Affected areas:** Every permission-changing workflow, audit records, support tools, deletion, export, security review, and retention jobs.
9. **Major rebuild if changed later:** Yes for audit event structure; usually no for a configurable retention duration.
10. **Decision status:** **Approved with Prototype Restriction** — Milestone-one decision 15 approves minimal append-only audit events. Exact retention duration remains pending qualified legal, privacy, and security review.

## A15. Recording Legal Documents Without Validation

1. **Decision title:** Recording legal-document information without Kinward validation
2. **Why the decision matters:** Families may refer to powers of attorney or guardianship documents, but Kinward must not imply that a document is valid, current, or sufficient.
3. **Realistic fictional family example:** T.J. records that a healthcare power-of-attorney document exists and where the family keeps it. Kinward cannot confirm what authority it grants.
4. **Available options:** Upload and validate documents; store the document file without validation; store only family-entered metadata; or store nothing about legal documents.
5. **Recommended Kinward MVP default:** Store only optional metadata: document type as described by the family, person named, effective-date note, storage-location note, and family contact. Display “Not verified by Kinward.” Do not upload files, determine validity, or automatically grant permissions from the entry. Require legal and privacy review.
6. **Benefits of the recommended default:** Families can coordinate around known documents without Kinward making a legal judgment.
7. **Risks or tradeoffs:** The information may be wrong or outdated, and users may still misunderstand the disclaimer.
8. **Affected areas:** Emergency contacts or planning, legal-information records, permissions copy, delegated-access workflow, and support procedures.
9. **Major rebuild if changed later:** Moderate. Automated validation or file storage would require major security, legal, and workflow changes.
10. **Decision status:** **Pending Qualified Review** — Document metadata or storage is outside milestone one and requires legal and privacy review before implementation. Reviewers: Unassigned.

## A16. Incapacity, Separation, Death, and Succession Boundaries

1. **Decision title:** MVP boundaries for incapacity, separation, death, and succession
2. **Why the decision matters:** These events can change family relationships and legal authority. Kinward must not invent an automatic transfer rule.
3. **Realistic fictional family example:** Melvina becomes unable to use Kinward, or she and DoMonique separate, or one of them dies. Existing access may no longer reflect the family’s wishes or legal authority.
4. **Available options:** Automatically transfer control to the spouse; automatically promote a delegate; freeze sensitive actions; or implement a legally reviewed succession process.
5. **Recommended Kinward MVP default:** Do not automatically transfer ownership or authority. Allow a previously designated representative to use only the powers already granted. Place disputed or destructive actions on a safe hold and use a documented review process for changes. State clearly that Kinward does not determine incapacity, marital rights, guardianship, inheritance, or legal authority. Require legal review before testing these workflows.
6. **Benefits of the recommended default:** It avoids making unsupported legal assumptions and limits irreversible harm.
7. **Risks or tradeoffs:** The family may experience delays during an emergency, and First & 8th needs an operational review process.
8. **Affected areas:** Ownership, delegation, recovery, account status, Circle archive, deletion, export, invitations, and support escalation.
9. **Major rebuild if changed later:** Yes. Ownership and authority boundaries are foundational.
10. **Decision status:** **Pending Qualified Review** — No automatic transfer is the safe boundary; exact incapacity, separation, death, and succession procedures require qualified legal/privacy review. Reviewers: Unassigned.

## A17. Managed-Minor Profile Ownership and Deletion

1. **Decision title:** Managed-minor profile ownership and deletion
2. **Why the decision matters:** A child cannot be treated as an ordinary adult account, and age-appropriate information requires stricter control.
3. **Realistic fictional family example:** Noah has a managed profile so he can see approved family updates. DoMonique manages it, but later another adult may need to take over or the profile may need to close.
4. **Available options:** Let any Main adult manage or delete it; assign one managing adult with backup; or exclude managed-minor profiles from MVP.
5. **Recommended Kinward MVP default:** If managed-minor profiles remain in the first test, assign one verified managing adult and record the related Care Recipient. Allow immediate suspension, but not self-service permanent deletion or ownership transfer. Handle those through a documented, legally reviewed process. Give the minor only explicitly approved, age-appropriate information.
6. **Benefits of the recommended default:** It reduces accidental disclosure and avoids casual transfer of control over a child’s profile.
7. **Risks or tradeoffs:** The process is less convenient if the managing adult becomes unavailable. Excluding minors would be simpler still.
8. **Affected areas:** Profile ownership, invitations, age-appropriate sharing, permissions, account recovery, archive, deletion, and audit history.
9. **Major rebuild if changed later:** Yes. Minor profiles need a distinct ownership and permission model from the start.
10. **Decision status:** **Approved with Prototype Restriction** — Milestone-one decisions 17 and 18 approve one managing adult, no independent minor sign-in, explicit visibility, and archive/suspension. Transfer, deletion, and adulthood transition remain pending qualified review.

## A18. Device and Accessibility Requirements for the First Family Test

1. **Decision title:** Supported devices and accessibility requirements for the first family test
2. **Why the decision matters:** “Mobile-first” and “accessible” must become testable requirements before interface components are built.
3. **Realistic fictional family example:** Martin uses an older Android phone with larger text, while Barbie uses an iPhone with VoiceOver. Both need to accept a task without zooming or guessing.
4. **Available options:** Support one recent phone only; support current iPhone and Android browsers; or support a broad desktop, tablet, and phone matrix immediately.
5. **Recommended Kinward MVP default:** Test current supported iPhone Safari and Android Chrome configurations named in the first-family testing plan, plus a keyboard-accessible desktop browser for review. Target WCAG 2.2 Level AA; support 200% text resizing, VoiceOver and TalkBack, keyboard use, visible focus, high contrast, reduced motion, and primary touch targets at least 48 by 48 CSS pixels. Use plain language and do not rely on color alone. Record the exact test devices and operating-system versions before testing begins.
6. **Benefits of the recommended default:** It creates a realistic, measurable baseline for older adults and people under stress without promising every device.
7. **Risks or tradeoffs:** A limited device matrix may miss problems on older or uncommon devices, and accessibility testing adds time to every feature.
8. **Affected areas:** Design system, navigation, forms, notifications, authentication, testing criteria, content, and first-family test support.
9. **Major rebuild if changed later:** Potentially yes. Accessibility and responsive layout are costly to retrofit.
10. **Decision status:** **Approved for Milestone One** — WCAG 2.2 Level AA and the accessibility baseline are approved by milestone-one decision 21 and D-6. The exact test matrix is deferred to the first-family testing plan.

# B. Decisions That May Be Postponed Until Beta, Public Launch, or Later

These decisions can wait only if the first build uses the restrictive default described here and does not promise the postponed capability.

## B1. Locked-Screen Notification Content

1. **Decision title:** Information allowed in locked-screen notifications
2. **Why the decision matters:** Text messages and phone notifications can be visible to people nearby, appear on shared devices, or remain in notification history.
3. **Realistic fictional family example:** Carlos’s phone is on a workbench where coworkers can see it. A message naming Melvina’s treatment or symptom would expose private information.
4. **Available options:** Show full details; show a privacy-safe task title; show only generic Kinward text; or send no external notifications.
5. **Recommended Kinward MVP default:** If external notifications are introduced, use generic text such as “You have a Kinward update.” Require sign-in before showing any family, appointment, caregiver, medical, spiritual, or task detail. For the first family test, in-app updates may be used instead.
6. **Benefits of the recommended default:** It substantially reduces disclosure on visible or shared devices and works for both push notifications and text messages.
7. **Risks or tradeoffs:** The message is less useful at a glance and may lead to fewer people opening the update.
8. **Affected areas:** Notification templates, SMS or push providers, privacy settings, deep links, authentication, and notification history.
9. **Major rebuild if changed later:** No if notification content is template-driven and sensitive details are excluded by default.
10. **Approved decision:** ______________________________________________

## B2. Notification Recipients and Escalation

1. **Decision title:** Who receives updates and whether an unanswered update escalates
2. **Why the decision matters:** Automatic symptom alerts or escalation could create a dangerous expectation that Kinward monitors the family or provides emergency response.
3. **Realistic fictional family example:** Melvina records nausea late at night. Kinward must not imply that T.J., DoMonique, or the healthcare team has seen it unless Melvina explicitly contacts them and delivery is confirmed.
4. **Available options:** Automatically notify medical or family roles; let users choose recipients each time; send only task and schedule notifications; or add timed escalation chains.
5. **Recommended Kinward MVP default:** Do not automatically send medical alerts or escalate symptom entries. Let the person explicitly choose an approved family contact or healthcare-team contact. Show delivery status without claiming the person read or acted on it. Emergency actions point to the family plan, local emergency services, or healthcare team as appropriate.
6. **Benefits of the recommended default:** It avoids false monitoring promises, unwanted disclosure, and unsafe generic escalation rules.
7. **Risks or tradeoffs:** A concerned person must take an extra step, and Kinward will not rescue an ignored update.
8. **Affected areas:** Check-ins, contacts, notifications, consent, delivery records, emergency copy, and audit history.
9. **Major rebuild if changed later:** Moderate to major if automatic escalation is added; recipient selection alone can be added more safely.
10. **Approved decision:** ______________________________________________

## B3. Data Export

1. **Decision title:** Family and Care Recipient data export
2. **Why the decision matters:** Export supports access and portability but creates a highly sensitive file that can be forwarded, lost, or viewed outside Kinward’s permissions.
3. **Realistic fictional family example:** Melvina wants a copy of her information, but an export containing DoMonique’s private caregiver notes would violate DoMonique’s sharing choice.
4. **Available options:** No export; one full-Circle export; separate owner-scoped exports; or professional-report formats.
5. **Recommended Kinward MVP default:** Do not provide self-service export in the first family test. Before beta or public launch, design owner-scoped exports that include only information the requester owns or is authorized to receive, exclude another person’s private content, require recent authentication, and log the event. Obtain legal, privacy, and security review.
6. **Benefits of the recommended default:** It prevents a rushed “download everything” feature from bypassing the permission model.
7. **Risks or tradeoffs:** Early testers cannot independently download all their data and may need a reviewed support request.
8. **Affected areas:** Ownership rules, permissions, export jobs, file security, authentication, audit history, support, and privacy notices.
9. **Major rebuild if changed later:** No if ownership and permission boundaries are correct from the beginning; yes if records lack clear ownership.
10. **Approved decision:** ______________________________________________

## B4. Exact Retention Periods

1. **Decision title:** Exact retention periods for archived records, logs, and inactive accounts
2. **Why the decision matters:** Keeping data too long increases privacy risk, while deleting it too quickly can undermine recovery, accountability, or legal obligations.
3. **Realistic fictional family example:** The Vale Circle is archived after treatment. Melvina expects private details not to remain forever, while the family may still need a short period to correct or retrieve information.
4. **Available options:** Delete immediately; use one period for all records; use different periods by record type; or retain indefinitely.
5. **Recommended Kinward MVP default:** Make retention periods configurable and minimize what is stored, but do not silently choose legal durations in this workbook. Approve exact periods with legal, privacy, security, and operational reviewers before beta or any production use. The first family test must have a written manual cleanup plan.
6. **Benefits of the recommended default:** It avoids hard-coding an unreviewed legal policy and makes later changes less disruptive.
7. **Risks or tradeoffs:** A manual test-period plan requires discipline, and uncertainty cannot continue into public use.
8. **Affected areas:** Record lifecycle fields, archive, deletion jobs, backups, audit history, support procedures, and privacy notices.
9. **Major rebuild if changed later:** No if lifecycle dates and configurable policies exist; yes if deletion assumptions are embedded throughout the code.
10. **Approved decision:** ______________________________________________

## B5. Emergency Information Available Offline

1. **Decision title:** Emergency information available when the device has no connection
2. **Why the decision matters:** Offline access can be useful during an emergency, but storing contacts or health details on a device increases exposure if the device is shared, lost, or unlocked.
3. **Realistic fictional family example:** DoMonique is in a parking garage without service and wants the oncology number, while Noah sometimes uses the same phone.
4. **Available options:** Store full emergency details offline; store selected contacts only; rely on the phone’s native emergency features; or provide no offline Kinward data.
5. **Recommended Kinward MVP default:** Do not cache sensitive Kinward emergency information offline in the first family test. Ask families to use their healthcare team’s emergency plan and the phone’s native emergency contacts. Evaluate an encrypted, user-selected offline card for beta after privacy and security review.
6. **Benefits of the recommended default:** It avoids creating an unprotected copy before device-security behavior is fully designed.
7. **Risks or tradeoffs:** Kinward may be less useful without connectivity, so families need a separate reliable emergency plan.
8. **Affected areas:** Emergency Contacts, local device storage, sign-in, encryption, offline state, data clearing, and privacy settings.
9. **Major rebuild if changed later:** Moderate. A secure offline model needs deliberate architecture but does not block the online MVP if interfaces remain separate.
10. **Approved decision:** ______________________________________________

# Workbook Summary

## Approved Milestone-One Question Resolutions

- **A2 / recovery:** D-11 limits Milestone One backup activation to authorized Circle Head approval. If none is available, show a neutral unavailable state. A qualified alternate recovery branch remains deferred.
- **A14 / audit retention:** D-12 retains every synthetic audit event for the life of its active test environment and permits complete-dataset deletion only through documented reset or retirement. Production duration remains Gate C.
- **A18 / devices and accessibility:** D-13 requires both Care Recipients' actual iPhones, the integral nurse team member's actual Android, and one desktop keyboard configuration with the stated accessibility checks; exact versions are recorded before execution.
- **Authentication and ownership:** D-8 and D-9 approve verified-email-only identity and a dedicated adult Care Recipient ownership invitation with no active private record before acceptance.
- **Authority and audit:** D-10, D-14, and D-15 approve the 15-minute recent-authentication rule, fresh strong challenge, last-Circle-Head invariant, and separate family-audit/security-log thresholds.
- **Delegation review:** D-16 approves the in-app recurring 90-day access-review experience without external notifications.
- **Real-data boundary:** D-17 requires isolated synthetic environments and places Gate C plus signed beta readiness before any real information. Secure documents remain a separate later slice.

These approved answers are closed and verified for planning by the 2026-07-16 targeted systems audit. Closure does not mark professional review complete or authorize coding or real-data use.

## Decisions That Truly Block the First Coding Milestone

The WCAG 2.2 Level AA accessibility baseline is already approved for Milestone One. It is not an unresolved product decision or a pending coding gate. The non-medical milestone-one foundation remains blocked only until these D-6 sign-offs are completed:

1. Product-owner approval by the founder representing First & 8th.
2. Privacy and permission review against the approved Kinward requirements.
3. Confirmation that development will use no real patient or family information.

Accessibility governance is staged as follows:

1. **Accessibility baseline approval — completed for Milestone One:** WCAG 2.2 Level AA is the approved product baseline.
2. **Accessibility implementation verification — required during development and first-family testing:** verify the application shell and implemented flows against the approved baseline and the named test matrix.
3. **Independent accessibility review — required before public beta or App Store release:** complete qualified review at the D-6 release gate.

Milestone-one implementation must use the approved ownership, delegation, lifecycle, support-access, managed-minor, and prototype archive rules in `MILESTONE_ONE_DECISIONS.md`. Exact recovery operations in `A2` are not implemented in this milestone and therefore do not block its foundation.

## Decisions That Can Safely Wait

These may wait until their named gate if the restrictive default is used and no broader feature is promised:

1. Exact locked-screen text and external notification channel (`B1`).
2. Any notification escalation beyond explicit user-directed contact (`B2`).
3. Self-service data export (`B3`).
4. Exact production retention durations, with a written first-test cleanup plan (`B4`).
5. Offline emergency information (`B5`).
6. Patient and Caregiver Check-In content, measurements, and on-behalf-of workflows (`A1`, `A8`–`A10`) until medical-safety review before check-in development.
7. Task-field design (`A11`–`A12`) until task workflow design, while preserving D-3 and D-7.
8. Legal-document, succession, and final deletion procedures (`A6`, `A7`, `A13`–`A17`) until qualified review or their named feature gate.
9. Healthcare-system imports, automated symptom interpretation, and third-party sensitive analytics.

## Recommended Answer Order

1. **Complete remaining milestone-one sign-offs:** product-owner approval, privacy/permission review, and synthetic-data confirmation; use the already approved WCAG 2.2 Level AA baseline.
2. **Before recovery features:** `A2`, then the qualified portions of `A3`, `A15`, and `A16`.
3. **Before check-ins:** `A1`, `A8`–`A10`, with medical-safety review.
4. **Before task workflows:** confirm the exact fields for `A11`–`A12` without changing D-3 or D-7.
5. **Before real family health data:** complete D-17 environment preparation, Gate C security and privacy architecture review, and signed real-family beta readiness.
6. **Before public beta or App Store release:** complete qualified legal/privacy, child-safety, accessibility, and security review, then resolve `B1` through `B5` as applicable.

## Final Pre-Code Check

- Every Section A item has an explicit decision status and named gate.
- Medical-safety review occurs before Patient or Caregiver Check-In development; the reviewer may remain “Unassigned” until that gate.
- Security and privacy architecture review occurs before real family health information is stored; reviewers may remain “Unassigned” until that gate.
- Qualified legal/privacy, child-safety, accessibility, and security review occurs before public beta or App Store release.
- The WCAG 2.2 Level AA baseline is approved; exact first-test devices, browser versions, and assistive technologies are named in the first-family testing plan.
- No recommendation is treated as medical advice or a legal determination.
- No real patient or family information will be used.
- Existing planning documents are updated only after the approved decisions are recorded.
