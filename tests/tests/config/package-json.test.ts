import packageJson from "#/package.json" with { type: "json" };
import { assertNonEmptyString } from "#/tests/utils/assertions.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("package.json", () => {
  it("is private", () => {
    assert.equal(packageJson.private, true);
  });

  it("has a name", () => {
    assertNonEmptyString(packageJson.name, "name");
  });

  it("has a version", () => {
    assertNonEmptyString(packageJson.version, "version");
  });

  it("has an author", () => {
    assertNonEmptyString(packageJson.author, "author");
  });
});
