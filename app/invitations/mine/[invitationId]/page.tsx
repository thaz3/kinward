import { AccountShell } from "@/components/account-shell";
import { InvitationUnavailableState } from "@/components/invitation-decision";
import { MyInvitationDecision } from "@/components/my-invitation-decision";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { invitationIdSchema } from "@/lib/invitations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invitation" };

export default async function MyInvitationPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { invitationId: rawId } = await params;
  const invitationId = invitationIdSchema.safeParse(rawId);
  if (!invitationId.success) {
    return (
      <AccountShell email={account.email}>
        <InvitationUnavailableState state="unavailable" />
      </AccountShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const result = supabase
    ? await supabase.rpc("preview_my_circle_invitation", {
        p_invitation_id: invitationId.data,
      })
    : null;
  const preview =
    result?.data && typeof result.data === "object"
      ? (result.data as Record<string, unknown>)
      : { outcome: "unavailable" };
  const outcome = String(preview.outcome ?? "unavailable");
  if (outcome !== "ready") {
    return (
      <AccountShell email={account.email}>
        <InvitationUnavailableState state={outcome} />
      </AccountShell>
    );
  }

  return (
    <AccountShell email={account.email}>
      <MyInvitationDecision
        invitationId={invitationId.data}
        circleName={String(preview.circle_name)}
        expiresAt={String(preview.expires_at)}
      />
    </AccountShell>
  );
}
