import { beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

let ownerA: SyntheticUser;
let ownerB: SyntheticUser;
let memberA: SyntheticUser;
let circleA: string;
let circleB: string;
let recipientA: string;
let recipientB: string;
let membershipA: string;

beforeAll(async () => {
  ownerA = await createSyntheticUser("slice9-cross-a");
  ownerB = await createSyntheticUser("slice9-cross-b");
  memberA = await createSyntheticUser("slice9-cross-member-a");
  circleA = (await createCircle(ownerA.client, "Slice Nine Cross A"))
    .data as string;
  circleB = (await createCircle(ownerB.client, "Slice Nine Cross B"))
    .data as string;
  membershipA = (
    await sql<{ id: string }[]>`
      insert into public.circle_memberships(circle_id, user_id)
      values (${circleA}, ${memberA.id}) returning id`
  )[0].id;
  recipientA = (
    (
      await ownerA.client.rpc("self_activate_care_recipient", {
        p_circle_id: circleA,
        p_display_label: "Cross A Recipient",
        p_idempotency_key: crypto.randomUUID(),
        p_consent_version: "kinward.ownership.v1",
      })
    ).data as { care_recipient_id: string }
  ).care_recipient_id;
  recipientB = (
    (
      await ownerB.client.rpc("self_activate_care_recipient", {
        p_circle_id: circleB,
        p_display_label: "Cross B Recipient",
        p_idempotency_key: crypto.randomUUID(),
        p_consent_version: "kinward.ownership.v1",
      })
    ).data as { care_recipient_id: string }
  ).care_recipient_id;
  await ownerA.client.rpc("select_care_management_mode", {
    p_circle_id: circleA,
    p_care_recipient_id: recipientA,
    p_mode_code: "shared_management",
    p_expected_version: 0,
    p_idempotency_key: crypto.randomUUID(),
  });
  await ownerB.client.rpc("select_care_management_mode", {
    p_circle_id: circleB,
    p_care_recipient_id: recipientB,
    p_mode_code: "shared_management",
    p_expected_version: 0,
    p_idempotency_key: crypto.randomUUID(),
  });
});

describe("Slice 9 cross-Circle races", () => {
  it("keeps parallel Circle shared grants independent", async () => {
    const memberB = await createSyntheticUser("slice9-cross-member-b");
    const membershipB = (
      await sql<{ id: string }[]>`
        insert into public.circle_memberships(circle_id, user_id)
        values (${circleB}, ${memberB.id}) returning id`
    )[0].id;
    const [a, b] = await Promise.all([
      ownerA.client.rpc("create_shared_management_grant", {
        p_circle_id: circleA,
        p_care_recipient_id: recipientA,
        p_membership_id: membershipA,
        p_permission_codes: ["recipient.manage_roles"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
      ownerB.client.rpc("create_shared_management_grant", {
        p_circle_id: circleB,
        p_care_recipient_id: recipientB,
        p_membership_id: membershipB,
        p_permission_codes: ["recipient.review_permissions"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
  });

  it("rejects cross-scope grant pairing guesses", async () => {
    const attempts = await Promise.all([
      ownerA.client.rpc("create_shared_management_grant", {
        p_circle_id: circleB,
        p_care_recipient_id: recipientB,
        p_membership_id: membershipA,
        p_permission_codes: ["recipient.manage_roles"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
      ownerA.client.rpc("create_shared_management_grant", {
        p_circle_id: circleA,
        p_care_recipient_id: recipientB,
        p_membership_id: membershipA,
        p_permission_codes: ["recipient.manage_roles"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
      ownerB.client.rpc("create_shared_management_grant", {
        p_circle_id: circleA,
        p_care_recipient_id: recipientA,
        p_membership_id: membershipA,
        p_permission_codes: ["recipient.manage_roles"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(attempts.every((attempt) => attempt.error)).toBe(true);
  });
});
