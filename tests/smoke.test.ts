import { exec } from "child_process";
import { promisify } from "util";
import { describe, it, expect } from "vitest";

const execAsync = promisify(exec);

describe("build smoke test", () => {
  it("should build without errors", async () => {
    await execAsync("npm run build");
    expect(true).toBe(true);
  }, 30000);
});
