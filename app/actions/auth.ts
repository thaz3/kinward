"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  openPendingEmail,
  PENDING_EMAIL_COOKIE,
  PENDING_EMAIL_MAX_AGE_SECONDS,
  sealPendingEmail,
} from "@/lib/auth/pending-email";
import {
  createAuthSecurityLog,
  safeActorReference,
  writeAuthSecurityLog,
} from "@/lib/auth/security-log";
import { safeAuthRedirect } from "@/lib/auth/redirects";
import { toAuthenticatedAdult } from "@/lib/auth/account";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionState = Readonly<{
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Readonly<Record<string, string>>;
}>;
const emailSchema = z
  .email()
  .max(254)
  .transform((email) => email.toLowerCase());
const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/);

function genericUnavailable(): AuthActionState {
  return {
    status: "error",
    message:
      "We couldn’t complete this request. Check your information and try again.",
  };
}

export async function requestEmailCode(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success)
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { email: "Enter a valid email address." },
    };
  const supabase = await createSupabaseServerClient();
  const sealedEmail = sealPendingEmail(parsed.data);
  if (!supabase || !sealedEmail) return genericUnavailable();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: true },
  });
  if (error) {
    writeAuthSecurityLog(
      createAuthSecurityLog({ event: "auth.failed", result: "denied" }),
    );
    return genericUnavailable();
  }
  (await cookies()).set(PENDING_EMAIL_COOKIE, sealedEmail, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PENDING_EMAIL_MAX_AGE_SECONDS,
  });
  writeAuthSecurityLog(
    createAuthSecurityLog({ event: "auth.requested", result: "success" }),
  );
  redirect("/verify");
}

export async function verifyEmailCode(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = codeSchema.safeParse(formData.get("code"));
  if (!parsed.success)
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { code: "Enter the six-digit code from your email." },
    };
  const cookieStore = await cookies();
  const email = openPendingEmail(cookieStore.get(PENDING_EMAIL_COOKIE)?.value);
  const supabase = await createSupabaseServerClient();
  if (!email || !supabase) return genericUnavailable();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: parsed.data,
    type: "email",
  });
  const adult = toAuthenticatedAdult(data.user);
  if (error || !adult) {
    writeAuthSecurityLog(
      createAuthSecurityLog({ event: "auth.failed", result: "denied" }),
    );
    return {
      status: "error",
      message:
        "That code is invalid or has expired. Request a new code and try again.",
    };
  }
  cookieStore.delete(PENDING_EMAIL_COOKIE);
  writeAuthSecurityLog(
    createAuthSecurityLog({
      event: "auth.verified",
      result: "success",
      actorReference: safeActorReference(adult.userId),
    }),
  );
  redirect(safeAuthRedirect(formData.get("next")?.toString()));
}

export async function resendEmailCode(): Promise<AuthActionState> {
  const cookieStore = await cookies();
  const email = openPendingEmail(cookieStore.get(PENDING_EMAIL_COOKIE)?.value);
  const supabase = await createSupabaseServerClient();
  if (!email || !supabase) return genericUnavailable();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) return genericUnavailable();
  return {
    status: "success",
    message: "If the address can receive a code, a new message is on its way.",
  };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    await supabase.auth.signOut({ scope: "local" });
    writeAuthSecurityLog(
      createAuthSecurityLog({
        event: "auth.signed_out",
        result: "success",
        actorReference: data.user?.id
          ? safeActorReference(data.user.id)
          : undefined,
      }),
    );
  }
  (await cookies()).delete(PENDING_EMAIL_COOKIE);
  redirect("/sign-in?signedOut=1");
}
