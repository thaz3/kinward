"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  cancelOwnershipProposal,
  resendOwnershipInvitation,
} from "@/app/actions/care-recipients";

export function PendingOwnershipDetail({
  circleId,
  careRecipientId,
  displayLabel,
  invitedEmailMask,
  expiresAt,
  invitationId,
  notice,
}: {
  circleId: string;
  careRecipientId: string;
  displayLabel: string;
  invitedEmailMask: string;
  expiresAt: string;
  invitationId: string;
  notice?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, [notice]);

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
      <section className="content-card" aria-labelledby="pending-ownership">
        <h2 ref={heading} tabIndex={-1} id="pending-ownership">
          Pending ownership — {displayLabel}
        </h2>
        {notice && (
          <p role="status" aria-live="polite">
            {notice}
          </p>
        )}
        <p className="status-copy">
          <span aria-hidden="true">◷ </span>
          Awaiting decision
        </p>
        <p className="status-copy">Private record — Inactive</p>
        <dl className="definition-list">
          <div>
            <dt>Proposed owner</dt>
            <dd>{invitedEmailMask}</dd>
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
        </dl>
        <p>No private information can be added before acceptance.</p>
        <p>
          No active Care Recipient, ownership, membership, or authority exists
          before the proposed owner accepts.
        </p>
        <form action={resendOwnershipInvitation} className="form-stack">
          <input type="hidden" name="circleId" value={circleId} />
          <input type="hidden" name="careRecipientId" value={careRecipientId} />
          <input type="hidden" name="invitationId" value={invitationId} />
          <button className="button primary" type="submit">
            Resend ownership invitation
          </button>
        </form>
        <Link className="button secondary" href={`/circles/${circleId}`}>
          Back to Circle
        </Link>
        <button
          ref={cancelButton}
          className="button destructive"
          type="button"
          onClick={openCancel}
        >
          Cancel proposal
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
          <h2>Cancel this ownership proposal?</h2>
          <p>
            Cancellation invalidates the ownership invitation and creates no
            Care Recipient, ownership, authority, or membership. The proposed
            owner {invitedEmailMask} will no longer be able to accept.
          </p>
          <div className="dialog-actions">
            <button
              ref={keep}
              autoFocus
              className="button primary"
              type="button"
              onClick={closeCancel}
            >
              Keep proposal
            </button>
            <form action={cancelOwnershipProposal}>
              <input type="hidden" name="circleId" value={circleId} />
              <input
                type="hidden"
                name="careRecipientId"
                value={careRecipientId}
              />
              <button className="button destructive" type="submit">
                Cancel proposal
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
