export function writeRecipientRoleOperationalLog(input: {
  correlationId: string;
  event: "assignment" | "lifecycle";
  result: "success" | "unavailable";
}) {
  console.info(
    JSON.stringify({ channel: "recipient-role-operations", ...input }),
  );
}
