import settings from "#/.claude/settings.json" with { type: "json" };
import devcontainer from "#/.devcontainer/devcontainer.json" with { type: "json" };
import mcp from "#/.mcp.json" with { type: "json" };
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

  it(".mcp.json disables chrome-devtools usage statistics, so that no usage data is sent to Google", () => {
    assert.ok(
      mcp.mcpServers["chrome-devtools"].args.includes("--no-usage-statistics"),
      "chrome-devtools args must contain --no-usage-statistics",
    );
  });

  it(".mcp.json disables chrome-devtools CrUX lookups, so that no visited URLs are sent to Google", () => {
    assert.ok(
      mcp.mcpServers["chrome-devtools"].args.includes("--no-performance-crux"),
      "chrome-devtools args must contain --no-performance-crux",
    );
  });

  it(".devcontainer/devcontainer.json disables VS Code telemetry", () => {
    assert.equal(
      devcontainer.customizations.vscode.settings["telemetry.telemetryLevel"],
      "off",
    );
  });
});
