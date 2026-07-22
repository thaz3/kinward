export function writeManagementModeOperationalLog(input: {
  correlationId: string;
  event: "select";
  result: "success" | "unavailable";
}) {
  console.info(
    JSON.stringify({ channel: "management-mode-operations", ...input }),
  );
}
