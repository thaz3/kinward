import { beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

type Scope = {
  owner: SyntheticUser;
  member: SyntheticUser;
  circle: string;
  recipient: string;
  membership: string;
};

async function scope(label: string): Promise<Scope> {
  const owner = await createSyntheticUser(`${label}-owner`);
  const member = await createSyntheticUser(`${label}-member`);
  const circle = (await createCircle(owner.client, `${label} Circle`))
    .data as string;
  const membership = (
    await sql<
      { id: string }[]
    >`insert into public.circle_memberships(circle_id,user_id) values (${circle},${member.id}) returning id`
  )[0].id;
  const recipient = (
    (
      await owner.client.rpc("self_activate_care_recipient", {
        p_circle_id: circle,
        p_display_label: `${label} Recipient`,
        p_idempotency_key: crypto.randomUUID(),
        p_consent_version: "kinward.ownership.v1",
      })
    ).data as { care_recipient_id: string }
  ).care_recipient_id;
  return { owner, member, circle, recipient, membership };
}

let a: Scope, b: Scope;
beforeAll(async () => {
  [a, b] = await Promise.all([scope("cross-a"), scope("cross-b")]);
});

const assign = (
  s: Scope,
  role: string,
  membership = s.membership,
  recipient = s.recipient,
) =>
  s.owner.client.rpc("assign_recipient_role", {
    p_circle_id: s.circle,
    p_care_recipient_id: recipient,
    p_membership_id: membership,
    p_role_code: role,
    p_idempotency_key: crypto.randomUUID(),
  });

describe("Slice 7 cross-Circle concurrency", () => {
  it("commits independently authorized assignments in separate Circles", async () => {
    const [left, right] = await Promise.all([
      assign(a, "medical_lead"),
      assign(b, "chemo_care_lead"),
    ]);
    expect(left.error).toBeNull();
    expect(right.error).toBeNull();
    const rows = await sql<
      { circle_id: string; care_recipient_id: string; role_code: string }[]
    >`
      select circle_id,care_recipient_id,role_code from public.care_recipient_role_assignments
      where id in (${(left.data as { assignment_id: string }).assignment_id}, ${(right.data as { assignment_id: string }).assignment_id}) order by circle_id`;
    expect(rows).toHaveLength(2);
    expect(
      new Set(
        rows.map((r) => `${r.circle_id}:${r.care_recipient_id}:${r.role_code}`),
      ),
    ).toEqual(
      new Set([
        `${a.circle}:${a.recipient}:medical_lead`,
        `${b.circle}:${b.recipient}:chemo_care_lead`,
      ]),
    );
  });

  it("denies a malicious cross-Circle pairing without affecting a valid concurrent request", async () => {
    const invalidKey = crypto.randomUUID();
    const [invalid, valid] = await Promise.all([
      a.owner.client.rpc("assign_recipient_role", {
        p_circle_id: a.circle,
        p_care_recipient_id: b.recipient,
        p_membership_id: b.membership,
        p_role_code: "care_lead",
        p_idempotency_key: invalidKey,
      }),
      assign(b, "backup_caregiver"),
    ]);
    expect(invalid.error?.message).toBe("not_authorized");
    expect(valid.error).toBeNull();
    const residue = await sql<
      { requests: number; audits: number; assignments: number }[]
    >`select
      (select count(*)::int from public.care_recipient_role_mutation_requests where idempotency_key=${invalidKey}) requests,
      (select count(*)::int from public.audit_events where correlation_id=${invalidKey}) audits,
      (select count(*)::int from public.care_recipient_role_assignments where circle_id=${a.circle} and care_recipient_id=${b.recipient}) assignments`;
    expect(residue[0]).toEqual({ requests: 0, audits: 0, assignments: 0 });
  });

  it("isolates a lifecycle transition in A from assignment in B", async () => {
    const initial = await assign(a, "backup_caregiver");
    const id = (initial.data as { assignment_id: string }).assignment_id;
    const [removed, assigned] = await Promise.all([
      a.owner.client.rpc("transition_recipient_role", {
        p_assignment_id: id,
        p_operation: "remove",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
      assign(b, "care_lead"),
    ]);
    expect(removed.error).toBeNull();
    expect(assigned.error).toBeNull();
    const states = await sql<{ a_status: string; b_status: string }[]>`select
      (select status from public.care_recipient_role_assignments where id=${id}) a_status,
      (select status from public.care_recipient_role_assignments where id=${(assigned.data as { assignment_id: string }).assignment_id}) b_status`;
    expect(states[0]).toEqual({ a_status: "removed", b_status: "active" });
  });
});
