"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  acceptDelegationAsRepresentative,
  activateDelegatedGrant,
  completeDelegationAccessReview,
  setDelegationFiniteExpiration,
  setDelegationUntilRevoked,
  transitionDelegatedGrant,
  type DelegationActionState,
} from "@/app/actions/delegated-grants";
import {
  DELEGATION_CONSENT_VERSIONS,
  DELEGATION_DURATION_COPY,
  DELEGATION_REVIEW_INTERVAL_CALENDAR_DAYS,
} from "@/lib/delegation-lifecycle-catalog";

const INITIAL: DelegationActionState = { status: "idle" };

type GrantContext = {
  circleId: string;
  careRecipientId: string;
  grantId: string;
};

function useContextClearing(onClear: () => void) {
  const handler = useRef(onClear);
  useEffect(() => {
    handler.current = onClear;
  });
  useEffect(() => {
    const clear = () => handler.current();
    window.addEventListener("kinward:clear-recipient-context", clear);
    window.addEventListener("kinward:clear-circle-context", clear);
    return () => {
      window.removeEventListener("kinward:clear-recipient-context", clear);
      window.removeEventListener("kinward:clear-circle-context", clear);
    };
  }, []);
}

function trapDialogFocus(
  event: React.KeyboardEvent<HTMLDialogElement>,
  dialog: HTMLDialogElement | null,
) {
  if (event.key !== "Tab") return;
  const controls = dialog?.querySelectorAll<HTMLElement>(
    "button:not([disabled])",
  );
  if (!controls?.length) return;
  const first = controls[0],
    last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function ErrorSummary({
  heading,
  state,
}: {
  heading: string;
  state: DelegationActionState;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === "error") ref.current?.focus();
  }, [state.status]);
  if (state.status !== "error") return null;
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="error-summary">
      <h3>{heading}</h3>
      <p>{state.message}</p>
    </div>
  );
}

