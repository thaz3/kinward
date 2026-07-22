export function writeManagementGrantOperationalLog(input: {
  correlationId: string;
  event: "shared_create" | "delegated_pending_create";
  result: "success" | "unavailable";
}) {
  console.info(
    JSON.stringify({ channel: "management-grant-operations", ...input }),
  );
}
