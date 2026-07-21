export type CircleRoleOperationalLog = Readonly<{
  channel: "circle-role-operations";
  correlationId: string;
  event: "assignment" | "lifecycle" | "view";
  result: "success" | "denied" | "unavailable";
}>;

export function writeCircleRoleOperationalLog(log: CircleRoleOperationalLog) {
  console.info(JSON.stringify(log));
}
