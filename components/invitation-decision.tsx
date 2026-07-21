"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { acceptInvitation, declineInvitation } from "@/app/actions/invitations";
import { proposedAssignmentSummary } from "@/lib/invitations";

export function InvitationDecision({
  token,
  circleName,
  expiresAt,
  state,
}: {
  token: string;
  circleName: string;
  expiresAt: string;
  state?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const declineDialog = useRef<HTMLDialogElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const declineButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, [state]);

  if (state && state !== "ready") {
    return <InvitationUnavailableState state={state} />;
  }

  return (
    <>
      <section className="content-card" aria-labelledby="invitation-decision">
        <h2 ref={heading} tabIndex={-1} id="invitation-decision">
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
        <p>No access begins until you accept with this verified email.</p>
        <form action={acceptInvitation} className="form-stack">
          <input type="hidden" name="token" value={token} />
          <button className="button primary" type="submit">
            Accept invitation
          </button>
        </form>
        <button
          ref={declineButton}
          className="button destructive"
          type="button"
          onClick={() => {
            declineDialog.current?.showModal();
            keep.current?.focus();
          }}
        >
          Decline invitation
        </button>
        <Link className="button secondary" href="/my-kinward">
          Decide later
        </Link>
      </section>
      <dialog
        ref={declineDialog}
        className="navigation-dialog"
        onCancel={(event) => {
          event.preventDefault();
          declineDialog.current?.close();
          declineButton.current?.focus();
        }}
      >
        <div className="navigation-sheet">
          <h2>Decline this invitation?</h2>
          <p>
            The invitation link will stop working. No membership or authority
            will be created. You do not need to explain why.
          </p>
          <div className="dialog-actions">
            <button
              ref={keep}
              autoFocus
              className="button primary"
              type="button"
              onClick={() => {
                declineDialog.current?.close();
                declineButton.current?.focus();
              }}
            >
              Keep invitation
            </button>
            <form action={declineInvitation}>
              <input type="hidden" name="token" value={token} />
              <button className="button destructive" type="submit">
                Decline invitation
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}

export function InvitationUnavailableState({ state }: { state: string }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [state]);

  const copy =
    state === "expired"
      ? {
          title: "This invitation has expired",
          body: "Ask an authorized Circle person for a new invitation. No Circle information is shown.",
        }
      : state === "cancelled"
        ? {
            title: "This invitation is unavailable",
            body: "The invitation is no longer active. No Circle information is shown.",
          }
        : state === "declined"
          ? {
              title: "This invitation was declined",
              body: "No membership was created. Ask for a new invitation if you need one.",
            }
          : state === "already_used"
            ? {
                title: "This invitation is unavailable",
                body: "The invitation can no longer be used. Return to My Kinward to see Circles you can access.",
              }
            : {
                title: "This invitation is unavailable",
                body: "The invitation link cannot be used. No Circle information is shown.",
              };

  return (
    <section className="system-state neutral-state" role="alert">
      <h2 ref={heading} tabIndex={-1}>
        {copy.title}
      </h2>
      <p>{copy.body}</p>
      <Link className="button primary" href="/my-kinward">
        Return to My Kinward
      </Link>
    </section>
  );
}
