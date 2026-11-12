import packageJson from "#/package.json" with { type: "json" };
import { assertIsObject, assertIsString } from "#/tests/utils/assert.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const REQUIRED_PROPERTIES = ["name", "version", "author", "license"] as const;

const DEPENDENCY_PROPERTIES = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "overrides",
] as const;

const EXACT_VERSION =
  /^\d+\.\d+\.\d+(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?$/iu;

const manifest: Readonly<Record<string, unknown>> = packageJson;

describe("package.json", () => {
  it("is private", () => {
    assert.equal(packageJson.private, true);
  });

  it("has all required properties set", () => {
    for (const property of REQUIRED_PROPERTIES) {
      assert.match(packageJson[property], /./u, `${property} must be set`);
    }
  });

  it("pins direct dependencies to exact versions, so that upgrades are deliberate", () => {
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
});
