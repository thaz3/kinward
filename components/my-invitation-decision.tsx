"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { declineMyInvitation } from "@/app/actions/invitations";
import { proposedAssignmentSummary } from "@/lib/invitations";

export function MyInvitationDecision({
  invitationId,
  circleName,
  expiresAt,
}: {
  invitationId: string;
  circleName: string;
  expiresAt: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <section className="content-card" aria-labelledby="my-invitation-decision">
      <h2 ref={heading} tabIndex={-1} id="my-invitation-decision">
        Circle invitation
      </h2>
      <p>
        You are invited to join <strong>{circleName}</strong>.
      </p>
      <dl className="definition-list">
        <div>
          <dt>Offered access</dt>
          <dd>{proposedAssignmentSummary()}</dd>
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
      <p>No Care Recipient access is included.</p>
      <p className="neutral-alert" role="status">
        To accept, use the secure invitation link sent for this invitation.
      </p>
      <button
        ref={trigger}
        className="button destructive"
        type="button"
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
          keep.current?.focus();
        }}
      >
        Decline invitation
      </button>
      <Link className="button secondary" href="/my-kinward">
        Decide later
      </Link>
      <dialog
        ref={dialog}
        className="navigation-dialog"
        onCancel={(event) => {
          event.preventDefault();
          dialog.current?.close();
          setOpen(false);
          trigger.current?.focus();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = dialog.current?.querySelectorAll<HTMLElement>(
            "button:not([disabled])",
          );
          if (!controls?.length) return;
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="navigation-sheet">
          <h2>Decline this invitation?</h2>
          <p>
            Declining prevents later acceptance. No membership or authority will
            be created, and no reason is requested.
          </p>
          <div className="dialog-actions">
            <button
              ref={keep}
              autoFocus
              className="button primary"
              type="button"
              onClick={() => {
                dialog.current?.close();
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              Keep invitation
            </button>
            <form action={declineMyInvitation}>
              <input type="hidden" name="invitationId" value={invitationId} />
              <DeclineSubmitButton />
            </form>
          </div>
          {open ? (
            <span className="visually-hidden">Confirmation open</span>
          ) : null}
        </div>
      </dialog>
    </section>
  );
}

function DeclineSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <>
      <button className="button destructive" type="submit" disabled={pending}>
        {pending ? "Declining…" : "Decline invitation"}
      </button>
      {pending ? <span role="status">Declining invitation…</span> : null}
    </>
  );
}
