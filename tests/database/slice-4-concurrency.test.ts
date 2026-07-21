import { beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  generateInvitationToken,
  sql,
  type SyntheticUser,
} from "./helpers";

let head: SyntheticUser;
let circleId: string;

beforeAll(async () => {
  head = await createSyntheticUser("inv-conc-head");
  const created = await createCircle(head.client, "Invite Concurrency Circle");
  if (created.error) throw created.error;
  circleId = created.data as string;
});

describe("Slice 4 invitation concurrency", () => {
  it("creates one pending invitation for concurrent identical requests", async () => {
    const email = `conc-create-${crypto.randomUUID()}@example.test`;
    await Promise.all(
      Array.from({ length: 8 }, () => {
        const token = generateInvitationToken();
        return head.client.rpc("create_circle_invitation", {
          p_circle_id: circleId,
          p_invited_email: email,
          p_token_digest: token.digest,
          p_idempotency_key: crypto.randomUUID(),
        });
      }),
    );
    const digest = (
      await sql<{ d: string }[]>`select public.kinward_email_digest(${email}) d`
    )[0].d;
    const pending = await sql<{ count: number }[]>`
      select count(*)::int as count from public.circle_invitations
      where circle_id = ${circleId} and invited_email_digest = ${digest} and status = 'pending'`;
    expect(pending[0].count).toBe(1);
  });

  it("accepts once under concurrent acceptance attempts", async () => {
    const invitee = await createSyntheticUser("inv-conc-accept");
    const token = generateInvitationToken();
    const created = await head.client.rpc("create_circle_invitation", {
      p_circle_id: circleId,
      p_invited_email: invitee.email,
      p_token_digest: token.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(created.error).toBeNull();
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        invitee.client.rpc("accept_circle_invitation", {
          p_token_digest: token.digest,
        }),
      ),
    );
    const accepted = results.filter(
      (result) =>
        !result.error &&
        (result.data as { outcome?: string } | null)?.outcome === "accepted",
    );
    expect(accepted.length).toBeGreaterThanOrEqual(1);
    const memberships = await sql<{ count: number }[]>`
      select count(*)::int as count from public.circle_memberships
      where circle_id = ${circleId} and user_id = ${invitee.id} and status = 'active'`;
    expect(memberships[0].count).toBe(1);
    const roles = await sql<{ count: number }[]>`
      select count(*)::int as count from public.circle_role_assignments r
      join public.circle_memberships m on m.id = r.membership_id
      where m.circle_id = ${circleId} and m.user_id = ${invitee.id}
        and r.role_code = 'family_coordinator' and r.status = 'active'`;
    expect(roles[0].count).toBe(1);
  });

  it("makes acceptance versus cancellation deterministic", async () => {
    const invitee = await createSyntheticUser("inv-conc-race");
    const token = generateInvitationToken();
    const created = await head.client.rpc("create_circle_invitation", {
      p_circle_id: circleId,
      p_invited_email: invitee.email,
      p_token_digest: token.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    const invitationId = (created.data as { invitation_id: string })
      .invitation_id;
    const [acceptResult, cancelResult] = await Promise.all([
      invitee.client.rpc("accept_circle_invitation", {
        p_token_digest: token.digest,
      }),
      head.client.rpc("cancel_circle_invitation", {
        p_invitation_id: invitationId,
      }),
    ]);
    const accepted =
      !acceptResult.error &&
      (acceptResult.data as { outcome?: string } | null)?.outcome ===
        "accepted";
    const cancelled = !cancelResult.error;
    expect(accepted || cancelled).toBe(true);
    const memberships = await sql<{ count: number }[]>`
      select count(*)::int as count from public.circle_memberships
      where circle_id = ${circleId} and user_id = ${invitee.id} and status = 'active'`;
    const status = await sql<{ status: string }[]>`
      select status from public.circle_invitations where id = ${invitationId}`;
    if (accepted) {
      expect(memberships[0].count).toBe(1);
      expect(status[0].status).toBe("accepted");
    } else {
      expect(memberships[0].count).toBe(0);
      expect(status[0].status).toBe("cancelled");
    }
  });

  it("invalidates the prior token on resend", async () => {
    const invitee = await createSyntheticUser("inv-resend-match");
    const firstToken = generateInvitationToken();
    const created = await head.client.rpc("create_circle_invitation", {
      p_circle_id: circleId,
      p_invited_email: invitee.email,
      p_token_digest: firstToken.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    const invitationId = (created.data as { invitation_id: string })
      .invitation_id;
    const secondToken = generateInvitationToken();
    const resent = await head.client.rpc("resend_circle_invitation", {
      p_invitation_id: invitationId,
      p_token_digest: secondToken.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(resent.error).toBeNull();
    const oldAccept = await invitee.client.rpc("accept_circle_invitation", {
      p_token_digest: firstToken.digest,
    });
    expect((oldAccept.data as { outcome?: string } | null)?.outcome).not.toBe(
      "accepted",
    );
    const newAccept = await invitee.client.rpc("accept_circle_invitation", {
      p_token_digest: secondToken.digest,
    });
    expect((newAccept.data as { outcome: string }).outcome).toBe("accepted");
  });

  it("concurrent resend produces one replacement and one governed capture", async () => {
    const invitee = await createSyntheticUser("inv-conc-resend");
    const original = generateInvitationToken();
    const created = await head.client.rpc("create_circle_invitation", {
      p_circle_id: circleId,
      p_invited_email: invitee.email,
      p_token_digest: original.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    const invitationId = (created.data as { invitation_id: string })
      .invitation_id;
    const candidates = Array.from({ length: 6 }, () =>
      generateInvitationToken(),
    );
    const results = await Promise.all(
      candidates.map((token) =>
        head.client.rpc("resend_circle_invitation", {
          p_invitation_id: invitationId,
          p_token_digest: token.digest,
          p_idempotency_key: crypto.randomUUID(),
        }),
      ),
    );
    expect(results.every((result) => !result.error)).toBe(true);
    const ids = new Set(results.map((result) => result.data as string));
    expect(ids.size).toBe(1);
    const replacementId = [...ids][0];
    const current = await sql<{ token_digest: string }[]>`
      select token_digest from public.circle_invitations where id = ${replacementId}`;
    expect(
      candidates.filter((token) => token.digest === current[0].token_digest),
    ).toHaveLength(1);
    expect(
      (
        await invitee.client.rpc("accept_circle_invitation", {
          p_token_digest: original.digest,
        })
      ).data,
    ).toEqual({ outcome: "unavailable" });
    const pending = await sql<{ count: number }[]>`
      select count(*)::int count from public.circle_invitations
      where circle_id = ${circleId} and status = 'pending'
        and invited_email_digest = public.kinward_email_digest(${invitee.email})`;
    expect(pending[0].count).toBe(1);
    const lifecycle = await sql<{ cancelled: number; created: number }[]>`
      select count(*) filter (where event_type = 'invitation.cancelled')::int cancelled,
        count(*) filter (where event_type = 'invitation.created' and target_id = ${replacementId})::int created
      from public.audit_events where target_id in (${invitationId}, ${replacementId})`;
    expect(lifecycle[0]).toEqual({ cancelled: 1, created: 1 });
  });

  it("keeps acceptance and governed expiration terminal states internally consistent", async () => {
    const expiredUser = await createSyntheticUser("inv-conc-expired");
    const expiredToken = generateInvitationToken();
    const created = await head.client.rpc("create_circle_invitation", {
      p_circle_id: circleId,
      p_invited_email: expiredUser.email,
      p_token_digest: expiredToken.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    const invitationId = (created.data as { invitation_id: string })
      .invitation_id;
    await sql`update public.circle_invitations
      set created_at = transaction_timestamp() - interval '8 days',
          expires_at = transaction_timestamp() - interval '1 second'
      where id = ${invitationId}`;
    const attempts = await Promise.all(
      Array.from({ length: 4 }, () =>
        expiredUser.client.rpc("accept_circle_invitation", {
          p_token_digest: expiredToken.digest,
        }),
      ),
    );
    expect(
      attempts.some(
        (result) =>
          (result.data as { outcome?: string })?.outcome === "expired",
      ),
    ).toBe(true);
    const state = await sql<
      {
        status: string;
        memberships: number;
        roles: number;
        expired_events: number;
      }[]
    >`
      select i.status,
        (select count(*)::int from public.circle_memberships where circle_id = i.circle_id and user_id = ${expiredUser.id}) memberships,
        (select count(*)::int from public.circle_role_assignments r join public.circle_memberships m on m.id = r.membership_id where m.circle_id = i.circle_id and m.user_id = ${expiredUser.id}) roles,
        (select count(*)::int from public.audit_events where target_id = i.id and event_type = 'invitation.expired') expired_events
      from public.circle_invitations i where i.id = ${invitationId}`;
    expect(state[0]).toEqual({
      status: "expired",
      memberships: 0,
      roles: 0,
      expired_events: 1,
    });
    expect(
      (
        await expiredUser.client.rpc("accept_circle_invitation", {
          p_token_digest: expiredToken.digest,
        })
      ).data,
    ).toEqual({ outcome: "unavailable" });
  });
});
