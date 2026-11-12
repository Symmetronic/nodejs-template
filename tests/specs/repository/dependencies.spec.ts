import packageJson from "#/package.json" with { type: "json" };
import {
  assertIsNumber,
  assertIsObject,
  assertIsString,
} from "#/tests/utils/assert.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

const DEPENDENCY_PROPERTIES = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "overrides",
] as const;

const EXACT_VERSION =
  /^\d+\.\d+\.\d+(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?$/iu;

const MINIMUM_RELEASE_AGE_IN_DAYS = 7;

const manifest: Readonly<Record<string, unknown>> = packageJson;

describe("dependencies", () => {
  it("package.json pins direct dependencies to exact versions, so that upgrades are deliberate", () => {
    for (const property of DEPENDENCY_PROPERTIES) {
      const dependencies = manifest[property] ?? {};
      assertIsObject(dependencies, `${property} must be an object`);

      for (const [name, version] of Object.entries(dependencies)) {
        assertIsString(version, `${property}.${name} must be a version string`);
        assert.match(
          version,
          EXACT_VERSION,
          `${property}.${name} must use an exact version, got "${version}"`,
        );
      }
    }
  });

  it(".npmrc hardens the supply chain", () => {
    const result = spawnSync("npm", ["config", "list", "--json"], {
      encoding: "utf8",
    });
    const config: unknown = JSON.parse(result.stdout);
    assertIsObject(config, "npm config must be an object");

    assert.partialDeepStrictEqual(config, {
      "allow-git": "none",
      "allow-remote": "none",
      "ignore-scripts": true,
      "save-exact": true,
    });

    const minReleaseAge = config["min-release-age"];
    assertIsNumber(minReleaseAge, "min-release-age must be a number");
    assert.ok(
      minReleaseAge >= MINIMUM_RELEASE_AGE_IN_DAYS,
      `min-release-age must be at least ${String(MINIMUM_RELEASE_AGE_IN_DAYS)} days, got ${String(minReleaseAge)}`,
    );
  });

  it(".npmrc makes installations fail without NPM_REGISTRY, so that installations only work inside the Dev Container", () => {
    const result = spawnSync("npm", ["install", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, NPM_REGISTRY: "" },
    });

    assert.notEqual(result.status, 0);
  });
});