// Screen 21. No duration is selected by default, the exact suggested date is
// visible before confirmation, and "Until revoked" continues to Screen 22
// instead of silently removing the expiration.
export function DelegationDurationForm({
  circleId,
  careRecipientId,
  grantId,
  expectedVersion,
  representativeName,
  suggestedDate,
  suggestedDateLabel,
  earliestDate,
  governingTimeZoneLabel,
  untilRevokedHref,
}: GrantContext & {
  expectedVersion: number;
  representativeName: string;
  suggestedDate: string;
  suggestedDateLabel: string;
  earliestDate: string;
  governingTimeZoneLabel: string;
  untilRevokedHref: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    setDelegationFiniteExpiration,
    INITIAL,
  );
  const [key] = useState(() => crypto.randomUUID());
  const [choice, setChoice] = useState<
    "suggested" | "custom" | "until_revoked"
  >();
  const [customDate, setCustomDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const keepEditing = useRef<HTMLButtonElement>(null);

  useContextClearing(() => {
    dialog.current?.close();
    setConfirmOpen(false);
    setCustomDate("");
    setChoice(undefined);
  });

  useEffect(() => {
    if (!confirmOpen) return;
    dialog.current?.showModal();
    keepEditing.current?.focus();
  }, [confirmOpen]);

  const close = () => {
    dialog.current?.close();
    setConfirmOpen(false);
    trigger.current?.focus();
  };

  const selectedDate = choice === "suggested" ? suggestedDate : customDate;
  const submitLabel =
    choice === "until_revoked" ? "Continue" : "Review delegation";

  return (
    <>
      <form
        className="form-stack"
        // Validation is handled here so the date error is announced in text
        // rather than only through a native pop-up that screen readers miss.
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!choice) return;
          if (choice === "until_revoked") {
            router.push(untilRevokedHref);
            return;
          }
          if (!selectedDate) {
            setDateError("Enter a date using the YYYY-MM-DD format.");
            return;
          }
          if (selectedDate < earliestDate) {
            setDateError(
              `Choose a date on or after ${earliestDate}. A past date cannot be used.`,
            );
            return;
          }
          setDateError("");
          setConfirmOpen(true);
        }}
      >
        <ErrorSummary heading="Duration unavailable" state={state} />
        <fieldset>
          <legend>How long should this delegation last?</legend>
          <p>
            Representative — {representativeName}. Dates use the Circle time
            zone {governingTimeZoneLabel}.
          </p>
          <div className="stack-list">
            <label className="content-card">
              <input
                type="radio"
                name="durationChoice"
                value="suggested"
                checked={choice === "suggested"}
                onChange={() => {
                  setChoice("suggested");
                  setDateError("");
                }}
              />
              <strong>
                Suggested {DELEGATION_REVIEW_INTERVAL_CALENDAR_DAYS} days —{" "}
                {suggestedDateLabel}
              </strong>
              <span>
                {DELEGATION_DURATION_COPY.finite.consequence} This is a
                suggestion, not a required duration.
              </span>
            </label>
            <label className="content-card">
              <input
                type="radio"
                name="durationChoice"
                value="custom"
                checked={choice === "custom"}
                onChange={() => {
                  setChoice("custom");
                  setDateError("");
                }}
              />
              <strong>A different date you choose</strong>
              <span>{DELEGATION_DURATION_COPY.finite.consequence}</span>
            </label>
            <label className="content-card">
              <input
                type="radio"
                name="durationChoice"
                value="until_revoked"
                checked={choice === "until_revoked"}
                onChange={() => {
                  setChoice("until_revoked");
                  setDateError("");
                }}
              />
              <strong>{DELEGATION_DURATION_COPY.until_revoked.label}</strong>
              <span>{DELEGATION_DURATION_COPY.until_revoked.consequence}</span>
            </label>
          </div>
        </fieldset>
        <div className="form-field">
          <label htmlFor="delegation-custom-date">
            Custom expiration date (YYYY-MM-DD)
          </label>
          <p id="delegation-custom-date-help">
            Access stays active through this whole date in{" "}
            {governingTimeZoneLabel}. The earliest date you can choose is{" "}
            {earliestDate}.
          </p>
          <input
            id="delegation-custom-date"
            type="date"
            inputMode="numeric"
            min={earliestDate}
            value={customDate}
            aria-describedby={
              dateError
                ? "delegation-custom-date-help delegation-custom-date-error"
                : "delegation-custom-date-help"
            }
            aria-invalid={dateError ? true : undefined}
            disabled={choice === "until_revoked"}
            onChange={(event) => {
              setCustomDate(event.target.value);
              setChoice("custom");
              setDateError("");
            }}
          />
          {dateError ? (
            <p id="delegation-custom-date-error" role="alert">
              {dateError}
            </p>
          ) : null}
        </div>
        <button
          ref={trigger}
          className="button primary"
          type="submit"
          disabled={pending || !choice}
        >
          {pending ? "Saving duration…" : submitLabel}
        </button>
        {!choice ? (
          <p role="status">
            Choose one duration. Nothing is selected for you, and no access is
            active yet.
          </p>
        ) : null}
      </form>
      <dialog
        ref={dialog}
        className="navigation-dialog"
        aria-labelledby="delegation-duration-confirm"
        onCancel={(event) => {
          event.preventDefault();
          if (!pending) close();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            if (!pending) close();
            return;
          }
          trapDialogFocus(event, dialog.current);
        }}
      >
        {confirmOpen && selectedDate ? (
          <form action={action} className="navigation-sheet">
            <input type="hidden" name="circleId" value={circleId} />
            <input
              type="hidden"
              name="careRecipientId"
              value={careRecipientId}
            />
            <input type="hidden" name="grantId" value={grantId} />
            <input
              type="hidden"
              name="expirationLocalDate"
              value={selectedDate}
            />
            <input
              type="hidden"
              name="expectedVersion"
              value={expectedVersion}
            />
            <input type="hidden" name="idempotencyKey" value={key} />
            <h3 id="delegation-duration-confirm">
              Confirm the expiration date
            </h3>
            <p>
              {representativeName} would keep access through {selectedDate} in{" "}
              {governingTimeZoneLabel}, then lose it at the start of the next
              day. Saving the duration does not activate access yet.
            </p>
            <div className="action-row">
              <button
                ref={keepEditing}
                className="button secondary"
                type="button"
                disabled={pending}
                onClick={close}
              >
                Keep editing
              </button>
              <button
                className="button primary"
                type="submit"
                disabled={pending}
              >
                {pending ? "Saving…" : "Save expiration date"}
              </button>
            </div>
          </form>
        ) : null}
      </dialog>
    </>
  );
}

