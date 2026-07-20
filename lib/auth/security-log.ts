import { createHash, randomUUID } from "node:crypto";

export type AuthSecurityEvent =
  | "auth.requested"
  | "auth.verified"
  | "auth.failed"
  | "auth.signed_out"
  | "auth.session_invalid";

type SafeAuthLog = Readonly<{
  channel: "authentication-security";
  correlationId: string;
  event: AuthSecurityEvent;
  result: "success" | "denied" | "unavailable";
  actorReference?: string;
}>;

export function safeActorReference(userId: string): string {
  return createHash("sha256").update(userId).digest("hex").slice(0, 16);
}

export function createAuthSecurityLog(
  input: Omit<SafeAuthLog, "channel" | "correlationId">,
): SafeAuthLog {
  return {
    channel: "authentication-security",
    correlationId: randomUUID(),
    ...input,
  };
}

export function writeAuthSecurityLog(log: SafeAuthLog) {
  console.info(JSON.stringify(log));
}
