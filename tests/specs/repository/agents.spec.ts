import settings from "#/.claude/settings.json" with { type: "json" };
import mcp from "#/.mcp.json" with { type: "json" };
import { preToolUseHooksBlock } from "#/tests/utils/hooks.ts";
import { connectMcpServer } from "#/tests/utils/mcp.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const COMMANDS_THAT_READ_ENV_FILES = [
  "cat .env",
  "grep KEY ./.env",
  "source .env && npm test",
  "cat /workspace/.env",
  `node -e "readFileSync('.env')"`,
] as const;

const COMMANDS_THAT_DO_NOT_READ_ENV_FILES = [
  "echo $NODE_ENV",
  `node -e "process.env.CI"`,
  "cat .env.example",
] as const;

const BROWSER_STARTUP_TIMEOUT_MS = 60_000;
const PAGE_TITLE = "browser-check";

const PAGE_OPENING_TOOLS = [
  "mcp__chrome-devtools__navigate_page",
  "mcp__chrome-devtools__new_page",
] as const;

const LOCAL_URLS = [
  "http://localhost:3000/path",
  "https://127.0.0.1",
  "http://[::1]:8080",
  "data:text/html,<title>local</title>",
  "about:blank",
] as const;

const NON_LOCAL_URLS = [
  "https://example.com",
  "http://localhost.example.com",
  "http://localhost@example.com",
  "file:///workspace/.env",
  "javascript:void(0)",
] as const;

describe("agents", () => {
  it(".claude/settings.json denies reading .env files anywhere, so that secrets stay out of the model context", () => {
    assert.ok(
      settings.permissions.deny.includes("Read(//**/.env)"),
      "permissions.deny must contain Read(//**/.env)",
    );
  });

  it(".claude/settings.json blocks Bash commands that reference .env files, so that secrets stay out of the model context", () => {
    for (const command of COMMANDS_THAT_READ_ENV_FILES) {
      assert.ok(
        preToolUseHooksBlock("Bash", { command }),
        `must block: ${command}`,
      );
    }
  });

  it(".claude/settings.json allows Bash commands that do not reference .env files", () => {
    for (const command of COMMANDS_THAT_DO_NOT_READ_ENV_FILES) {
      assert.ok(
        !preToolUseHooksBlock("Bash", { command }),
        `must allow: ${command}`,
      );
    }
  });

  it(".claude/settings.json lets the browser open local URLs", () => {
    for (const tool of PAGE_OPENING_TOOLS) {
      for (const url of LOCAL_URLS) {
        assert.ok(
          !preToolUseHooksBlock(tool, { url }),
          `${tool} must allow ${url}`,
        );
      }
    }
  });

  it(".claude/settings.json blocks the browser from opening non-local URLs, so that it stays inside the Dev Container", () => {
    for (const tool of PAGE_OPENING_TOOLS) {
      for (const url of NON_LOCAL_URLS) {
        assert.ok(
          preToolUseHooksBlock(tool, { url }),
          `${tool} must block ${url}`,
        );
      }
    }
  });

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
      assert.match(
        JSON.stringify(result["content"]),
        new RegExp(PAGE_TITLE, "u"),
      );
    },
  );
});
