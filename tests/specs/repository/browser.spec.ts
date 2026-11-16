import settings from "#/.claude/settings.json" with { type: "json" };
import mcp from "#/.mcp.json" with { type: "json" };
import { connectMcpServer } from "#/tests/utils/mcp.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const BROWSER_STARTUP_TIMEOUT_MS = 60_000;
const PAGE_TITLE = "browser-check";

describe("browser", () => {
  it(".claude/settings.json enables the chrome-devtools MCP server, so that agents can use the browser without approval", () => {
    assert.ok(
      settings.enabledMcpjsonServers.includes("chrome-devtools"),
      "enabledMcpjsonServers must contain chrome-devtools",
    );
  });

  it(
    ".mcp.json starts a chrome-devtools MCP server that can open pages in the Dev Container's browser",
    { timeout: BROWSER_STARTUP_TIMEOUT_MS },
    async () => {
      await using client = await connectMcpServer(
        mcp.mcpServers["chrome-devtools"],
      );

      const result = await client.callTool("new_page", {
        url: `data:text/html,<title>${PAGE_TITLE}</title>`,
      });

      assert.notEqual(result["isError"], true, JSON.stringify(result));
      assert.match(JSON.stringify(result["content"]), new RegExp(PAGE_TITLE));
    },
  );
});
