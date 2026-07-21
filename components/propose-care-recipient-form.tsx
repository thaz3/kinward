"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  proposeCareRecipient,
  type CareRecipientActionState,
} from "@/app/actions/care-recipients";
import { OWNERSHIP_CONSEQUENCE_COPY } from "@/lib/care-recipients";

const initialState: CareRecipientActionState = { status: "idle" };

type ProposalMode = "self_add" | "propose_other";

export function ProposeCareRecipientForm({
  circleId,
  circleName,
  idempotencyKey,
  proposerEmail,
}: {
  circleId: string;
  circleName: string;
  idempotencyKey: string;
  proposerEmail: string;
}) {
  const [state, action, pending] = useActionState(
    proposeCareRecipient,
    initialState,
  );
  const [mode, setMode] = useState<ProposalMode>("propose_other");
  const error = useRef<HTMLDivElement>(null);
  const legend = useRef<HTMLLegendElement>(null);

  useEffect(() => {
    if (state.status === "error") error.current?.focus();
  }, [state]);
  useEffect(() => {
    legend.current?.focus();
  }, []);

  const isSelfAdd = mode === "self_add";

  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="circleId" value={circleId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      {state.status === "error" && (
        <div className="error-summary" role="alert" tabIndex={-1} ref={error}>
          <h2>{state.message}</h2>
          <p>
            Your entry is still here. No proposed owner or recipient existence
            is confirmed.
          </p>
        </div>
      )}

      <fieldset className="role-group">
        <legend ref={legend} tabIndex={-1}>
          Who is this Care Recipient?
        </legend>
        <div className="radio-card-list">
          <label className="radio-card">
            <input
              type="radio"
              name="proposalMode"
              value="propose_other"
              checked={mode === "propose_other"}
              onChange={() => setMode("propose_other")}
            />
            <span>
              <strong>Propose another adult</strong>
              <span className="radio-card-help">
                Send a dedicated ownership invitation. The proposed adult
                becomes the sole owner only after they accept.
              </span>
            </span>
          </label>
          <label className="radio-card">
            <input
              type="radio"
              name="proposalMode"
              value="self_add"
              checked={mode === "self_add"}
              onChange={() => setMode("self_add")}
            />
            <span>
              <strong>Add myself</strong>
              <span className="radio-card-help">
                You ({proposerEmail}) become the sole owner of this Care
                Recipient profile.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="field-group">
        <label htmlFor="display-label">Display label</label>
        <input
          id="display-label"
          name="displayLabel"
          type="text"
          required
          minLength={2}
          maxLength={60}
          aria-invalid={Boolean(state.fieldError)}
          aria-describedby={
            state.fieldError
              ? "proposal-field-error display-label-help"
              : "display-label-help"
          }
        />
        <p id="display-label-help">
          A short, non-medical label such as “Dad” that helps you recognize this
          proposal.
        </p>
      </div>

      {!isSelfAdd && (
        <div className="field-group">
          <label htmlFor="owner-email">Owner verified email address</label>
          <input
            id="owner-email"
            name="ownerEmail"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            aria-invalid={Boolean(state.fieldError)}
            aria-describedby={
              state.fieldError
                ? "proposal-field-error owner-email-help"
                : "owner-email-help"
            }
          />
          <p id="owner-email-help">
            Use a synthetic example.test or example.com address. No access
            begins before this verified-email adult accepts.
          </p>
        </div>
      )}

      {state.fieldError && (
        <p className="field-error" id="proposal-field-error">
          {state.fieldError}
        </p>
      )}

      {isSelfAdd && (
        <div className="field-group">
          <section
            className="neutral-alert"
            aria-labelledby="self-add-consequences"
          >
            <h3 id="self-add-consequences">If you become the sole owner</h3>
            <ul>
              {OWNERSHIP_CONSEQUENCE_COPY.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <label className="choice-card">
            <input
              type="checkbox"
              name="ownershipConsent"
              value="accepted"
              required
            />
            <span>
              <strong>
                I understand I become the sole owner of this Care Recipient
                profile.
              </strong>
              <span className="choice-help">
                The Circle Head does not remain an owner. Family relationship
                and Circle administration grant no ownership on their own.
              </span>
            </span>
          </label>
        </div>
      )}

      <section className="neutral-alert" aria-labelledby="no-private-info">
        <h3 id="no-private-info">No private information yet</h3>
        <p>
          No private Care Recipient information may be entered before the owner
          accepts. No medical information is collected in this step.
        </p>
      </section>

      {pending && (
        <p className="status-copy" role="status" aria-live="polite">
          Checking proposal eligibility…
        </p>
      )}

      <button className="button primary" type="submit" disabled={pending}>
        {isSelfAdd ? "Become sole owner" : "Send ownership invitation"}
      </button>
      <Link className="button secondary" href={`/circles/${circleId}`}>
        Cancel
      </Link>

      <p className="status-copy">
        {isSelfAdd
          ? `You will become the sole owner within ${circleName}.`
          : `An ownership invitation for ${circleName} will be sent once you continue.`}
      </p>
    </form>
  );
}
