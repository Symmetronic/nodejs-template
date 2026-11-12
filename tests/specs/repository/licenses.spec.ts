import packageJson from "#/package.json" with { type: "json" };
import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

const license = readFileSync(new URL("../../../LICENSE", import.meta.url), {
  encoding: "utf8",
});

const COPYRIGHT = /^Copyright \(c\) (?<year>\d{4}) (?<holder>.+)$/mu;

const AUTHOR_NAME = /^(?<name>[^<(]+?)\s*(?:[<(]|$)/u;

const DEPENDENCY = { name: "dependency", version: "1.0.0" } as const;

function parseCopyright(): Readonly<{ year: string; holder: string }> {
  const groups = COPYRIGHT.exec(license)?.groups;
  assert.ok(groups?.["year"], "LICENSE must contain a copyright year");
  assert.ok(groups["holder"], "LICENSE must contain a copyright holder");
  return { year: groups["year"], holder: groups["holder"] };
}

function runLicenseCheckWithDependency(
  dependencyLicense: string | undefined,
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
      JSON.stringify({ ...DEPENDENCY, license: dependencyLicense }),
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

describe("licenses", () => {
  describe("project license", () => {
    it("LICENSE matches the license in package.json", () => {
      const [title] = license.split("\n");

      assert.equal(title, `${packageJson.license} License`);
    });

    it("LICENSE has the current year in the copyright", () => {
      assert.equal(parseCopyright().year, String(new Date().getFullYear()));
    });

    it("LICENSE names the author from package.json as copyright holder", () => {
      const authorName = AUTHOR_NAME.exec(packageJson.author)?.groups?.["name"];

      assert.equal(parseCopyright().holder, authorName);
    });
  });

  describe("dependency licenses", () => {
    it("license:check accepts dependencies with a permissive license", () => {
      const result = runLicenseCheckWithDependency("MIT");

      assert.equal(result.status, 0, result.stderr);
    });

    it("license:check rejects dependencies with a copyleft license", () => {
      const result = runLicenseCheckWithDependency("GPL-3.0");

      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /"GPL-3\.0" which is not permitted/u);
    });

    it("license:check rejects dependencies without a license", () => {
      const result = runLicenseCheckWithDependency(undefined);

      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /"UNKNOWN" which is not permitted/u);
    });
  });
});
