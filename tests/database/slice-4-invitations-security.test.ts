import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  anonymous,
  createCircle,
  createSyntheticUser,
  generateInvitationToken,
  hashInvitationToken,
  invitationDeliveryMarker,
  sql,
  type SyntheticUser,
} from "./helpers";

let headA: SyntheticUser;
let headB: SyntheticUser;
let member: SyntheticUser;
let invitee: SyntheticUser;
let stranger: SyntheticUser;
let unverified: SyntheticUser;
let circleA: string;
let circleB: string;

async function createInvite(
  client: SyntheticUser["client"],
  circleId: string,
  email: string,
  key = crypto.randomUUID(),
  token = generateInvitationToken(),
) {
  const result = await client.rpc("create_circle_invitation", {
    p_circle_id: circleId,
    p_invited_email: email,
    p_token_digest: token.digest,
    p_idempotency_key: key,
  });
  return { result, token, key };
}

beforeAll(async () => {
  [headA, headB, member, invitee, stranger, unverified] = await Promise.all([
    createSyntheticUser("inv-head-a"),
    createSyntheticUser("inv-head-b"),
    createSyntheticUser("inv-member"),
    createSyntheticUser("inv-invitee"),
    createSyntheticUser("inv-stranger"),
    createSyntheticUser("inv-unverified", false),
  ]);
  const [a, b] = await Promise.all([
    createCircle(headA.client, "Invite Circle A"),
    createCircle(headB.client, "Invite Circle B"),
  ]);
  if (a.error || b.error) throw a.error ?? b.error;
  circleA = a.data as string;
  circleB = b.data as string;

  // Make member an ordinary member of circle A (no Circle Head).
  const token = generateInvitationToken();
  const invited = await headA.client.rpc("create_circle_invitation", {
    p_circle_id: circleA,
    p_invited_email: member.email,
    p_token_digest: token.digest,
    p_idempotency_key: crypto.randomUUID(),
  });
  if (invited.error) throw invited.error;
  const accepted = await member.client.rpc("accept_circle_invitation", {
    p_token_digest: token.digest,
  });
  if (accepted.error) throw accepted.error;
  expect((accepted.data as { outcome: string }).outcome).toBe("accepted");
});

describe("Slice 4 invitation creation authorization", () => {
  it("allows Circle Head to create a pending Family Coordinator invitation", async () => {
    const email = `create-${crypto.randomUUID()}@example.test`;
    const { result, token } = await createInvite(headA.client, circleA, email);
    expect(result.error).toBeNull();
    const payload = result.data as {
      invitation_id: string;
      created: boolean;
    };
    expect(payload.created).toBe(true);
    const rows = await sql<
      {
        status: string;
        token_digest: string;
        invited_email_digest: string;
      }[]
    >`select status, token_digest, invited_email_digest from public.circle_invitations where id = ${payload.invitation_id}`;
    expect(rows[0].status).toBe("pending");
    expect(rows[0].token_digest).toBe(token.digest);
    expect(rows[0].token_digest).not.toBe(token.token);
    expect(rows[0].invited_email_digest).toBe(
      createHash("sha256").update(email.toLowerCase()).digest("hex"),
    );
    const assignments = await sql<{ role_code: string; status: string }[]>`
      select role_code, status from public.invitation_proposed_assignments
      where invitation_id = ${payload.invitation_id}`;
    expect(assignments).toEqual([
      { role_code: "family_coordinator", status: "proposed" },
    ]);
  });

  it("denies ordinary member, other Circle Head, unverified, and anonymous create", async () => {
    const email = `deny-${crypto.randomUUID()}@example.test`;
    for (const client of [member.client, headB.client, unverified.client]) {
      const { result } = await createInvite(client, circleA, email);
      expect(result.error).not.toBeNull();
    }
    expect(
      (
        await anonymous.rpc("create_circle_invitation", {
          p_circle_id: circleA,
          p_invited_email: email,
          p_token_digest: hashInvitationToken("x".repeat(43)),
          p_idempotency_key: crypto.randomUUID(),
        })
      ).error,
    ).not.toBeNull();
  });

  it("deduplicates identical pending invitations and idempotency keys", async () => {
    const email = `dup-${crypto.randomUUID()}@example.test`;
    const key = crypto.randomUUID();
    const first = await createInvite(headA.client, circleA, email, key);
    expect(first.result.error).toBeNull();
    const second = await createInvite(headA.client, circleA, email, key);
    expect(second.result.error).toBeNull();
    expect(
      (second.result.data as { invitation_id: string }).invitation_id,
    ).toBe((first.result.data as { invitation_id: string }).invitation_id);
    expect((second.result.data as { created: boolean }).created).toBe(false);
    const third = await createInvite(
      headA.client,
      circleA,
      email,
      crypto.randomUUID(),
    );
    expect((third.result.data as { created: boolean }).created).toBe(false);
    const count = await sql<{ count: number }[]>`
      select count(*)::int as count from public.circle_invitations
      where circle_id = ${circleA}
        and invited_email_digest = ${createHash("sha256").update(email).digest("hex")}
        and status = 'pending'`;
    expect(count[0].count).toBe(1);
  });
});

