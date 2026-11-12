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

  it("disables telemetry and error reporting, so that no usage data leaves the Dev Container", () => {
    assert.partialDeepStrictEqual(settings.env, {
      DISABLE_ERROR_REPORTING: "1",
      DISABLE_TELEMETRY: "1",
    });
  });
});
