import {
  DELEGATION_BOUNDARY_NOTES,
  DELEGATION_REVIEW_INTERVAL_CALENDAR_DAYS,
  DELEGATION_STATUS_COPY,
  formatInGoverningZone,
  formatLocalDate,
  type DelegatedGrantDetail,
} from "@/lib/delegated-grants";
import { MANAGEMENT_SCOPE_COPY } from "@/lib/management-grants";

export function durationSummary(grant: DelegatedGrantDetail): string {
  if (grant.durationMode === "until_revoked")
    return `No fixed end date. A review is scheduled every ${DELEGATION_REVIEW_INTERVAL_CALENDAR_DAYS} days in ${grant.governingTimeZone ?? "UTC"}.`;
  if (grant.durationMode === "finite" && grant.expirationLocalDate)
    return `Access ends after ${formatLocalDate(grant.expirationLocalDate)} in ${grant.governingTimeZone ?? "UTC"}.`;
  return "No duration has been chosen yet.";
}

export function DelegationStatusLine({
  grant,
}: {
  grant: DelegatedGrantDetail;
}) {
  const copy = DELEGATION_STATUS_COPY[grant.status];
  return (
    <p>
      <span aria-hidden="true">{copy.marker} </span>
      <strong>Status — {copy.label}.</strong> {copy.meaning}
    </p>
  );
}

// One authorized summary shared by the detail, review, suspend, restore, and
// revoke screens, so every screen states the same scopes, dates, and boundaries.
export function DelegationSummary({
  grant,
  headingId = "delegation-summary",
}: {
  grant: DelegatedGrantDetail;
  headingId?: string;
}) {
  const zone = grant.governingTimeZone;
  const entries: Array<[string, string]> = [
    ["Representative", grant.displayName],
    ["Care Recipient", grant.careRecipientLabel],
    ["Duration", durationSummary(grant)],
    ["Circle time zone used for dates", zone ?? grant.circleTimeZone ?? "UTC"],
  ];
  const activated = formatInGoverningZone(grant.activatedAt, zone);
  if (activated) entries.push(["Activated", activated]);
  const expires = formatInGoverningZone(grant.expiresAt, zone);
  if (expires) entries.push(["Access ends", expires]);
  const nextReview = formatInGoverningZone(grant.nextReviewAt, zone);
  if (nextReview) entries.push(["Next review", nextReview]);
  const lastReviewed = formatInGoverningZone(grant.lastReviewedAt, zone);
  if (lastReviewed) entries.push(["Last review completed", lastReviewed]);
  const suspended = formatInGoverningZone(grant.suspendedAt, zone);
  if (suspended) entries.push(["Suspended", suspended]);
  const restored = formatInGoverningZone(grant.restoredAt, zone);
  if (restored) entries.push(["Restored", restored]);
  const revoked = formatInGoverningZone(grant.revokedAt, zone);
  if (revoked) entries.push(["Revoked", revoked]);
  const expired = formatInGoverningZone(grant.expiredAt, zone);
  if (expired) entries.push(["Expired", expired]);

  return (
    <section className="content-card" aria-labelledby={headingId}>
      <h2 id={headingId}>Delegation details</h2>
      <DelegationStatusLine grant={grant} />
      <dl>
        {entries.map(([term, value]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <h3>Included scopes</h3>
      {grant.permissionCodes.length ? (
        <ul className="stack-list">
          {grant.permissionCodes.map((code) => (
            <li key={code}>
              <strong>{MANAGEMENT_SCOPE_COPY[code].label}</strong>
              <span>{MANAGEMENT_SCOPE_COPY[code].purpose}</span>
              <span>{MANAGEMENT_SCOPE_COPY[code].boundary}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No scopes are recorded for this delegation.</p>
      )}
      <ul className="stack-list">
        {DELEGATION_BOUNDARY_NOTES.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
