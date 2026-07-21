import { beforeAll, describe, expect, it } from "vitest";
import {
  anonymous,
  createCircle,
  createSyntheticUser,
  generateInvitationToken,
  sql,
  type SyntheticUser,
} from "./helpers";

const CONSENT = "kinward.ownership.v1";

let headA: SyntheticUser;
let headB: SyntheticUser;
let member: SyntheticUser;
let unverified: SyntheticUser;
let circleA: string;
let circleB: string;

async function propose(
  client: SyntheticUser["client"],
  circleId: string,
  email: string,
  key = crypto.randomUUID(),
  token = generateInvitationToken(),
) {
  const result = await client.rpc("propose_care_recipient", {
    p_circle_id: circleId,
    p_display_label: `Care Recipient ${email.split("@")[0].slice(-8)}`,
    p_invited_email: email,
    p_token_digest: token.digest,
    p_idempotency_key: key,
  });
  return { result, token, key };
}

async function accept(
  client: SyntheticUser["client"],
  digest: string,
  consent = CONSENT,
  key = crypto.randomUUID(),
) {
  return client.rpc("accept_ownership_invitation", {
    p_token_digest: digest,
    p_consent_version: consent,
    p_idempotency_key: key,
  });
}

async function recipientRow(id: string) {
  const rows = await sql<
    {
      status: string;
      owner_user_id: string | null;
      ownership_acceptance_id: string | null;
      activated_at: string | null;
    }[]
  >`select status, owner_user_id, ownership_acceptance_id, activated_at
    from public.care_recipients where id = ${id}`;
  return rows[0];
}

beforeAll(async () => {
  [headA, headB, member, unverified] = await Promise.all([
    createSyntheticUser("cr-head-a"),
    createSyntheticUser("cr-head-b"),
    createSyntheticUser("cr-member"),
    createSyntheticUser("cr-unverified", false),
  ]);
  const [a, b] = await Promise.all([
    createCircle(headA.client, "CR Security Circle A"),
    createCircle(headB.client, "CR Security Circle B"),
  ]);
  if (a.error || b.error) throw a.error ?? b.error;
  circleA = a.data as string;
  circleB = b.data as string;

  // Make `member` an ordinary (non-head) member of circle A via a Slice 4 invite.
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
});

