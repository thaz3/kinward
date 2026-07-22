import { beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

let ownerA: SyntheticUser;
let ownerB: SyntheticUser;
let circleA: string;
let circleB: string;
let recipientA: string;
let recipientB: string;

beforeAll(async () => {
  ownerA = await createSyntheticUser("slice8-cross-a");
  ownerB = await createSyntheticUser("slice8-cross-b");
  circleA = (await createCircle(ownerA.client, "Slice Eight Cross A"))
    .data as string;
  circleB = (await createCircle(ownerB.client, "Slice Eight Cross B"))
    .data as string;
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
});

describe("Slice 8 cross-Circle races", () => {
  it("keeps parallel Circle mode selections independent", async () => {
    const [a, b] = await Promise.all([
      ownerA.client.rpc("select_care_management_mode", {
        p_circle_id: circleA,
        p_care_recipient_id: recipientA,
        p_mode_code: "self_managed",
        p_expected_version: 0,
        p_idempotency_key: crypto.randomUUID(),
      }),
      ownerB.client.rpc("select_care_management_mode", {
        p_circle_id: circleB,
        p_care_recipient_id: recipientB,
        p_mode_code: "delegated_management",
        p_expected_version: 0,
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
    const state = await sql<
      { a_mode: string; b_mode: string; a_circle: string; b_circle: string }[]
    >`select
      (select mode_code from public.care_management_modes where care_recipient_id = ${recipientA} and status = 'active') a_mode,
      (select mode_code from public.care_management_modes where care_recipient_id = ${recipientB} and status = 'active') b_mode,
      (select circle_id::text from public.care_management_modes where care_recipient_id = ${recipientA} and status = 'active') a_circle,
      (select circle_id::text from public.care_management_modes where care_recipient_id = ${recipientB} and status = 'active') b_circle`;
    expect(state[0]).toEqual({
      a_mode: "self_managed",
      b_mode: "delegated_management",
      a_circle: circleA,
      b_circle: circleB,
    });
  });

  it("rejects cross-scope mode selection guesses", async () => {
    const attempts = await Promise.all([
      ownerA.client.rpc("select_care_management_mode", {
        p_circle_id: circleB,
        p_care_recipient_id: recipientB,
        p_mode_code: "shared_management",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
      ownerA.client.rpc("select_care_management_mode", {
        p_circle_id: circleA,
        p_care_recipient_id: recipientB,
        p_mode_code: "shared_management",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
      ownerB.client.rpc("select_care_management_mode", {
        p_circle_id: circleA,
        p_care_recipient_id: recipientA,
        p_mode_code: "shared_management",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
      ownerA.client.rpc("get_care_management_mode", {
        p_circle_id: circleB,
        p_care_recipient_id: recipientB,
      }),
    ]);
    expect(attempts.every((attempt) => attempt.error)).toBe(true);
  });
});
