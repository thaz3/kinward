import { AccountShell } from "@/components/account-shell";
import { ProfileForm } from "@/components/profile-form";
import { CircleList } from "@/components/circle-list";
import { EmptyState, UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import type { UserProfile } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listAuthorizedCircles } from "@/lib/circles";
import Link from "next/link";

export const metadata = { title: "My Kinward" };
export const dynamic = "force-dynamic";

export default async function MyKinwardPage() {
  const account = await requireAuthenticatedAdult();
  const supabase = await createSupabaseServerClient();
  const result = supabase
    ? await supabase
        .from("user_profiles")
        .select(
          "user_id, preferred_display_name, locale, time_zone, accessibility_preferences, account_status, version",
        )
        .eq("user_id", account.userId)
        .maybeSingle()
    : null;
  const profile = result?.data as UserProfile | null | undefined;
  const circles = await listAuthorizedCircles(account.userId);
  return (
    <AccountShell email={account.email}>
      {!profile || result?.error ? (
        <UnavailableState />
      ) : (
        <>
          <section aria-labelledby="circles-heading">
            <h2 id="circles-heading">Your Family Circles</h2>
            {circles === null ? (
              <UnavailableState />
            ) : circles.length ? (
              <>
                <CircleList circles={circles} />
                <p>
                  <Link className="button primary" href="/circles/new">
                    Create another Circle
                  </Link>
                </p>
              </>
            ) : (
              <EmptyState
                heading="You are not in a Circle yet"
                message="Signing in does not create Circle access. Create a Family Circle to begin."
                action={{ href: "/circles/new", label: "Create Circle" }}
              />
            )}
          </section>
          <section
            className="content-card"
            aria-labelledby="account-profile-heading"
          >
            <h2 id="account-profile-heading">Account profile</h2>
            <p>These settings belong only to your adult account.</p>
            <ProfileForm profile={profile} />
          </section>
        </>
      )}
    </AccountShell>
  );
}
