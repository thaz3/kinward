"use client";

import { useActionState, useEffect, useRef } from "react";
import { requestEmailCode, type AuthActionState } from "@/app/actions/auth";

const INITIAL_AUTH_STATE: AuthActionState = { status: "idle" };

export function SignInForm({ nextPath }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(
    requestEmailCode,
    INITIAL_AUTH_STATE,
  );
  const summaryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === "error") summaryRef.current?.focus();
  }, [state]);
  const emailError = state.fieldErrors?.email;
  return (
    <form action={action} className="form-stack" noValidate>
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      {state.status === "error" && (
        <div
          ref={summaryRef}
          className="error-summary"
          role="alert"
          tabIndex={-1}
        >
          <h2>Check the highlighted fields</h2>
          <p>{state.message}</p>
          {emailError && <a href="#email">Email — {emailError}</a>}
        </div>
      )}
      <div className="field-group">
        <label htmlFor="email">Verified email address</label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : "email-help"}
        />
        <p id="email-help" className="supporting-text">
          Use an adult email address you control.
        </p>
        {emailError && (
          <p id="email-error" className="field-error">
            Error: {emailError}
          </p>
        )}
      </div>
      <button className="button primary" type="submit" disabled={pending}>
        {pending ? "Sending code…" : "Continue with email"}
      </button>
    </form>
  );
}