describe("Slice 5 proposal authorization", () => {
  it("lets a Circle Head propose a Care Recipient and pending invitation", async () => {
    const target = await createSyntheticUser("cr-prop-ok");
    const { result, token } = await propose(
      headA.client,
      circleA,
      target.email,
    );
    expect(result.error).toBeNull();
    const payload = result.data as {
      care_recipient_id: string;
      invitation_id: string;
      created: boolean;
    };
    expect(payload.created).toBe(true);
    const recipient = await recipientRow(payload.care_recipient_id);
    expect(recipient.status).toBe("proposed");
    expect(recipient.owner_user_id).toBeNull();
    const invitation = await sql<{ status: string; token_digest: string }[]>`
      select status, token_digest from public.care_recipient_ownership_invitations
      where id = ${payload.invitation_id}`;
    expect(invitation[0].status).toBe("pending");
    expect(invitation[0].token_digest).toBe(token.digest);
    expect(invitation[0].token_digest).not.toBe(token.token);
  });

  it("denies an ordinary member, another circle's head, unverified, and anonymous", async () => {
    const target = await createSyntheticUser("cr-prop-deny");
    for (const client of [member.client, headB.client, unverified.client]) {
      const { result } = await propose(client, circleA, target.email);
      expect(result.error).not.toBeNull();
    }
    const anon = await anonymous.rpc("propose_care_recipient", {
      p_circle_id: circleA,
      p_display_label: "Anonymous Attempt",
      p_invited_email: target.email,
      p_token_digest: generateInvitationToken().digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(anon.error).not.toBeNull();
  });

  it("prevents a Circle B head from proposing inside Circle A", async () => {
    const target = await createSyntheticUser("cr-prop-cross");
    const cross = await propose(headB.client, circleA, target.email);
    expect(cross.result.error).not.toBeNull();
    const count = await sql<{ count: number }[]>`
      select count(*)::int as count from public.care_recipients
      where circle_id = ${circleA} and proposed_by_user_id = ${headB.id}`;
    expect(count[0].count).toBe(0);
    // Sanity: the same head may propose inside their own Circle B.
    const own = await propose(headB.client, circleB, target.email);
    expect(own.result.error).toBeNull();
  });

  it("grants the proposer no ownership or access to the proposed recipient", async () => {
    const target = await createSyntheticUser("cr-prop-noaccess");
    const { result } = await propose(headA.client, circleA, target.email);
    const recipientId = (result.data as { care_recipient_id: string })
      .care_recipient_id;
    const owned = await headA.client.rpc("get_owned_care_recipient", {
      p_circle_id: circleA,
      p_care_recipient_id: recipientId,
    });
    expect((owned.data as { outcome: string }).outcome).toBe("unavailable");
    const visible = await headA.client
      .from("care_recipients")
      .select("id")
      .eq("id", recipientId);
    expect(visible.data ?? []).toEqual([]);
    const row = await recipientRow(recipientId);
    expect(row.owner_user_id).toBeNull();
  });
});

describe("Slice 5 direct-write and read denial (deny by default)", () => {
  it("denies direct insert into care_recipients for authenticated roles", async () => {
    const insert = await headA.client.from("care_recipients").insert({
      circle_id: circleA,
      display_label: "Direct Insert",
      proposed_by_user_id: headA.id,
    });
    expect(insert.error).not.toBeNull();
  });

  it("denies direct insert into ownership_acceptance_records", async () => {
    const insert = await headA.client
      .from("ownership_acceptance_records")
      .insert({
        care_recipient_id: crypto.randomUUID(),
        circle_id: circleA,
        accepting_user_id: headA.id,
        consent_version: CONSENT,
        decision: "accepted",
        correlation_id: crypto.randomUUID(),
      });
    expect(insert.error).not.toBeNull();
  });

  it("denies direct insert into consent_records", async () => {
    const insert = await headA.client.from("consent_records").insert({
      circle_id: circleA,
      care_recipient_id: crypto.randomUUID(),
      user_id: headA.id,
      consent_kind: "care_recipient_ownership",
      consent_version: CONSENT,
      decision: "accepted",
      correlation_id: crypto.randomUUID(),
    });
    expect(insert.error).not.toBeNull();
  });

  it("denies a direct activation update on care_recipients", async () => {
    const target = await createSyntheticUser("cr-direct-update");
    const { result } = await propose(headA.client, circleA, target.email);
    const recipientId = (result.data as { care_recipient_id: string })
      .care_recipient_id;
    const update = await headA.client
      .from("care_recipients")
      .update({ status: "active", owner_user_id: headA.id })
      .eq("id", recipientId);
    expect(update.error).not.toBeNull();
    expect((await recipientRow(recipientId)).status).toBe("proposed");
  });

  it("never exposes token digests through a direct select (no grants)", async () => {
    const read = await headA.client
      .from("care_recipient_ownership_invitations")
      .select("token_digest");
    expect(read.error).not.toBeNull();
    expect(read.data).toBeNull();
  });

  it("denies authenticated insert, update, and delete on care_recipients", async () => {
    const target = await createSyntheticUser("cr-grant-check");
    const { result } = await propose(headA.client, circleA, target.email);
    const recipientId = (result.data as { care_recipient_id: string })
      .care_recipient_id;
    expect(
      (
        await member.client.from("care_recipients").insert({
          circle_id: circleA,
          display_label: "Nope",
          proposed_by_user_id: member.id,
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await member.client
          .from("care_recipients")
          .update({ display_label: "Renamed" })
          .eq("id", recipientId)
      ).error,
    ).not.toBeNull();
    expect(
      (
        await member.client
          .from("care_recipients")
          .delete()
          .eq("id", recipientId)
      ).error,
    ).not.toBeNull();
  });
});

describe("Slice 5 acceptance identity binding and consent", () => {
  it("accepts with a valid token and consent, creating one owner, activation, and membership", async () => {
    const owner = await createSyntheticUser("cr-accept-ok");
    const { result, token } = await propose(headA.client, circleA, owner.email);
    const recipientId = (result.data as { care_recipient_id: string })
      .care_recipient_id;
    const accepted = await accept(owner.client, token.digest);
    expect(accepted.error).toBeNull();
    expect((accepted.data as { outcome: string }).outcome).toBe("accepted");

    const row = await recipientRow(recipientId);
    expect(row.status).toBe("active");
    expect(row.owner_user_id).toBe(owner.id);
    expect(row.ownership_acceptance_id).not.toBeNull();
    expect(row.activated_at).not.toBeNull();

    const owners = await sql<{ count: number }[]>`
      select count(*)::int as count from public.care_recipients
      where id = ${recipientId} and status = 'active' and owner_user_id = ${owner.id}`;
    expect(owners[0].count).toBe(1);
    const acceptances = await sql<{ count: number }[]>`
      select count(*)::int as count from public.ownership_acceptance_records
      where care_recipient_id = ${recipientId}`;
    expect(acceptances[0].count).toBe(1);
    const memberships = await sql<{ count: number }[]>`
      select count(*)::int as count from public.circle_memberships
      where circle_id = ${circleA} and user_id = ${owner.id} and status = 'active'`;
    expect(memberships[0].count).toBe(1);
  });

  it("reactivates or reuses an existing membership rather than duplicating it", async () => {
    // `member` is already an active member of circle A.
    const { result, token } = await propose(
      headA.client,
      circleA,
      member.email,
    );
    const recipientId = (result.data as { care_recipient_id: string })
      .care_recipient_id;
    const accepted = await accept(member.client, token.digest);
    expect((accepted.data as { outcome: string }).outcome).toBe("accepted");
    const memberships = await sql<{ count: number }[]>`
      select count(*)::int as count from public.circle_memberships
      where circle_id = ${circleA} and user_id = ${member.id} and status = 'active'`;
    expect(memberships[0].count).toBe(1);
    expect((await recipientRow(recipientId)).owner_user_id).toBe(member.id);
  });

  it("rejects acceptance without the correct consent version", async () => {
    const owner = await createSyntheticUser("cr-accept-noconsent");
    const { result, token } = await propose(headA.client, circleA, owner.email);
    const recipientId = (result.data as { care_recipient_id: string })
      .care_recipient_id;
    const wrong = await accept(
      owner.client,
      token.digest,
      "kinward.ownership.v0",
    );
    expect((wrong.data as { outcome: string }).outcome).toBe(
      "consent_required",
    );
    expect((await recipientRow(recipientId)).status).toBe("proposed");
    const acceptances = await sql<{ count: number }[]>`
      select count(*)::int as count from public.ownership_acceptance_records
      where care_recipient_id = ${recipientId}`;
    expect(acceptances[0].count).toBe(0);
  });

  it("returns a neutral unavailable outcome on a verified-email mismatch", async () => {
    const owner = await createSyntheticUser("cr-mismatch-owner");
    const wrong = await createSyntheticUser("cr-mismatch-wrong");
    const { result, token } = await propose(headA.client, circleA, owner.email);
    const recipientId = (result.data as { care_recipient_id: string })
      .care_recipient_id;
    const mismatch = await accept(wrong.client, token.digest);
    expect((mismatch.data as { outcome: string }).outcome).toBe("unavailable");
    expect((await recipientRow(recipientId)).status).toBe("proposed");
  });

  it("does not let an ordinary Slice 4 circle invitation token accept ownership", async () => {
    const owner = await createSyntheticUser("cr-wrong-token-kind");
    const circleToken = generateInvitationToken();
    const created = await headA.client.rpc("create_circle_invitation", {
      p_circle_id: circleA,
      p_invited_email: owner.email,
      p_token_digest: circleToken.digest,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(created.error).toBeNull();
    const attempt = await accept(owner.client, circleToken.digest);
    expect((attempt.data as { outcome: string }).outcome).toBe("unavailable");
  });

  it("treats a random 64-hex digest with no matching invitation as unavailable", async () => {
    const owner = await createSyntheticUser("cr-guess-digest");
    const attempt = await accept(owner.client, "a".repeat(64));
    expect((attempt.data as { outcome: string }).outcome).toBe("unavailable");
  });

  it("enforces sole ownership when the wrong account races the intended owner", async () => {
    const owner = await createSyntheticUser("cr-sole-owner");
    const intruder = await createSyntheticUser("cr-sole-intruder");
    const { result, token } = await propose(headA.client, circleA, owner.email);
    const recipientId = (result.data as { care_recipient_id: string })
      .care_recipient_id;
    const [a, b] = await Promise.all([
      accept(owner.client, token.digest),
      accept(intruder.client, token.digest),
    ]);
    const outcomes = [a, b].map(
      (r) => (r.data as { outcome?: string } | null)?.outcome,
    );
    expect(outcomes.filter((o) => o === "accepted")).toHaveLength(1);
    const owners = await sql<{ owner: string | null; count: number }[]>`
      select owner_user_id as owner, count(*)::int as count
      from public.care_recipients
      where id = ${recipientId} and status = 'active'
      group by owner_user_id`;
    expect(owners).toEqual([{ owner: owner.id, count: 1 }]);
  });
});

describe("Slice 5 owner-only read isolation", () => {
  it("keeps the active recipient hidden from the proposing Circle Head", async () => {
    const owner = await createSyntheticUser("cr-head-blind");
    const { result, token } = await propose(headA.client, circleA, owner.email);
    const recipientId = (result.data as { care_recipient_id: string })
      .care_recipient_id;
    await accept(owner.client, token.digest);
    const headOwned = await headA.client.rpc("get_owned_care_recipient", {
      p_circle_id: circleA,
      p_care_recipient_id: recipientId,
    });
    expect((headOwned.data as { outcome: string }).outcome).toBe("unavailable");
    const headSelect = await headA.client
      .from("care_recipients")
      .select("id")
      .eq("id", recipientId);
    expect(headSelect.data ?? []).toEqual([]);
    const ownerOwned = await owner.client.rpc("get_owned_care_recipient", {
      p_circle_id: circleA,
      p_care_recipient_id: recipientId,
    });
    expect((ownerOwned.data as { outcome: string }).outcome).toBe("ready");
  });

  it("keeps the active recipient hidden from a non-owning Family Coordinator member", async () => {
    const owner = await createSyntheticUser("cr-fc-blind");
    const { result, token } = await propose(headA.client, circleA, owner.email);
    const recipientId = (result.data as { care_recipient_id: string })
      .care_recipient_id;
    await accept(owner.client, token.digest);
    const fcOwned = await member.client.rpc("get_owned_care_recipient", {
      p_circle_id: circleA,
      p_care_recipient_id: recipientId,
    });
    expect((fcOwned.data as { outcome: string }).outcome).toBe("unavailable");
    const fcSelect = await member.client
      .from("care_recipients")
      .select("id")
      .eq("id", recipientId);
    expect(fcSelect.data ?? []).toEqual([]);
  });

  it("isolates Dad and Mom owners from each other and from the head (AT-002/003)", async () => {
    const dadUser = await createSyntheticUser("cr-dad");
    const momUser = await createSyntheticUser("cr-mom");
    const dad = await propose(headA.client, circleA, dadUser.email);
    const mom = await propose(headA.client, circleA, momUser.email);
    const dadId = (dad.result.data as { care_recipient_id: string })
      .care_recipient_id;
    const momId = (mom.result.data as { care_recipient_id: string })
      .care_recipient_id;
    await accept(dadUser.client, dad.token.digest);
    await accept(momUser.client, mom.token.digest);

    const read = async (client: SyntheticUser["client"], id: string) =>
      (
        (
          await client.rpc("get_owned_care_recipient", {
            p_circle_id: circleA,
            p_care_recipient_id: id,
          })
        ).data as { outcome: string }
      ).outcome;

    expect(await read(dadUser.client, dadId)).toBe("ready");
    expect(await read(dadUser.client, momId)).toBe("unavailable");
    expect(await read(momUser.client, momId)).toBe("ready");
    expect(await read(momUser.client, dadId)).toBe("unavailable");
    expect(await read(headA.client, dadId)).toBe("unavailable");
    expect(await read(headA.client, momId)).toBe("unavailable");
  });

  it("returns unavailable for a guessed recipient UUID via get_owned", async () => {
    const owner = await createSyntheticUser("cr-guess-uuid");
    const guessed = await owner.client.rpc("get_owned_care_recipient", {
      p_circle_id: circleA,
      p_care_recipient_id: crypto.randomUUID(),
    });
    expect((guessed.data as { outcome: string }).outcome).toBe("unavailable");
  });

  it("exposes only the owner's own active recipient through RLS select", async () => {
    const owner = await createSyntheticUser("cr-rls-owner");
    const outsider = await createSyntheticUser("cr-rls-outsider");
    const { result, token } = await propose(headA.client, circleA, owner.email);
    const recipientId = (result.data as { care_recipient_id: string })
      .care_recipient_id;
    await accept(owner.client, token.digest);
    const ownerView = await owner.client
      .from("care_recipients")
      .select("id")
      .eq("id", recipientId);
    expect(ownerView.data).toEqual([{ id: recipientId }]);
    const outsiderView = await outsider.client
      .from("care_recipients")
      .select("id")
      .eq("id", recipientId);
    expect(outsiderView.data ?? []).toEqual([]);
  });
});

describe("Slice 5 terminal transitions and self-activation", () => {
  it("declines without any ownership or membership and archives the shell", async () => {
    const owner = await createSyntheticUser("cr-decline");
    const { result, token } = await propose(headA.client, circleA, owner.email);
    const recipientId = (result.data as { care_recipient_id: string })
      .care_recipient_id;
    const declined = await owner.client.rpc("decline_ownership_invitation", {
      p_token_digest: token.digest,
    });
    expect((declined.data as { outcome: string }).outcome).toBe("declined");
    const row = await recipientRow(recipientId);
    expect(row.status).toBe("archived");
    expect(row.owner_user_id).toBeNull();
    const memberships = await sql<{ count: number }[]>`
      select count(*)::int as count from public.circle_memberships
      where circle_id = ${circleA} and user_id = ${owner.id}`;
    expect(memberships[0].count).toBe(0);
    const laterAccept = await accept(owner.client, token.digest);
    expect((laterAccept.data as { outcome: string }).outcome).not.toBe(
      "accepted",
    );
  });

  it("cancels a proposal, archives the shell, and prevents later acceptance", async () => {
    const owner = await createSyntheticUser("cr-cancel");
    const { result, token } = await propose(headA.client, circleA, owner.email);
    const recipientId = (result.data as { care_recipient_id: string })
      .care_recipient_id;
    const cancelled = await headA.client.rpc("cancel_ownership_proposal", {
      p_care_recipient_id: recipientId,
    });
    expect((cancelled.data as { outcome: string }).outcome).toBe("archived");
    expect((await recipientRow(recipientId)).status).toBe("archived");
    const laterAccept = await accept(owner.client, token.digest);
    expect((laterAccept.data as { outcome: string }).outcome).not.toBe(
      "accepted",
    );
  });

  it("treats an expired invitation as expired with no owner and archives the shell", async () => {
    const owner = await createSyntheticUser("cr-expired");
    const { result, token } = await propose(headA.client, circleA, owner.email);
    const recipientId = (result.data as { care_recipient_id: string })
      .care_recipient_id;
    await sql`update public.care_recipient_ownership_invitations
      set created_at = now() - interval '8 days',
          expires_at = now() - interval '1 minute'
      where care_recipient_id = ${recipientId} and status = 'pending'`;
    const expired = await accept(owner.client, token.digest);
    expect((expired.data as { outcome: string }).outcome).toBe("expired");
    const row = await recipientRow(recipientId);
    expect(row.status).toBe("archived");
    expect(row.owner_user_id).toBeNull();
  });

  it("lets a Circle Head self-activate as sole owner with recorded consent", async () => {
    const selfAdd = await headA.client.rpc("self_activate_care_recipient", {
      p_circle_id: circleA,
      p_display_label: "Self Owned Recipient",
      p_idempotency_key: crypto.randomUUID(),
      p_consent_version: CONSENT,
    });
    expect(selfAdd.error).toBeNull();
    const recipientId = (selfAdd.data as { care_recipient_id: string })
      .care_recipient_id;
    const row = await recipientRow(recipientId);
    expect(row.status).toBe("active");
    expect(row.owner_user_id).toBe(headA.id);
    const owned = await headA.client.rpc("get_owned_care_recipient", {
      p_circle_id: circleA,
      p_care_recipient_id: recipientId,
    });
    expect((owned.data as { outcome: string }).outcome).toBe("ready");
  });

  it("rejects self-activation without the correct consent version", async () => {
    const selfAdd = await headA.client.rpc("self_activate_care_recipient", {
      p_circle_id: circleA,
      p_display_label: "Self No Consent",
      p_idempotency_key: crypto.randomUUID(),
      p_consent_version: "kinward.ownership.v0",
    });
    expect(selfAdd.error).not.toBeNull();
  });
});

describe("Slice 5 denial fingerprint logging", () => {
  it("records a fingerprint-only denial for an authenticated caller", async () => {
    const correlation = crypto.randomUUID();
    const recorded = await member.client.rpc(
      "record_care_recipient_access_denied",
      {
        p_correlation_id: correlation,
        p_attempted_context_id: crypto.randomUUID(),
      },
    );
    expect(recorded.error).toBeNull();
    const rows = await sql<{ count: number }[]>`
      select count(*)::int as count from public.audit_events
      where correlation_id = ${correlation}
        and event_type = 'care_recipient.access_denied' and result = 'denied'`;
    expect(rows[0].count).toBe(1);
  });

  it("rejects an anonymous denial record", async () => {
    const recorded = await anonymous.rpc(
      "record_care_recipient_access_denied",
      {
        p_correlation_id: crypto.randomUUID(),
      },
    );
    expect(recorded.error).not.toBeNull();
  });
});
