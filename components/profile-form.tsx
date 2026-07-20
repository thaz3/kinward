"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  type ProfileActionState,
  updateOwnProfile,
} from "@/app/actions/profile";
import type { UserProfile } from "@/lib/profile";

const INITIAL_PROFILE_STATE: ProfileActionState = { status: "idle" };

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const [state, action, pending] = useActionState(
    updateOwnProfile,
    INITIAL_PROFILE_STATE,
  );
  const statusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status !== "idle") statusRef.current?.focus();
  }, [state]);
  return (
    <form action={action} className="form-stack" noValidate>
      {state.status !== "idle" && (
        <div
          ref={statusRef}
          className={
            state.status === "error" ? "error-summary" : "success-summary"
          }
          role={state.status === "error" ? "alert" : "status"}
          tabIndex={-1}
        >
          <h3>
            {state.status === "error"
              ? "Profile needs attention"
              : "Profile saved"}
          </h3>
          <p>{state.message}</p>
        </div>
      )}
      <div className="field-group">
        <label htmlFor="preferredDisplayName">Preferred display name</label>
        <input
          id="preferredDisplayName"
          name="preferredDisplayName"
          defaultValue={profile.preferred_display_name}
          maxLength={80}
          required
        />
      </div>
      <div className="field-group">
        <label htmlFor="locale">Language and locale</label>
        <select id="locale" name="locale" defaultValue={profile.locale}>
          <option value="en-US">English (United States)</option>
          <option value="en">English</option>
        </select>
      </div>
      <div className="field-group">
        <label htmlFor="timeZone">Time zone</label>
        <input
          id="timeZone"
          name="timeZone"
          defaultValue={profile.time_zone}
          autoComplete="off"
          required
        />
        <p className="supporting-text">
          Use an IANA time zone such as America/New_York.
        </p>
      </div>
      <fieldset>
        <legend>Accessibility preferences</legend>
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="prefersReducedMotion"
            defaultChecked={profile.accessibility_preferences.reduced_motion}
          />{" "}
          Reduce motion
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="prefersHighContrast"
            defaultChecked={profile.accessibility_preferences.high_contrast}
          />{" "}
          Prefer higher contrast
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="prefersLargerText"
            defaultChecked={profile.accessibility_preferences.larger_text}
          />{" "}
          Prefer larger text
        </label>
      </fieldset>
      <button className="button primary" type="submit" disabled={pending}>
        {pending ? "Saving profile…" : "Save profile"}
      </button>
    </form>
  );
}
