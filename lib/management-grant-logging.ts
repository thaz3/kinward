export type ManagementGrantOperationalEvent =
  | "shared_create"
  | "delegated_pending_create"
  | "delegated_duration_finite"
  | "delegated_duration_until_revoked"
  | "delegated_acceptance"
  | "delegated_activation"
  | "delegated_suspend"
  | "delegated_restore"
  | "delegated_revoke"
  | "delegated_access_review";

export function writeManagementGrantOperationalLog(input: {
  correlationId: string;
  event: ManagementGrantOperationalEvent;
  result: "success" | "unavailable";
}) {
  console.info(
    JSON.stringify({ channel: "management-grant-operations", ...input }),
  );
}
