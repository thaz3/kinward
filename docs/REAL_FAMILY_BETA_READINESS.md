# Kinward Real-Family Beta Readiness

> **Status:** Planning gate; not authorized for real data
> **Version:** 0.1
> **Last updated:** 2026-07-16
> **Governing decisions:** D-6, D-13, D-17 and applicable privacy, permission, safety, and accessibility decisions

## 1. Purpose

This document is the future readiness gate for Kinward's invite-only **Restricted real-care family pilot**. It does not authorize the pilot. No agent may authorize it for the product owner or qualified reviewers.

## 2. Synthetic Preview Versus Restricted Real-Care Pilot

- The controlled hosted preview uses only fictional or synthetic information and is not used for actual care.
- The restricted pilot is a separate environment intended for one approved real-family test only after every applicable gate is signed.
- Preview access, success, or hosting does not establish pilot readiness.

## 3. Environment Isolation Requirements

- [ ] Separate pilot configuration and credentials confirmed
- [ ] Separate database and private storage resources confirmed
- [ ] Separate logs, access controls, backups, and operational access confirmed
- [ ] No data path from the pilot to local development or synthetic preview confirmed
- [ ] Environment labeled “Restricted real-care family pilot”

## 4. Gate C Security and Privacy Requirements

- [ ] Security architecture review completed by a qualified reviewer
- [ ] Privacy architecture review completed by a qualified reviewer
- [ ] Support-access and no-hidden-access controls reviewed
- [ ] Authentication, authorization, session, recovery, and incident boundaries reviewed
- [ ] Encryption in transit and at rest reviewed in context
- [ ] Data lifecycle covering retention, deletion, export, backups, and legal holds reviewed
- [ ] Logging, monitoring, analytics, and error-report protections reviewed
- [ ] Product owner accepts documented residual risks

## 5. Real-Data Restrictions Before Approval

No real patient, family, treatment, scan, report, or health information may be entered until Gate C is complete and this document is signed. Real information must never be copied to development or synthetic preview environments.

- [ ] Gate C completion recorded
- [ ] Written real-data authorization recorded

## 6. Required iPhone and Android Compatibility

- [ ] Both Care Recipients' actual iPhones tested with Safari and the D-13 accessibility matrix
- [ ] Integral nurse team member's actual Android tested with Chrome and the D-13 accessibility matrix
- [ ] Desktop keyboard configuration tested
- [ ] Exact device, operating-system, browser, and assistive-technology versions recorded
- [ ] Blocking accessibility or compatibility defects resolved or explicitly rejected by authorized reviewers

## 7. Participant Invitation and Access Limits

- [ ] Invite-only enrollment confirmed
- [ ] Public discovery and self-service registration disabled unless separately approved
- [ ] Verified-email identity and invitation binding confirmed
- [ ] Participant list and least-privilege roles approved
- [ ] Removal, revocation, and session invalidation procedures tested

## 8. Logging and Analytics Restrictions

- [ ] Family audit, security events, and operational logs remain separate
- [ ] Logs and errors exclude private record content and unnecessary sensitive identifiers
- [ ] No unapproved third-party analytics receive sensitive information
- [ ] Operational access is authorized, time-bounded where appropriate, and auditable

## 9. Data Retention and Deletion Readiness

- [ ] Pilot retention period approved through Gate C
- [ ] Account, Circle, Care Recipient, audit, backup, and deletion behavior approved
- [ ] Export and shutdown return-of-data behavior approved
- [ ] Backup expiration and deletion verification documented
- [ ] Participant withdrawal process approved, including access removal, stopping future collection, handling existing information, retention/deletion treatment, and communication to the participant

**Status of participant-withdrawal item:** Pending product-owner and qualified privacy review before restricted real-family beta authorization. This checklist does not decide whether previously collected information is deleted, retained, archived, or exported; that treatment remains subject to approved retention, privacy, legal, and security review.

## 10. Incident-Response Readiness

- [ ] Named incident owner and contacts recorded
- [ ] Detection, containment, communication, investigation, and recovery steps approved
- [ ] Participant notification decision process approved
- [ ] Pilot suspension and credential-revocation procedure tested

## 11. Secure Document-Sharing Readiness

Document sharing requires a separate secure-document implementation and readiness review. It is outside non-medical Milestone One.

- [ ] Document-sharing scope separately approved
- [ ] Private storage and Care Recipient-specific authorization verified
- [ ] Public URLs prohibited and time-limited access designed where applicable
- [ ] Encryption, type and size limits, and malicious-file protection reviewed
- [ ] Upload, view, download, replacement, deletion, retention, and backup rules approved
- [ ] Sensitive document content excluded from logs, analytics, notifications, and errors
- [ ] Document incident-response procedures approved

## 12. Product-Owner Approval Checklist

- [ ] Founder representing First & 8th approves the restricted pilot scope
- [ ] Product owner approves participants, environment, data categories, duration, and shutdown plan
- [ ] Product owner confirms unresolved risks are documented and accepted

## 13. Qualified-Review Checklist

- [ ] Qualified privacy review complete
- [ ] Qualified security review complete
- [ ] Applicable legal review complete
- [ ] Required accessibility review complete for the pilot stage
- [ ] Medical-safety review complete before any later medical workflow is included
- [ ] Child-safety review complete if minors participate beyond approved managed-profile boundaries

Reviewer functions may remain **Unassigned** until qualified people are selected. No review is complete merely because this checklist exists.

## 14. Beta Start Authorization

- [ ] Gate C reviewers sign off
- [ ] Product owner signs and dates pilot authorization
- [ ] Pilot start date, participant list, and authorized data categories recorded

**Current authorization:** Not authorized. The restricted real-family beta must not begin.

## 15. Beta Suspension and Shutdown Conditions

- [ ] Suspension triggers approved, including suspected unauthorized access, privacy leakage, unsafe behavior, or loss of required controls
- [ ] Immediate access suspension and participant communication steps approved
- [ ] Shutdown, export, deletion, backup cleanup, and evidence-retention steps approved
- [ ] Restart requires documented review and product-owner authorization

No agent may complete, sign, or authorize this gate on behalf of the product owner or a qualified reviewer. No claim of HIPAA compliance is made.
