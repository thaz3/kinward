import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deliverInvitationSynthetically,
  findSyntheticInvitationRecipient,
} from "@/lib/invitations/delivery";

const invitationId = "11111111-1111-4111-8111-111111111111";

describe("local synthetic invitation delivery sink", () => {
  let mailboxRoot: string;

  beforeEach(async () => {
    mailboxRoot = await mkdtemp(join(tmpdir(), "kinward-mailbox-test-"));
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("KINWARD_SYNTHETIC_INVITATION_SINK", "local-only");
    vi.stubEnv("KINWARD_SYNTHETIC_INVITATION_MAILBOX_DIR", mailboxRoot);
    vi.stubEnv("KINWARD_LOCAL_APP_ORIGIN", "http://127.0.0.1:3000");
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(mailboxRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  function client() {
    return {
      rpc: vi.fn().mockResolvedValue({
        data: "22222222-2222-4222-8222-222222222222",
        error: null,
      }),
    } as unknown as SupabaseClient;
  }

  it("captures a complete token-bearing message only in the isolated mailbox", async () => {
    const token = "abcdefghijklmnopqrstuvwxyz0123456789_-TOKEN";
    const supabase = client();
    const result = await deliverInvitationSynthetically({
      supabase,
      invitationId,
      invitedEmail: "avery@example.test",
      token,
    });

    expect(result.status).toBe("captured");
    const files = await readdir(mailboxRoot);
    expect(files).toHaveLength(1);
    const path = join(mailboxRoot, files[0]);
    const rawMessage = await readFile(path, "utf8");
    const message = JSON.parse(rawMessage) as Record<string, unknown>;
    expect(message.to).toBe("avery@example.test");
    expect(String(message.invitationUrl).includes(token)).toBe(true);
    expect(String(message.text).includes(token)).toBe(true);
    expect(String(message.html).includes(token)).toBe(true);
    expect((await stat(path)).mode & 0o777).toBe(0o600);
    expect(await findSyntheticInvitationRecipient(invitationId)).toBe(
      "avery@example.test",
    );

    const rpcInput = vi.mocked(supabase.rpc).mock.calls[0][1];
    expect(JSON.stringify(rpcInput).includes(token)).toBe(false);
    expect(JSON.stringify(rpcInput).includes("avery@example.test")).toBe(false);
  });

  it("rejects real recipients before writing or recording delivery", async () => {
    const supabase = client();
    const result = await deliverInvitationSynthetically({
      supabase,
      invitationId,
      invitedEmail: "person@gmail.com",
      token: "abcdefghijklmnopqrstuvwxyz0123456789_-TOKEN",
    });

    expect(result).toEqual({
      status: "unavailable",
      reason: "invalid_destination",
    });
    expect(await readdir(mailboxRoot)).toHaveLength(0);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("is unavailable in production even when explicitly configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const supabase = client();
    const result = await deliverInvitationSynthetically({
      supabase,
      invitationId,
      invitedEmail: "avery@example.test",
      token: "abcdefghijklmnopqrstuvwxyz0123456789_-TOKEN",
    });

    expect(result).toEqual({
      status: "unavailable",
      reason: "not_configured",
    });
    expect(await readdir(mailboxRoot)).toHaveLength(0);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("removes a captured message if token-free metadata recording fails", async () => {
    const supabase = {
      rpc: vi
        .fn()
        .mockResolvedValue({ data: null, error: new Error("failed") }),
    } as unknown as SupabaseClient;
    const result = await deliverInvitationSynthetically({
      supabase,
      invitationId,
      invitedEmail: "avery@example.test",
      token: "abcdefghijklmnopqrstuvwxyz0123456789_-TOKEN",
    });

    expect(result.status).toBe("unavailable");
    expect(await readdir(mailboxRoot)).toHaveLength(0);
  });
});
