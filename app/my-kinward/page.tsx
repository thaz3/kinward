import { AccountShell } from "@/components/account-shell";
import { ProfileForm } from "@/components/profile-form";
import { CircleList } from "@/components/circle-list";
import { EmptyState, UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import {
  formatInGoverningZone,
  listDelegationReviewsDue,
} from "@/lib/delegated-grants";
import type { UserProfile } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listAuthorizedCircles } from "@/lib/circles";
import Link from "next/link";

export const metadata = { title: "My Kinward" };
export const dynamic = "force-dynamic";

type PendingInvite = {
  invitation_id: string;
  circle_id: string;
  circle_name: string;
  proposed_role: string;
  expires_at: string;
  created_at: string;
};

export default async function MyKinwardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; invitation?: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const query = await searchParams;
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
  const pendingResult = supabase
    ? await supabase.rpc("list_my_pending_invitations")
    : null;
  const pending = (pendingResult?.data ?? []) as PendingInvite[];
  const reviewsDue = await listDelegationReviewsDue();
  return (
    <AccountShell email={account.email}>
      {query.invitation === "declined" && (
        <p role="status" aria-live="polite">
          Invitation declined. No membership was created.
        </p>
      )}
      {query.notice === "unavailable" && (
        <p role="status" aria-live="polite">
          That Circle is unavailable.
        </p>
      )}
      {!profile || result?.error ? (
        <UnavailableState />
      ) : (
        <>
          {reviewsDue.length ? (
            <section
              className="content-card"
              aria-labelledby="access-review-due-heading"
            >
              <h2 id="access-review-due-heading">Access review due</h2>
              <p>
                Access is not changed automatically. Nothing happens until you
                make a decision.
              </p>
              <ul className="stack-list">
                {reviewsDue.map((review) => (
                  <li key={review.grantId}>
                    <strong>
                      {review.careRecipientLabel} · {review.representativeName}{" "}
                      access
                    </strong>
                    <span>
                      Review due{" "}
                      {formatInGoverningZone(
                        review.nextReviewAt,
                        review.governingTimeZone,
                      ) ?? "now"}
                      .
                    </span>
                    <Link
                      className="button primary"
                      href={`/circles/${review.circleId}/care-recipients/${review.careRecipientId}/management/delegated/${review.grantId}/review`}
                    >
                      Review access
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
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
                message="Create a Family Circle or accept an invitation bound to your verified email."
                action={{ href: "/circles/new", label: "Create Circle" }}
              />
            )}
          </section>
          <section aria-labelledby="pending-invites-heading">
            <h2 id="pending-invites-heading">Pending invitations</h2>
            {pendingResult?.error ? (
              <UnavailableState />
            ) : pending.length === 0 ? (
              <p>You have no pending invitations for this verified email.</p>
            ) : (
              <ul className="stack-list">
                {pending.map((invite) => (
                  <li key={invite.invitation_id}>
                    <Link
                      className="content-card link-card"
                      href={`/invitations/mine/${invite.invitation_id}`}
                    >
                      <span className="visually-hidden">
                        Review invitation to{" "}
                      </span>
                      {invite.circle_name}
                      <span className="status-copy">
                        {" "}
                        · Family Coordinator · expires{" "}
                        {new Date(invite.expires_at).toLocaleDateString(
                          "en-US",
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
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
