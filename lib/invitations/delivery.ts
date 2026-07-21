import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve, sep } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  destinationDomain,
  invitationAcceptPath,
  invitationDeliveryMarker,
  invitedEmailSchema,
} from "@/lib/invitations";
import {
  ownershipAcceptPath,
  ownershipDeliveryMarker,
} from "@/lib/care-recipients";

export type SyntheticDeliveryResult =
  | { status: "captured"; captureId: string; correlationId: string }
  | {
      status: "unavailable";
      reason: "not_configured" | "invalid_destination" | "capture_failed";
    };

export type SyntheticInvitationMessage = {
  schemaVersion: 1;
  messageId: string;
  invitationId: string;
  to: string;
  from: "Kinward synthetic invitations <no-reply@example.test>";
  subject: string;
  text: string;
  html: string;
  invitationUrl: string;
  capturedAt: string;
};

const ENABLED_VALUE = "local-only";
const DEFAULT_MAILBOX_ROOT = join(
  tmpdir(),
  "kinward-synthetic-invitation-mailbox",
);

function localMailboxConfiguration(): { root: string; origin: string } | null {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.KINWARD_SYNTHETIC_INVITATION_SINK !== ENABLED_VALUE
  ) {
    return null;
  }

  const root =
    process.env.KINWARD_SYNTHETIC_INVITATION_MAILBOX_DIR ??
    DEFAULT_MAILBOX_ROOT;
  const resolvedRoot = resolve(root);
  if (
    !isAbsolute(root) ||
    !resolvedRoot.startsWith(`${resolve(tmpdir())}${sep}`)
  ) {
    return null;
  }

  try {
    const origin = new URL(
      process.env.KINWARD_LOCAL_APP_ORIGIN ?? "http://localhost:3000",
    );
    if (
      origin.protocol !== "http:" ||
      !["localhost", "127.0.0.1", "::1"].includes(origin.hostname) ||
      origin.username ||
      origin.password ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash
    ) {
      return null;
    }
    return { root: resolvedRoot, origin: origin.origin };
  } catch {
    return null;
  }
}

/** Reads only the recipient needed to create a replacement local message. */
export async function findSyntheticInvitationRecipient(
  invitationId: string,
): Promise<string | null> {
  const configuration = localMailboxConfiguration();
  if (!configuration) return null;
  try {
    const filenames = await readdir(configuration.root);
    for (const filename of filenames) {
      if (!filename.endsWith(".json")) continue;
      const raw = await readFile(join(configuration.root, filename), "utf8");
      const message = JSON.parse(raw) as Partial<SyntheticInvitationMessage>;
      if (message.invitationId !== invitationId) continue;
      const destination = invitedEmailSchema.safeParse(message.to);
      return destination.success ? destination.data : null;
    }
  } catch {
    return null;
  }
  return null;
}

async function captureCompleteMessage(input: {
  invitationId: string;
  invitedEmail: string;
  token: string;
  kind: "circle" | "ownership";
}): Promise<{ messageId: string; path: string } | null> {
  const configuration = localMailboxConfiguration();
  const destination = invitedEmailSchema.safeParse(input.invitedEmail);
  if (!configuration || !destination.success) return null;

  const messageId = randomUUID();
  const path =
    input.kind === "ownership"
      ? ownershipAcceptPath(input.token)
      : invitationAcceptPath(input.token);
  const invitationUrl = new URL(path, configuration.origin).toString();
  const subject =
    input.kind === "ownership"
      ? "You have a synthetic Kinward ownership invitation"
      : "You have a synthetic Kinward invitation";
  const message: SyntheticInvitationMessage = {
    schemaVersion: 1,
    messageId,
    invitationId: input.invitationId,
    to: destination.data,
    from: "Kinward synthetic invitations <no-reply@example.test>",
    subject,
    text: `This is a synthetic Kinward development message.\n\nReview the invitation: ${invitationUrl}\n\nDo not forward this message.`,
    html: `<p>This is a synthetic Kinward development message.</p><p><a href="${invitationUrl}">Review the invitation</a></p><p>Do not forward this message.</p>`,
    invitationUrl,
    capturedAt: new Date().toISOString(),
  };

  await mkdir(configuration.root, { recursive: true, mode: 0o700 });
  const temporaryPath = join(configuration.root, `.${messageId}.tmp`);
  const finalPath = join(configuration.root, `${messageId}.json`);
  await writeFile(temporaryPath, JSON.stringify(message), {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx",
  });
  await rename(temporaryPath, finalPath);
  return { messageId, path: finalPath };
}

/**
 * Captures a complete invitation in an isolated local mailbox and records only
 * a one-way delivery marker in Kinward's domain database. It cannot run in a
 * production build and has no outbound transport.
 */
export async function deliverInvitationSynthetically(input: {
  supabase: SupabaseClient;
  invitationId: string;
  invitedEmail: string;
  token: string;
  kind?: "circle" | "ownership";
}): Promise<SyntheticDeliveryResult> {
  const kind = input.kind ?? "circle";
  if (!invitedEmailSchema.safeParse(input.invitedEmail).success) {
    return { status: "unavailable", reason: "invalid_destination" };
  }
  if (!localMailboxConfiguration()) {
    return { status: "unavailable", reason: "not_configured" };
  }

  const correlationId = randomUUID();
  try {
    const captured = await captureCompleteMessage({ ...input, kind });
    if (!captured) {
      return { status: "unavailable", reason: "capture_failed" };
    }
    const result =
      kind === "ownership"
        ? await input.supabase.rpc("capture_ownership_invitation_delivery", {
            p_invitation_id: input.invitationId,
            p_destination_domain: destinationDomain(input.invitedEmail),
            p_delivery_marker: ownershipDeliveryMarker(input.token),
            p_correlation_id: correlationId,
          })
        : await input.supabase.rpc("capture_invitation_delivery", {
            p_invitation_id: input.invitationId,
            p_destination_domain: destinationDomain(input.invitedEmail),
            p_delivery_marker: invitationDeliveryMarker(input.token),
            p_correlation_id: correlationId,
          });
    if (result.error || typeof result.data !== "string") {
      await unlink(captured.path).catch(() => undefined);
      return { status: "unavailable", reason: "capture_failed" };
    }
    return {
      status: "captured",
      captureId: result.data,
      correlationId,
    };
  } catch {
    return { status: "unavailable", reason: "capture_failed" };
  }
}

export function externalInvitationDeliveryAvailable(): false {
  return false;
}
