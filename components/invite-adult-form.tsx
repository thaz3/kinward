"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  createInvitation,
  type InvitationActionState,
} from "@/app/actions/invitations";
import { proposedAssignmentSummary } from "@/lib/invitations";

const initialState: InvitationActionState = { status: "idle" };

export function InviteAdultForm({
  circleId,
  circleName,
  idempotencyKey,
}: {
  circleId: string;
  circleName: string;
  idempotencyKey: string;
}) {
  const [state, action, pending] = useActionState(
    createInvitation,
    initialState,
  );
  const [email, setEmail] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const error = useRef<HTMLDivElement>(null);
  const review = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.status === "error") error.current?.focus();
  }, [state]);
  useEffect(() => {
    if (reviewing) review.current?.focus();
  }, [reviewing]);

  if (reviewing) {
    return (
      <form action={action} className="form-stack">
        <input type="hidden" name="circleId" value={circleId} />
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        <input type="hidden" name="invitedEmail" value={email} />
        <h2 ref={review} tabIndex={-1} id="invitation-review">
          Review invitation
        </h2>
        <dl className="definition-list">
          <div>
            <dt>Invitation recipient</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt>Offered access</dt>
            <dd>
              Circle membership and Circle-wide access offered:{" "}
              {proposedAssignmentSummary()} for {circleName}
            </dd>
          </div>
        </dl>
        <section className="neutral-alert" aria-labelledby="access-preview">
          <h3 id="access-preview">Access preview</h3>
          <ul>
            <li>
              Circle membership and Circle-wide access offered: Family
              Coordinator for {circleName}
            </li>
            <li>Care Recipient access offered: none</li>
            <li>
              Not included: ownership, management, delegation, medical
              information, or access to any Care Recipient
            </li>
            <li>Family relationship alone grants no authority</li>
            <li>
              No access begins before the matching verified-email adult accepts
            </li>
          </ul>
        </section>
        <p>This invitation expires seven days after it is sent.</p>
        {pending && (
          <p role="status" aria-live="polite">
            Sending invitation…
          </p>
        )}
        <button className="button primary" disabled={pending} type="submit">
          {pending ? "Sending…" : "Send invitation"}
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={pending}
          onClick={() => setReviewing(false)}
        >
          Back
        </button>
      </form>
    );
  }

  return (
    <form
      className="form-stack"
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget)
          .get("invitedEmail")
          ?.toString()
          .trim()
          .toLowerCase();
        if (!value) return;
        setEmail(value);
        setReviewing(true);
      }}
    >
      {state.status === "error" && (
        <div className="error-summary" role="alert" tabIndex={-1} ref={error}>
          <h2>{state.message}</h2>
          <p>Your entry is still here. Account existence is never confirmed.</p>
        </div>
      )}
      <div className="field-group">
        <label htmlFor="invited-email">
          Invitation recipient — verified email address
        </label>
        <input
          id="invited-email"
          name="invitedEmail"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={email}
          aria-invalid={Boolean(state.fieldError)}
          aria-describedby={
            state.fieldError
              ? "invited-email-error invite-expiry"
              : "invite-expiry"
          }
        />
        {state.fieldError && (
          <p className="field-error" id="invited-email-error">
            {state.fieldError}
          </p>
        )}
        <p id="invite-expiry">
          This invitation expires seven days after it is sent. Use a synthetic
          example.test or example.com address.
        </p>
      </div>
      <fieldset className="role-group">
        <legend>Circle-wide role</legend>
        <label className="choice-card">
          <input
            type="checkbox"
            checked
            readOnly
            aria-checked="true"
            name="proposedRole"
            value="family_coordinator"
          />
          <span>
            <strong>Family Coordinator</strong>
            <span className="choice-help">
              Circle-wide coordination only. No Care Recipient access.
            </span>
          </span>
        </label>
      </fieldset>
      <p className="status-copy" role="status">
        Checking permitted role choices… Family Coordinator is the approved
        Slice 4 proposed assignment. Recipient-specific roles are not available
        yet.
      </p>
      <button className="button primary" type="submit">
        Review invitation
      </button>
      <Link className="button secondary" href={`/circles/${circleId}`}>
        Cancel
      </Link>
    </form>
  );
}
