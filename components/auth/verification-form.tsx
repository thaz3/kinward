"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import {
  resendEmailCode,
  type AuthActionState,
  verifyEmailCode,
} from "@/app/actions/auth";

const INITIAL_AUTH_STATE: AuthActionState = { status: "idle" };

export function VerificationForm({
  maskedEmail,
  nextPath,
}: {
  maskedEmail: string;
  nextPath?: string;
}) {
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyEmailCode,
    INITIAL_AUTH_STATE,
  );
  const [resendState, resendAction, resending] = useActionState(
    resendEmailCode,
    INITIAL_AUTH_STATE,
  );
  const summaryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (verifyState.status === "error") summaryRef.current?.focus();
  }, [verifyState]);
  const codeError = verifyState.fieldErrors?.code;
  return (
    <>
      <p>
        We sent a six-digit code to <strong>{maskedEmail}</strong>.
      </p>
      {verifyState.status === "error" && (
        <div
          ref={summaryRef}
          className="error-summary"
          role="alert"
          tabIndex={-1}
        >
          <h2>Verification needs attention</h2>
          <p>{verifyState.message}</p>
        </div>
      )}
      <form action={verifyAction} className="form-stack" noValidate>
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
        <div className="field-group">
          <label htmlFor="code">Verification code</label>
          <input
            id="code"
            name="code"
            className="code-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            aria-invalid={codeError ? true : undefined}
            aria-describedby={codeError ? "code-error" : "code-help"}
          />
          <p id="code-help" className="supporting-text">
            Enter all six digits. There is no countdown.
          </p>
          {codeError && (
            <p id="code-error" className="field-error">
              Error: {codeError}
            </p>
          )}
        </div>
        <p className="status-copy" role="status">
          Waiting for verification
        </p>
        <button className="button primary" type="submit" disabled={verifying}>
          {verifying ? "Checking verification…" : "Verify email"}
        </button>
      </form>
      <form action={resendAction} className="secondary-form">
        <button className="button secondary" type="submit" disabled={resending}>
          {resending ? "Requesting code…" : "Resend code"}
        </button>
        {resendState.message && (
          <p role="status" aria-live="polite">
            {resendState.message}
          </p>
        )}
      </form>
      <Link className="button text-button" href="/sign-in">
        Change email
      </Link>
    </>
  );
}