// Screen 22. Explicit consent to no fixed expiry, with the recurring review
// stated in text rather than by color alone.
export function DelegationUntilRevokedForm({
  circleId,
  careRecipientId,
  grantId,
  expectedVersion,
  representativeName,
  scopeLabels,
  governingTimeZoneLabel,
}: GrantContext & {
  expectedVersion: number;
  representativeName: string;
  scopeLabels: string[];
  governingTimeZoneLabel: string;
}) {
  const [state, action, pending] = useActionState(
    setDelegationUntilRevoked,
    INITIAL,
  );
  const [key] = useState(() => crypto.randomUUID());
  const [acknowledged, setAcknowledged] = useState(false);
  useContextClearing(() => setAcknowledged(false));

  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="circleId" value={circleId} />
      <input type="hidden" name="careRecipientId" value={careRecipientId} />
      <input type="hidden" name="grantId" value={grantId} />
      <input type="hidden" name="expectedVersion" value={expectedVersion} />
      <input
        type="hidden"
        name="consentVersion"
        value={DELEGATION_CONSENT_VERSIONS.untilRevoked}
      />
      <input type="hidden" name="idempotencyKey" value={key} />
      <ErrorSummary heading="Until revoked unavailable" state={state} />
      <section className="content-card" aria-labelledby="until-revoked-summary">
        <h3 id="until-revoked-summary">What “Until revoked” means</h3>
        <p>
          Representative — {representativeName}. Included scopes —{" "}
          {scopeLabels.join(", ")}.
        </p>
        <ul className="stack-list">
          <li>Warning: there is no fixed end date for this delegation.</li>
          <li>
            A review is scheduled every{" "}
            {DELEGATION_REVIEW_INTERVAL_CALENDAR_DAYS} days in{" "}
            {governingTimeZoneLabel}.
          </li>
          <li>
            A review becoming due does not renew, extend, suspend, revoke, or
            send any message outside Kinward.
          </li>
          <li>You can change, suspend, or revoke this access at any time.</li>
          <li>
            This consent is recorded, revocable, and applies only to this Care
            Recipient. It creates no ownership, legal, or Circle-wide authority.
          </li>
        </ul>
      </section>
      <div className="form-field">
        <label className="content-card" htmlFor="until-revoked-consent">
          <input
            id="until-revoked-consent"
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />
          <strong>
            I understand this delegation has no automatic expiration.
          </strong>
        </label>
      </div>
      <button
        className="button primary"
        type="submit"
        disabled={pending || !acknowledged}
      >
        {pending ? "Recording consent…" : "Confirm until revoked"}
      </button>
      {!acknowledged ? (
        <p role="status">
          Explicit confirmation is required. Nothing is saved until you confirm.
        </p>
      ) : null}
    </form>
  );
}

