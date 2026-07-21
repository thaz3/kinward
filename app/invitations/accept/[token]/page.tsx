import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account-shell";
import {
  InvitationDecision,
  InvitationUnavailableState,
} from "@/components/invitation-decision";
import { PublicShell } from "@/components/public-shell";
import { LoadingState } from "@/components/system-states";
import { getAuthenticatedAdult } from "@/lib/auth/session";
import { invitationTokenSchema } from "@/lib/invitations";
import { resolveInvitationPreview } from "@/app/actions/invitations";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Invitation",
  referrer: "no-referrer" as const,
};

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: rawToken } = await params;
  const token = invitationTokenSchema.safeParse(decodeURIComponent(rawToken));
  if (!token.success) {
    return (
      <PublicShell>
        <InvitationUnavailableState state="unavailable" />
      </PublicShell>
    );
  }

  const account = await getAuthenticatedAdult();
  if (!account) {
    redirect(
      `/sign-in?reason=invitation&next=${encodeURIComponent(
        `/invitations/accept/${token.data}`,
      )}`,
    );
  }

  await headers();

  const preview = await resolveInvitationPreview(token.data);
  const outcome = String(preview.outcome ?? "unavailable");
  if (outcome !== "ready") {
    return (
      <AccountShell email={account.email} title="Invitation">
        <InvitationUnavailableState state={outcome} />
      </AccountShell>
    );
  }

  if (
    typeof preview.circle_name !== "string" ||
    typeof preview.expires_at !== "string"
  ) {
    return (
      <AccountShell email={account.email} title="Invitation">
        <LoadingState label="Checking invitation…" />
      </AccountShell>
    );
  }

  return (
    <AccountShell email={account.email} title="Invitation">
      <InvitationDecision
        token={token.data}
        circleName={preview.circle_name}
        expiresAt={preview.expires_at}
      />
    </AccountShell>
  );
}
