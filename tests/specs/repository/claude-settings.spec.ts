import settings from "#/.claude/settings.json" with { type: "json" };
import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe(".claude/settings.json", () => {
  it("denies reading .env files anywhere, so that secrets stay out of the model context", () => {
    assert.ok(
      settings.permissions.deny.includes("Read(//**/.env)"),
      "permissions.deny must contain Read(//**/.env)",
    );
  });
});
