import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account-shell";
import {
  OwnershipDecision,
  OwnershipUnavailableState,
} from "@/components/ownership-decision";
import { PublicShell } from "@/components/public-shell";
import { LoadingState } from "@/components/system-states";
import { getAuthenticatedAdult } from "@/lib/auth/session";
import { ownershipTokenSchema } from "@/lib/care-recipients";
import { resolveOwnershipPreview } from "@/app/actions/care-recipients";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Care Recipient ownership",
  referrer: "no-referrer" as const,
};

export default async function AcceptOwnershipPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token: rawToken } = await params;
  const query = await searchParams;
  const token = ownershipTokenSchema.safeParse(decodeURIComponent(rawToken));
  if (!token.success) {
    return (
      <PublicShell>
        <OwnershipUnavailableState />
      </PublicShell>
    );
  }

  const account = await getAuthenticatedAdult();
  if (!account) {
    redirect(
      `/sign-in?reason=ownership&next=${encodeURIComponent(
        `/ownership/accept/${token.data}`,
      )}`,
    );
  }

  await headers();

  const preview = await resolveOwnershipPreview(token.data);
  const outcome = String(preview.outcome ?? "unavailable");
  if (outcome !== "ready") {
    return (
      <AccountShell email={account.email} title="Care Recipient ownership">
        <OwnershipUnavailableState />
      </AccountShell>
    );
  }

  if (
    typeof preview.proposer_label !== "string" ||
    typeof preview.display_label !== "string" ||
    typeof preview.circle_name !== "string" ||
    typeof preview.expires_at !== "string"
  ) {
    return (
      <AccountShell email={account.email} title="Care Recipient ownership">
        <LoadingState label="Checking ownership invitation…" />
      </AccountShell>
    );
  }

  return (
    <AccountShell email={account.email} title="Care Recipient ownership">
      <OwnershipDecision
        token={token.data}
        proposerLabel={preview.proposer_label}
        displayLabel={preview.display_label}
        circleName={preview.circle_name}
        expiresAt={preview.expires_at}
        error={query.error}
      />
    </AccountShell>
  );
}
