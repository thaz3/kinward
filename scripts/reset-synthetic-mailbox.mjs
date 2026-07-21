import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, resolve, sep } from "node:path";

const defaultRoot = resolve(tmpdir(), "kinward-synthetic-invitation-mailbox");
const root = resolve(
  process.env.KINWARD_SYNTHETIC_INVITATION_MAILBOX_DIR ?? defaultRoot,
);
const allowedTemporaryRoot = `${resolve(tmpdir())}${sep}`;

if (
  !isAbsolute(root) ||
  (root !== defaultRoot && !root.startsWith(allowedTemporaryRoot))
) {
  throw new Error(
    "Refusing to clear a mailbox outside the operating-system temporary directory.",
  );
}

await rm(root, { recursive: true, force: true });
