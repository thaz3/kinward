import { AccountShell } from "@/components/account-shell";
import { CircleCreationForm } from "@/components/circle-creation-form";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { randomUUID } from "node:crypto";

export const metadata = { title: "Create a Family Circle" };
export const dynamic = "force-dynamic";
export default async function NewCirclePage() {
  const account = await requireAuthenticatedAdult();
  return (
    <AccountShell email={account.email} title="Create a Family Circle">
      <p className="context-label">New Circle · Not created</p>
      <section className="content-card">
        <CircleCreationForm idempotencyKey={randomUUID()} />
      </section>
      <p className="supporting-text">
        Use synthetic information only. No Circle exists unless creation
        succeeds.
      </p>
    </AccountShell>
  );
}