// Representative acceptance of exactly the delegation version they reviewed.
export function DelegationAcceptanceForm({
  circleId,
  careRecipientId,
  grantId,
  termsFingerprint,
  scopeLabels,
  durationSummary,
}: GrantContext & {
  termsFingerprint: string;
  scopeLabels: string[];
  durationSummary: string;
}) {
  const [state, action, pending] = useActionState(
    acceptDelegationAsRepresentative,
    INITIAL,
  );
  const [key] = useState(() => crypto.randomUUID());
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="circleId" value={circleId} />
      <input type="hidden" name="careRecipientId" value={careRecipientId} />
      <input type="hidden" name="grantId" value={grantId} />
      <input type="hidden" name="termsFingerprint" value={termsFingerprint} />
      <input
        type="hidden"
        name="consentVersion"
        value={DELEGATION_CONSENT_VERSIONS.representativeAcceptance}
      />
      <input type="hidden" name="idempotencyKey" value={key} />
      <ErrorSummary heading="Acceptance unavailable" state={state} />
      <section className="content-card" aria-labelledby="acceptance-summary">
        <h3 id="acceptance-summary">Accept this delegation</h3>
        <p>Included scopes — {scopeLabels.join(", ")}.</p>
        <p>{durationSummary}</p>
        <p>
          Accepting records your agreement to exactly these scopes. It grants no
          ownership, legal authority, or access to another Care Recipient, and
          the owner may suspend or revoke it at any time.
        </p>
      </section>
      <button className="button primary" type="submit" disabled={pending}>
        {pending ? "Recording acceptance…" : "Accept delegation"}
      </button>
    </form>
  );
}

// Owner final activation consent. The interface offers this only when the
// database preconditions are already satisfied.
export function DelegationActivationForm({
  circleId,
  careRecipientId,
  grantId,
  expectedVersion,
  termsFingerprint,
  representativeName,
  careRecipientLabel,
  scopeLabels,
  durationSummary,
}: GrantContext & {
  expectedVersion: number;
  termsFingerprint: string;
  representativeName: string;
  careRecipientLabel: string;
  scopeLabels: string[];
  durationSummary: string;
}) {
  const [state, action, pending] = useActionState(
    activateDelegatedGrant,
    INITIAL,
  );
  const [key] = useState(() => crypto.randomUUID());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const keepEditing = useRef<HTMLButtonElement>(null);

  useContextClearing(() => {
    dialog.current?.close();
    setConfirmOpen(false);
  });
  useEffect(() => {
    if (!confirmOpen) return;
    dialog.current?.showModal();
    keepEditing.current?.focus();
  }, [confirmOpen]);
  const close = () => {
    dialog.current?.close();
    setConfirmOpen(false);
    trigger.current?.focus();
  };

  return (
    <>
      <div className="form-stack">
        <ErrorSummary heading="Activation unavailable" state={state} />
        <button
          ref={trigger}
          className="button primary"
          type="button"
          disabled={pending}
          onClick={() => setConfirmOpen(true)}
        >
          Review and activate delegation
        </button>
      </div>
      <dialog
        ref={dialog}
        className="navigation-dialog"
        aria-labelledby="delegation-activation-confirm"
        onCancel={(event) => {
          event.preventDefault();
          if (!pending) close();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            if (!pending) close();
            return;
          }
          trapDialogFocus(event, dialog.current);
        }}
      >
        {confirmOpen ? (
          <form action={action} className="navigation-sheet">
            <input type="hidden" name="circleId" value={circleId} />
            <input
              type="hidden"
              name="careRecipientId"
              value={careRecipientId}
            />
            <input type="hidden" name="grantId" value={grantId} />
            <input
              type="hidden"
              name="expectedVersion"
              value={expectedVersion}
            />
            <input
              type="hidden"
              name="termsFingerprint"
              value={termsFingerprint}
            />
            <input
              type="hidden"
              name="consentVersion"
              value={DELEGATION_CONSENT_VERSIONS.ownerActivation}
            />
            <input type="hidden" name="idempotencyKey" value={key} />
            <h3 id="delegation-activation-confirm">Activate this delegation</h3>
            <p>
              {representativeName} will act for {careRecipientLabel} within{" "}
              {scopeLabels.join(", ")}. {durationSummary}
            </p>
            <p>
              You remain the sole owner and keep your own access. This is a
              Kinward grant, not legal authority, and you can suspend or revoke
              it at any time.
            </p>
            <div className="action-row">
              <button
                ref={keepEditing}
                className="button secondary"
                type="button"
                disabled={pending}
                onClick={close}
              >
                Keep editing
              </button>
              <button
                className="button primary"
                type="submit"
                disabled={pending}
              >
                {pending ? "Activating…" : "Activate delegation"}
              </button>
            </div>
          </form>
        ) : null}
      </dialog>
    </>
  );
}

