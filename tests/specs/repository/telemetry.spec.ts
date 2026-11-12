import settings from "#/.claude/settings.json" with { type: "json" };
import devcontainer from "#/.devcontainer/devcontainer.json" with { type: "json" };
import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("telemetry", () => {
  it(".claude/settings.json disables telemetry and error reporting, so that no usage data leaves the Dev Container", () => {
    assert.partialDeepStrictEqual(settings.env, {
      DISABLE_ERROR_REPORTING: "1",
      DISABLE_TELEMETRY: "1",
    });
  });

  it(".devcontainer sets DO_NOT_TRACK, so that tools honoring the convention send no telemetry", () => {
    assert.equal(process.env["DO_NOT_TRACK"], "1");
  });

  it(".devcontainer/devcontainer.json disables VS Code telemetry", () => {
    assert.equal(
      devcontainer.customizations.vscode.settings["telemetry.telemetryLevel"],
      "off",
    );
  });
});
