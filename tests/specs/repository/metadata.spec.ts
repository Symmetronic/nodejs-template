import packageJson from "#/package.json" with { type: "json" };
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const REQUIRED_PROPERTIES = ["name", "version", "author", "license"] as const;

describe("metadata", () => {
  it("package.json is private", () => {
    assert.equal(packageJson.private, true);
  });

  it("package.json has all required properties set", () => {
    for (const property of REQUIRED_PROPERTIES) {
      assert.match(packageJson[property], /./u, `${property} must be set`);
    }
  });
});
