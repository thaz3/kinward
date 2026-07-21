"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cancelInvitation, resendInvitation } from "@/app/actions/invitations";
import { proposedAssignmentSummary } from "@/lib/invitations";

export function PendingInvitationDetail({
  circleId,
  invitationId,
  emailMask,
  createdAt,
  expiresAt,
  idempotencyKey,
  notice,
  error,
}: {
  circleId: string;
  invitationId: string;
  emailMask: string;
  createdAt: string;
  expiresAt: string;
  idempotencyKey: string;
  notice?: string;
  error?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, [notice, error]);

  function openCancel() {
    dialog.current?.showModal();
    keep.current?.focus();
  }
  function closeCancel() {
    dialog.current?.close();
    cancelButton.current?.focus();
  }

  return (
    <>
      <section className="content-card" aria-labelledby="pending-invitation">
        <h2 ref={heading} tabIndex={-1} id="pending-invitation">
          Pending invitation
        </h2>
        {notice && (
          <p role="status" aria-live="polite">
            {notice}
          </p>
        )}
        {error && (
          <div className="error-summary" role="alert">
            <h3>We could not update this invitation. Try again.</h3>
          </div>
        )}
        <p className="status-copy">
          <span aria-hidden="true">◷ </span>
          Pending
        </p>
        <dl className="definition-list">
          <div>
            <dt>Recipient</dt>
            <dd>{emailMask}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>
              <time dateTime={createdAt}>
                {new Date(createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </dd>
          </div>
          <div>
            <dt>Expires</dt>
            <dd>
              <time dateTime={expiresAt}>
                {new Date(expiresAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </dd>
          </div>
          <div>
            <dt>Offered access</dt>
            <dd>{proposedAssignmentSummary()}</dd>
          </div>
        </dl>
        <p>No Care Recipient access offered.</p>
        <p>No active authority before acceptance.</p>
        <form action={resendInvitation} className="form-stack">
          <input type="hidden" name="circleId" value={circleId} />
          <input type="hidden" name="invitationId" value={invitationId} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <button className="button primary" type="submit">
            Resend invitation
          </button>
        </form>
        <Link
          className="button secondary"
          href={`/circles/${circleId}/invitations`}
        >
          Back to invitations
        </Link>
        <button
          ref={cancelButton}
          className="button destructive"
          type="button"
          onClick={openCancel}
        >
          Cancel invitation
        </button>
      </section>
      <dialog
        ref={dialog}
        className="navigation-dialog"
        onCancel={(event) => {
          event.preventDefault();
          closeCancel();
        }}
      >
        <div className="navigation-sheet">
          <h2>Cancel this invitation?</h2>
          <p>
            Recipient {emailMask}. Offered access: {proposedAssignmentSummary()}
            . The invitation link will stop working and no membership or
            authority will be created.
          </p>
          <div className="dialog-actions">
            <button
              ref={keep}
              autoFocus
              className="button primary"
              type="button"
              onClick={closeCancel}
            >
              Keep invitation
            </button>
            <form action={cancelInvitation}>
              <input type="hidden" name="circleId" value={circleId} />
              <input type="hidden" name="invitationId" value={invitationId} />
              <button className="button destructive" type="submit">
                Cancel invitation
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
