import { assertIsNumber, assertIsObject } from "#/tests/utils/assert.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

const MINIMUM_RELEASE_AGE_IN_DAYS = 7;

describe(".npmrc", () => {
  it("makes installations fail without NPM_REGISTRY, so that installations only work inside the Dev Container", () => {
    const result = spawnSync("npm", ["install", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, NPM_REGISTRY: "" },
    });

    assert.notEqual(result.status, 0);
  });

  it("hardens the supply chain", () => {
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
});
