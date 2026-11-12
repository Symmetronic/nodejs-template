import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

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

    assert.partialDeepStrictEqual(config, {
      "allow-git": "none",
      "allow-remote": "none",
      "ignore-scripts": true,
      "min-release-age": 7,
      "save-exact": true,
    });
  });
});
