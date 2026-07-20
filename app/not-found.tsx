import { PermissionDeniedState } from "@/components/system-states";

export default function NotFound() {
  return (
    <main className="standalone-state" id="main-content">
      <PermissionDeniedState />
    </main>
  );
}
