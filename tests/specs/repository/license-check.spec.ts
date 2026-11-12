import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

const DEPENDENCY = { name: "dependency", version: "1.0.0" } as const;

function runLicenseCheckWithDependency(
  license: string | undefined,
): SpawnSyncReturns<string> {
  const project = mkdtempSync(join(tmpdir(), "license-check-"));
  const dependencyDirectory = join(project, "node_modules", DEPENDENCY.name);

  try {
    mkdirSync(dependencyDirectory, { recursive: true });
    writeFileSync(
      join(project, "package.json"),
      JSON.stringify({
        name: "fixture",
        version: "1.0.0",
        private: true,
        dependencies: { [DEPENDENCY.name]: DEPENDENCY.version },
      }),
    );
    writeFileSync(
      join(dependencyDirectory, "package.json"),
      JSON.stringify({ ...DEPENDENCY, license }),
    );

    return spawnSync(
      "npm",
      ["run", "license:check", "--", "--start", project],
      { encoding: "utf8" },
    );
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
}

describe("license:check", () => {
  it("accepts dependencies with a permissive license", () => {
    const result = runLicenseCheckWithDependency("MIT");

    assert.equal(result.status, 0, result.stderr);
  });

  it("rejects dependencies with a copyleft license", () => {
    const result = runLicenseCheckWithDependency("GPL-3.0");

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /"GPL-3\.0" which is not permitted/u);
  });

  it("rejects dependencies without a license", () => {
    const result = runLicenseCheckWithDependency(undefined);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /"UNKNOWN" which is not permitted/u);
  });
});
