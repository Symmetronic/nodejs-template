import devcontainer from "#/.devcontainer/devcontainer.json" with { type: "json" };
import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe(".devcontainer", () => {
  it("sets DO_NOT_TRACK, so that tools honoring the convention send no telemetry", () => {
    assert.equal(process.env["DO_NOT_TRACK"], "1");
  });

  it("disables VS Code telemetry", () => {
    assert.equal(
      devcontainer.customizations.vscode.settings["telemetry.telemetryLevel"],
      "off",
    );
  });
});
