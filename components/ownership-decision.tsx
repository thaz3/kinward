"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  acceptOwnershipInvitation,
  declineOwnershipInvitation,
} from "@/app/actions/care-recipients";
import { OWNERSHIP_CONSEQUENCE_COPY } from "@/lib/care-recipients";

type Step = "review" | "accept";

export function OwnershipDecision({
  token,
  circleName,
  proposerLabel,
  displayLabel,
  expiresAt,
  error,
}: {
  token: string;
  circleName: string;
  proposerLabel: string;
  displayLabel: string;
  expiresAt: string;
  error?: string;
}) {
  const [step, setStep] = useState<Step>(error ? "accept" : "review");
  const [consentChecked, setConsentChecked] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const heading = useRef<HTMLHeadingElement>(null);
  const declineDialog = useRef<HTMLDialogElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const declineButton = useRef<HTMLButtonElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(() => {
    if (error) errorSummary.current?.focus();
  }, [error]);

  function goBackToReview() {
    if (consentChecked) {
      const leave = window.confirm(
        "You changed your consent response. Go back to review without accepting?",
      );
      if (!leave) return;
    }
    setConsentChecked(false);
    setStep("review");
  }

  const expiryLabel = new Date(expiresAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (step === "accept") {
    return (
      <section className="content-card" aria-labelledby="ownership-accept">
        <h2 ref={heading} tabIndex={-1} id="ownership-accept">
          Accept ownership of “{displayLabel}”
        </h2>
        {error === "consent" && (
          <div
            className="error-summary"
            role="alert"
            tabIndex={-1}
            ref={errorSummary}
          >
            <h3>Confirm your consent to continue</h3>
            <p>
              Your ownership was not activated. Check the consent box to accept
              sole ownership.
            </p>
          </div>
        )}
        <dl className="definition-list">
          <div>
            <dt>Circle</dt>
            <dd>{circleName}</dd>
          </div>
          <div>
            <dt>Proposed by</dt>
            <dd>{proposerLabel}</dd>
          </div>
        </dl>
        <section
          className="neutral-alert"
          aria-labelledby="accept-consequences"
        >
          <h3 id="accept-consequences">What accepting means</h3>
          <ul>
            {OWNERSHIP_CONSEQUENCE_COPY.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <form action={acceptOwnershipInvitation} className="form-stack">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <div className="field-group">
            <label className="choice-card">
              <input
                type="checkbox"
                name="ownershipConsent"
                value="accepted"
                required
                checked={consentChecked}
                onChange={(event) => setConsentChecked(event.target.checked)}
              />
              <span>
                <strong>
                  I consent to becoming the sole owner of “{displayLabel}”.
                </strong>
                <span className="choice-help">
                  Acceptance activates sole ownership and any required{" "}
                  {circleName} membership together.
                </span>
              </span>
            </label>
          </div>
          <button className="button primary" type="submit">
            Accept ownership
          </button>
        </form>
        <button
          className="button secondary"
          type="button"
          onClick={goBackToReview}
        >
          Back to review
        </button>
      </section>
    );
  }

  return (
    <>
      <section className="content-card" aria-labelledby="ownership-review">
        <p className="status-copy">
          <span aria-hidden="true">✓ </span>
          Email verified
        </p>
        <h2 ref={heading} tabIndex={-1} id="ownership-review">
          {proposerLabel} proposed you as the sole owner of “{displayLabel}”
        </h2>
        <dl className="definition-list">
          <div>
            <dt>Circle</dt>
            <dd>{circleName}</dd>
          </div>
          <div>
            <dt>Proposed by</dt>
            <dd>{proposerLabel}</dd>
          </div>
          <div>
            <dt>Expires</dt>
            <dd>
              <time dateTime={expiresAt}>{expiryLabel}</time>
            </dd>
          </div>
        </dl>
        <section
          className="neutral-alert"
          aria-labelledby="review-consequences"
        >
          <h3 id="review-consequences">Before you decide</h3>
          <ul>
            {OWNERSHIP_CONSEQUENCE_COPY.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <p>You may decline. You do not need to explain why.</p>
        <button
          className="button primary"
          type="button"
          onClick={() => setStep("accept")}
        >
          Review and accept
        </button>
        <button
          ref={declineButton}
          className="button destructive"
          type="button"
          onClick={() => {
            declineDialog.current?.showModal();
            keep.current?.focus();
          }}
        >
          Decline
        </button>
        <Link className="button secondary" href="/my-kinward">
          Return safely
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
          <h2>Decline ownership invitation?</h2>
          <p>
            Declining creates no active record, ownership, authority, or
            membership. The invitation link will stop working.
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
              Keep reviewing
            </button>
            <form action={declineOwnershipInvitation}>
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

export function OwnershipUnavailableState() {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <section className="system-state neutral-state" role="alert">
      <h2 ref={heading} tabIndex={-1}>
        This ownership invitation is unavailable
      </h2>
      <p>
        The invitation link cannot be used. No Circle, proposer, proposed label,
        or reason is shown.
      </p>
      <Link className="button primary" href="/my-kinward">
        Return to My Kinward
      </Link>
    </section>
  );
}