describe("Slice 4 identity binding and acceptance (AT-014)", () => {
  it("lets the intended verified adult accept once with membership and Family Coordinator", async () => {
    const token = generateInvitationToken();
    const created = await headA.client.rpc("create_circle_invitation", {
      p_circle_id: circleA,
      p_invited_email: invitee.email,
      p_token_digest: token.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(created.error).toBeNull();
    const before = await invitee.client
      .from("family_circles")
      .select("id")
      .eq("id", circleA);
    expect(before.data).toEqual([]);

    const accepted = await invitee.client.rpc("accept_circle_invitation", {
      p_token_digest: token.digest,
    });
    expect(accepted.error).toBeNull();
    expect((accepted.data as { outcome: string }).outcome).toBe("accepted");

    const after = await invitee.client
      .from("family_circles")
      .select("id")
      .eq("id", circleA);
    expect(after.data).toEqual([{ id: circleA }]);
    const roles = await sql<{ role_code: string }[]>`
      select r.role_code from public.circle_role_assignments r
      join public.circle_memberships m on m.id = r.membership_id
      where m.user_id = ${invitee.id} and m.circle_id = ${circleA} and r.status = 'active'
      order by r.role_code`;
    expect(roles.map((row) => row.role_code)).toEqual(["family_coordinator"]);

    const again = await invitee.client.rpc("accept_circle_invitation", {
      p_token_digest: token.digest,
    });
    expect((again.data as { outcome: string }).outcome).toBe("unavailable");
    const memberships = await sql<{ count: number }[]>`
      select count(*)::int as count from public.circle_memberships
      where circle_id = ${circleA} and user_id = ${invitee.id} and status = 'active'`;
    expect(memberships[0].count).toBe(1);
  });

  it("denies mismatch, stranger with token, anonymous, and unverified acceptance", async () => {
    const target = `mismatch-${crypto.randomUUID()}@example.test`;
    const token = generateInvitationToken();
    await headA.client.rpc("create_circle_invitation", {
      p_circle_id: circleA,
      p_invited_email: target,
      p_token_digest: token.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    const mismatch = await stranger.client.rpc("accept_circle_invitation", {
      p_token_digest: token.digest,
    });
    expect((mismatch.data as { outcome: string }).outcome).toBe("unavailable");
    expect(
      (
        await anonymous.rpc("accept_circle_invitation", {
          p_token_digest: token.digest,
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await unverified.client.rpc("accept_circle_invitation", {
          p_token_digest: token.digest,
        })
      ).error,
    ).not.toBeNull();
    const stillPending = await sql<{ status: string }[]>`
      select status from public.circle_invitations where token_digest = ${token.digest}`;
    expect(stillPending[0]?.status).toBe("pending");
  });

  it("returns the same public shape for mismatched, invalid, and inaccessible invitations", async () => {
    const target = await createSyntheticUser("inv-neutral-target");
    const wrong = await createSyntheticUser("inv-neutral-wrong");
    const token = generateInvitationToken();
    const created = await headA.client.rpc("create_circle_invitation", {
      p_circle_id: circleA,
      p_invited_email: target.email,
      p_token_digest: token.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    const invitationId = (created.data as { invitation_id: string })
      .invitation_id;
    const expected = { outcome: "unavailable" };
    const mismatch = await wrong.client.rpc("preview_circle_invitation", {
      p_token_digest: token.digest,
    });
    const invalid = await wrong.client.rpc("preview_circle_invitation", {
      p_token_digest: "f".repeat(64),
    });
    const guessed = await wrong.client.rpc("preview_my_circle_invitation", {
      p_invitation_id: crypto.randomUUID(),
    });
    const inaccessible = await wrong.client.rpc(
      "preview_my_circle_invitation",
      {
        p_invitation_id: invitationId,
      },
    );
    expect(mismatch.data).toEqual(expected);
    expect(invalid.data).toEqual(expected);
    expect(guessed.data).toEqual(expected);
    expect(inaccessible.data).toEqual(expected);
  });
});

describe("Slice 4 cancellation and decline (AT-016)", () => {
  it("cancels and declines pending invitations without membership", async () => {
    const cancelEmail = `cancel-${crypto.randomUUID()}@example.test`;
    const declineUser = await createSyntheticUser("inv-decline");
    const cancelToken = generateInvitationToken();
    const declineToken = generateInvitationToken();
    const cancelCreate = await headA.client.rpc("create_circle_invitation", {
      p_circle_id: circleA,
      p_invited_email: cancelEmail,
      p_token_digest: cancelToken.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    const declineCreate = await headA.client.rpc("create_circle_invitation", {
      p_circle_id: circleA,
      p_invited_email: declineUser.email,
      p_token_digest: declineToken.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(declineCreate.error).toBeNull();
    const cancelId = (cancelCreate.data as { invitation_id: string })
      .invitation_id;
    expect(
      (
        await headA.client.rpc("cancel_circle_invitation", {
          p_invitation_id: cancelId,
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await stranger.client.rpc("cancel_circle_invitation", {
          p_invitation_id: cancelId,
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await declineUser.client.rpc("decline_circle_invitation", {
          p_token_digest: declineToken.digest,
        })
      ).data,
    ).toMatchObject({ outcome: "declined" });
    expect(
      (
        await declineUser.client.rpc("accept_circle_invitation", {
          p_token_digest: declineToken.digest,
        })
      ).data,
    ).toMatchObject({ outcome: "unavailable" });
    expect(
      (
        await stranger.client.rpc("accept_circle_invitation", {
          p_token_digest: cancelToken.digest,
        })
      ).data,
    ).toMatchObject({ outcome: "unavailable" });
    const memberships = await sql<{ count: number }[]>`
      select count(*)::int as count from public.circle_memberships
      where circle_id = ${circleA} and user_id = ${declineUser.id}`;
    expect(memberships[0].count).toBe(0);
  });
});

describe("Slice 4 expiration (AT-015)", () => {
  it("expires pending invitations without membership and records expiration once", async () => {
    const user = await createSyntheticUser("inv-expire");
    const token = generateInvitationToken();
    const created = await headA.client.rpc("create_circle_invitation", {
      p_circle_id: circleA,
      p_invited_email: user.email,
      p_token_digest: token.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    const invitationId = (created.data as { invitation_id: string })
      .invitation_id;
    await sql`update public.circle_invitations
      set created_at = now() - interval '8 days',
          expires_at = now() - interval '1 minute'
      where id = ${invitationId}`;
    const first = await user.client.rpc("accept_circle_invitation", {
      p_token_digest: token.digest,
    });
    expect((first.data as { outcome: string }).outcome).toBe("expired");
    const second = await user.client.rpc("preview_circle_invitation", {
      p_token_digest: token.digest,
    });
    expect((second.data as { outcome: string }).outcome).toBe("unavailable");
    const audits = await sql<{ count: number }[]>`
      select count(*)::int as count from public.audit_events
      where target_id = ${invitationId} and event_type = 'invitation.expired'`;
    expect(audits[0].count).toBe(1);
    const memberships = await sql<{ count: number }[]>`
      select count(*)::int as count from public.circle_memberships
      where circle_id = ${circleA} and user_id = ${user.id}`;
    expect(memberships[0].count).toBe(0);
  });
});

describe("Slice 4 RLS and direct-write denial", () => {
  it("denies direct invitation reads and writes for all authenticated roles", async () => {
    const email = `rls-${crypto.randomUUID()}@example.test`;
    const { result } = await createInvite(headA.client, circleA, email);
    const invitationId = (result.data as { invitation_id: string })
      .invitation_id;
    for (const client of [headA.client, member.client, stranger.client]) {
      expect(
        (await client.from("circle_invitations").select("id")).data ?? [],
      ).toEqual([]);
      expect(
        (
          await client.from("circle_invitations").insert({
            circle_id: circleA,
            invited_email_digest: "a".repeat(64),
            invited_email_mask: "x@example.test",
            token_digest: "b".repeat(64),
            inviter_user_id: headA.id,
            expires_at: new Date(Date.now() + 86400000).toISOString(),
          })
        ).error,
      ).not.toBeNull();
      expect(
        (
          await client
            .from("circle_invitations")
            .update({ status: "accepted" })
            .eq("id", invitationId)
        ).error,
      ).not.toBeNull();
      expect(
        (
          await client
            .from("invitation_proposed_assignments")
            .update({ status: "activated" })
            .eq("invitation_id", invitationId)
        ).error,
      ).not.toBeNull();
    }
    expect(
      (await anonymous.from("circle_invitations").select("id")).error,
    ).not.toBeNull();
  });

  it("lets Circle Head list only exact-Circle pending invitations without token digests", async () => {
    const listed = await headA.client.rpc("list_pending_circle_invitations", {
      p_circle_id: circleA,
    });
    expect(listed.error).toBeNull();
    const rows = listed.data as Record<string, unknown>[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => !("token_digest" in row))).toBe(true);
    expect(
      (
        await headA.client.rpc("list_pending_circle_invitations", {
          p_circle_id: circleB,
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await member.client.rpc("list_pending_circle_invitations", {
          p_circle_id: circleA,
        })
      ).error,
    ).not.toBeNull();
  });

  it("captures synthetic delivery without storing tokens or emails", async () => {
    const email = `deliver-${crypto.randomUUID()}@example.test`;
    const token = generateInvitationToken();
    const created = await headA.client.rpc("create_circle_invitation", {
      p_circle_id: circleA,
      p_invited_email: email,
      p_token_digest: token.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    const invitationId = (created.data as { invitation_id: string })
      .invitation_id;
    const capture = await headA.client.rpc("capture_invitation_delivery", {
      p_invitation_id: invitationId,
      p_destination_domain: "example.test",
      p_delivery_marker: invitationDeliveryMarker(token.token),
      p_correlation_id: crypto.randomUUID(),
    });
    expect(capture.error).toBeNull();
    const rows = await sql<
      { destination_domain: string; delivery_marker: string }[]
    >`select destination_domain, delivery_marker from public.invitation_delivery_captures
      where invitation_id = ${invitationId}`;
    expect(rows[0].destination_domain).toBe("example.test");
    expect(rows[0].delivery_marker).not.toContain(token.token);
    expect(rows[0].delivery_marker).not.toContain(email);
  });
});
