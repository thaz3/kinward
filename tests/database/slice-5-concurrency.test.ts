import { beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  generateInvitationToken,
  sql,
  type SyntheticUser,
} from "./helpers";

const CONSENT = "kinward.ownership.v1";

let head: SyntheticUser;
let circleId: string;

beforeAll(async () => {
  head = await createSyntheticUser("cr-conc-head");
  const created = await createCircle(head.client, "CR Concurrency Circle");
  if (created.error) throw created.error;
  circleId = created.data as string;
});

function outcomeOf(result: { data: unknown }) {
  return (result.data as { outcome?: string } | null)?.outcome;
}

describe("Slice 5 proposal concurrency", () => {
  it("creates exactly one recipient for concurrent identical idempotency keys", async () => {
    const target = await createSyntheticUser("cr-conc-prop-same");
    const label = `Conc Same Key ${crypto.randomUUID().slice(0, 8)}`;
    const key = crypto.randomUUID();
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        head.client.rpc("propose_care_recipient", {
          p_circle_id: circleId,
          p_display_label: label,
          p_invited_email: target.email,
          p_token_digest: generateInvitationToken().digest,
          p_idempotency_key: key,
        }),
      ),
    );
    expect(results.every((r) => !r.error)).toBe(true);
    const recipientIds = new Set(
      results.map(
        (r) => (r.data as { care_recipient_id: string }).care_recipient_id,
      ),
    );
    expect(recipientIds.size).toBe(1);
    const rows = await sql<{ recipients: number; pending: number }[]>`
      select
        (select count(*)::int from public.care_recipients
          where circle_id = ${circleId} and display_label = ${label}) recipients,
        (select count(*)::int from public.care_recipient_ownership_invitations inv
          join public.care_recipients r on r.id = inv.care_recipient_id
          where r.circle_id = ${circleId} and r.display_label = ${label}
            and inv.status = 'pending') pending`;
    expect(rows[0]).toEqual({ recipients: 1, pending: 1 });
  });

  it("treats concurrent distinct-key proposals of the same label+email as independent recipients", async () => {
    // Documented behavior: a display label may legitimately name several distinct
    // recipients, so uniqueness is scoped per recipient. Distinct idempotency keys
    // therefore create distinct recipients, each with exactly one pending invitation.
    const target = await createSyntheticUser("cr-conc-prop-distinct");
    const label = `Conc Distinct Key ${crypto.randomUUID().slice(0, 8)}`;
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        head.client.rpc("propose_care_recipient", {
          p_circle_id: circleId,
          p_display_label: label,
          p_invited_email: target.email,
          p_token_digest: generateInvitationToken().digest,
          p_idempotency_key: crypto.randomUUID(),
        }),
      ),
    );
    expect(results.every((r) => !r.error)).toBe(true);
    const created = results.filter(
      (r) => (r.data as { created: boolean }).created,
    ).length;
    const rows = await sql<{ recipients: number; pending: number }[]>`
      select
        (select count(*)::int from public.care_recipients
          where circle_id = ${circleId} and display_label = ${label}) recipients,
        (select count(*)::int from public.care_recipient_ownership_invitations inv
          join public.care_recipients r on r.id = inv.care_recipient_id
          where r.circle_id = ${circleId} and r.display_label = ${label}
            and inv.status = 'pending') pending`;
    expect(rows[0].recipients).toBe(created);
    // One pending invitation per proposed recipient (per-recipient uniqueness).
    expect(rows[0].pending).toBe(rows[0].recipients);
  });
});

