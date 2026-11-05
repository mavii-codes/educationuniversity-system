import fs from "node:fs";
import path from "node:path";

const BACKEND_PACKAGE_NAME = "university-datahub-backend";

function isBackendRoot(directory: string): boolean {
  try {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(directory, "package.json"), "utf8")
    ) as { name?: unknown };
    if (manifest.name === BACKEND_PACKAGE_NAME) return true;
  } catch {
    // package.json may be missing; fall through to the marker check below.
  }

  return (
    fs.existsSync(path.join(directory, "tsconfig.json")) &&
    fs.existsSync(path.join(directory, ".env"))
  );
}

function findBackendRoot(startDirectory: string): string | null {
  let current = path.resolve(startDirectory);
  for (;;) {
    if (isBackendRoot(current)) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/**
 * Directory containing backend/package.json. Walks up from the cwd first (so
 * `npm start` works even when launched from the repo root), then from the
 * compiled/source module location, which covers src/ (tsx) and dist/ (tsc).
 */
export const appRoot =
  findBackendRoot(process.cwd()) ??
  findBackendRoot(__dirname) ??
  path.resolve(__dirname, "..", "..");