// Screen 24. One dominant "Keep access" decision. Access stays active while the
// owner decides, and a cancelled or failed write leaves the due state in place.
export function DelegationAccessReviewForm({
  circleId,
  careRecipientId,
  grantId,
  expectedVersion,
  representativeName,
}: GrantContext & { expectedVersion: number; representativeName: string }) {
  const [state, action, pending] = useActionState(
    completeDelegationAccessReview,
    INITIAL,
  );
  const [key] = useState(() => crypto.randomUUID());
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="circleId" value={circleId} />
      <input type="hidden" name="careRecipientId" value={careRecipientId} />
      <input type="hidden" name="grantId" value={grantId} />
      <input type="hidden" name="expectedVersion" value={expectedVersion} />
      <input type="hidden" name="decision" value="keep_access" />
      <input type="hidden" name="idempotencyKey" value={key} />
      <ErrorSummary heading="Review unavailable" state={state} />
      <p>
        Access remains active while you decide. Viewing this page changes
        nothing. Keeping access schedules the next review{" "}
        {DELEGATION_REVIEW_INTERVAL_CALENDAR_DAYS} days from today.
      </p>
      <button className="button primary" type="submit" disabled={pending}>
        {pending ? "Recording decision…" : "Keep access"}
      </button>
      <p className="context-note">
        Keeping {representativeName}&apos;s access changes no scope and creates
        no new authority.
      </p>
    </form>
  );
}

// Screens 25 and 26. The safe action is first and focused; the consequential
// action is labeled with its outcome in full text.
export function DelegationLifecycleForm({
  circleId,
  careRecipientId,
  grantId,
  expectedVersion,
  operation,
  representativeName,
  consequences,
  cancelHref,
}: GrantContext & {
  expectedVersion: number;
  operation: "suspend" | "restore" | "revoke";
  representativeName: string;
  consequences: string[];
  cancelHref: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    transitionDelegatedGrant,
    INITIAL,
  );
  const [key] = useState(() => crypto.randomUUID());
  const safe = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    safe.current?.focus();
  }, []);
  useContextClearing(() => router.push(cancelHref));

  const labels = {
    suspend: { safe: "Keep access", commit: "Suspend access" },
    restore: { safe: "Leave suspended", commit: "Restore access" },
    revoke: { safe: "Keep access", commit: "Revoke access" },
  }[operation];

  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="circleId" value={circleId} />
      <input type="hidden" name="careRecipientId" value={careRecipientId} />
      <input type="hidden" name="grantId" value={grantId} />
      <input type="hidden" name="expectedVersion" value={expectedVersion} />
      <input type="hidden" name="operation" value={operation} />
      <input type="hidden" name="idempotencyKey" value={key} />
      <ErrorSummary heading={`${labels.commit} unavailable`} state={state} />
      <section
        className="content-card"
        aria-labelledby={`delegation-${operation}-consequences`}
      >
        <h3 id={`delegation-${operation}-consequences`}>
          What {labels.commit.toLowerCase()} does
        </h3>
        <p>Representative — {representativeName}.</p>
        <ul className="stack-list">
          {consequences.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <div className="action-row">
        <button
          ref={safe}
          className="button secondary"
          type="button"
          disabled={pending}
          onClick={() => router.push(cancelHref)}
        >
          {labels.safe}
        </button>
        <button
          className={
            operation === "revoke" ? "button destructive" : "button primary"
          }
          type="submit"
          disabled={pending}
        >
          {pending ? "Saving change…" : labels.commit}
        </button>
      </div>
      {pending ? <p role="status">Saving the delegation change…</p> : null}
    </form>
  );
}
