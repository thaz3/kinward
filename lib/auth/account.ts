import type { User } from "@supabase/supabase-js";

export type AuthenticatedAdult = Readonly<{
  userId: string;
  email: string;
  verifiedAt: string;
  authority: readonly [];
}>;

export function toAuthenticatedAdult(
  user: User | null,
): AuthenticatedAdult | null {
  if (!user?.id || !user.email || !user.email_confirmed_at) return null;
  return {
    userId: user.id,
    email: user.email,
    verifiedAt: user.email_confirmed_at,
    authority: [],
  };
}

export function ownAccountCapabilities(account: AuthenticatedAdult) {
  return {
    userId: account.userId,
    permissions: ["account.profile.read", "account.profile.update"] as const,
  };
}

export function managedMinorCanAuthenticate(): false {
  return false;
}

export function supportHasFamilyBypass(): false {
  return false;
}