describe("Slice 5 acceptance concurrency", () => {
  it("yields exactly one owner and one activation under concurrent accepts of one token", async () => {
    const owner = await createSyntheticUser("cr-conc-accept");
    const token = generateInvitationToken();
    const created = await head.client.rpc("propose_care_recipient", {
      p_circle_id: circleId,
      p_display_label: `Conc Accept ${crypto.randomUUID().slice(0, 8)}`,
      p_invited_email: owner.email,
      p_token_digest: token.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    const recipientId = (created.data as { care_recipient_id: string })
      .care_recipient_id;
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        owner.client.rpc("accept_ownership_invitation", {
          p_token_digest: token.digest,
          p_consent_version: CONSENT,
          p_idempotency_key: crypto.randomUUID(),
        }),
      ),
    );
    expect(
      results.filter((r) => outcomeOf(r) === "accepted").length,
    ).toBeGreaterThanOrEqual(1);
    const rows = await sql<
      {
        status: string;
        owner_user_id: string | null;
        acceptances: number;
        consents: number;
        memberships: number;
      }[]
    >`
      select r.status, r.owner_user_id,
        (select count(*)::int from public.ownership_acceptance_records
          where care_recipient_id = r.id) acceptances,
        (select count(*)::int from public.consent_records
          where care_recipient_id = r.id and decision = 'accepted') consents,
        (select count(*)::int from public.circle_memberships
          where circle_id = ${circleId} and user_id = ${owner.id} and status = 'active') memberships
      from public.care_recipients r where r.id = ${recipientId}`;
    expect(rows[0]).toEqual({
      status: "active",
      owner_user_id: owner.id,
      acceptances: 1,
      consents: 1,
      memberships: 1,
    });
  });

  it("lets only the invited account win when two accounts race the same token", async () => {
    const owner = await createSyntheticUser("cr-conc-race-owner");
    const intruder = await createSyntheticUser("cr-conc-race-intruder");
    const token = generateInvitationToken();
    const created = await head.client.rpc("propose_care_recipient", {
      p_circle_id: circleId,
      p_display_label: `Conc Race ${crypto.randomUUID().slice(0, 8)}`,
      p_invited_email: owner.email,
      p_token_digest: token.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    const recipientId = (created.data as { care_recipient_id: string })
      .care_recipient_id;
    const [ownerResult, intruderResult] = await Promise.all([
      owner.client.rpc("accept_ownership_invitation", {
        p_token_digest: token.digest,
        p_consent_version: CONSENT,
        p_idempotency_key: crypto.randomUUID(),
      }),
      intruder.client.rpc("accept_ownership_invitation", {
        p_token_digest: token.digest,
        p_consent_version: CONSENT,
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(outcomeOf(ownerResult)).toBe("accepted");
    expect(outcomeOf(intruderResult)).toBe("unavailable");
    const rows = await sql<{ owner_user_id: string | null }[]>`
      select owner_user_id from public.care_recipients where id = ${recipientId}`;
    expect(rows[0].owner_user_id).toBe(owner.id);
  });

  it("reaches a deterministic terminal state when accept races cancel", async () => {
    const owner = await createSyntheticUser("cr-conc-accept-cancel");
    const token = generateInvitationToken();
    const created = await head.client.rpc("propose_care_recipient", {
      p_circle_id: circleId,
      p_display_label: `Conc Cancel ${crypto.randomUUID().slice(0, 8)}`,
      p_invited_email: owner.email,
      p_token_digest: token.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    const recipientId = (created.data as { care_recipient_id: string })
      .care_recipient_id;
    const [acceptResult, cancelResult] = await Promise.all([
      owner.client.rpc("accept_ownership_invitation", {
        p_token_digest: token.digest,
        p_consent_version: CONSENT,
        p_idempotency_key: crypto.randomUUID(),
      }),
      head.client.rpc("cancel_ownership_proposal", {
        p_care_recipient_id: recipientId,
      }),
    ]);
    const accepted = outcomeOf(acceptResult) === "accepted";
    const rows = await sql<
      { status: string; owner_user_id: string | null }[]
    >`select status, owner_user_id from public.care_recipients where id = ${recipientId}`;
    if (accepted) {
      expect(rows[0]).toEqual({ status: "active", owner_user_id: owner.id });
    } else {
      // Cancel won the race: the shell is archived with no owner and no partial ownership.
      expect(rows[0]).toEqual({ status: "archived", owner_user_id: null });
      expect(cancelResult.error).toBeNull();
    }
  });

  it("activates Dad and Mom independently under concurrent acceptance", async () => {
    const dadUser = await createSyntheticUser("cr-conc-dad");
    const momUser = await createSyntheticUser("cr-conc-mom");
    const dadToken = generateInvitationToken();
    const momToken = generateInvitationToken();
    const dad = await head.client.rpc("propose_care_recipient", {
      p_circle_id: circleId,
      p_display_label: `Conc Dad ${crypto.randomUUID().slice(0, 8)}`,
      p_invited_email: dadUser.email,
      p_token_digest: dadToken.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    const mom = await head.client.rpc("propose_care_recipient", {
      p_circle_id: circleId,
      p_display_label: `Conc Mom ${crypto.randomUUID().slice(0, 8)}`,
      p_invited_email: momUser.email,
      p_token_digest: momToken.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    const dadId = (dad.data as { care_recipient_id: string }).care_recipient_id;
    const momId = (mom.data as { care_recipient_id: string }).care_recipient_id;
    const [dadResult, momResult] = await Promise.all([
      dadUser.client.rpc("accept_ownership_invitation", {
        p_token_digest: dadToken.digest,
        p_consent_version: CONSENT,
        p_idempotency_key: crypto.randomUUID(),
      }),
      momUser.client.rpc("accept_ownership_invitation", {
        p_token_digest: momToken.digest,
        p_consent_version: CONSENT,
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(outcomeOf(dadResult)).toBe("accepted");
    expect(outcomeOf(momResult)).toBe("accepted");
    const rows = await sql<
      { id: string; owner_user_id: string | null; status: string }[]
    >`select id, owner_user_id, status from public.care_recipients
      where id in (${dadId}, ${momId}) order by id`;
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(byId[dadId]).toMatchObject({
      status: "active",
      owner_user_id: dadUser.id,
    });
    expect(byId[momId]).toMatchObject({
      status: "active",
      owner_user_id: momUser.id,
    });
  });
});
