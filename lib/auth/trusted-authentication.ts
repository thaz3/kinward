import { createSupabaseServerClient } from "@/lib/supabase/server";

export const TRUSTED_AUTHENTICATION_METHODS = [
  "email_verification",
  "email_link",
  "password",
] as const;

export type TrustedAuthenticationMethod =
  (typeof TRUSTED_AUTHENTICATION_METHODS)[number];

// The 15-minute window for consequential delegation changes is measured from a
// server-recorded moment, not from a client token that a refresh could extend.
export async function recordTrustedAuthentication(
  method: TrustedAuthenticationMethod,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const result = await supabase.rpc("record_trusted_authentication", {
    p_authentication_method: method,
  });
  return !result.error;
}
