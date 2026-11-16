import { assertIsObject } from "#/tests/utils/assert.ts";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createInterface } from "node:readline";

interface McpServerConfig {
  readonly command: string;
  readonly args: readonly string[];
}

interface McpClient extends AsyncDisposable {
  readonly callTool: (
    name: string,
    args: Readonly<Record<string, unknown>>,
  ) => Promise<Readonly<Record<string, unknown>>>;
}

// https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle
const PROTOCOL_VERSION = "2025-11-25";

type Resolver = (message: Readonly<Record<string, unknown>>) => void;

export async function connectMcpServer(
  config: McpServerConfig,
): Promise<McpClient> {
  const server = spawn(config.command, config.args, {
    stdio: ["pipe", "pipe", "ignore"],
  });
  const pendingRequests = new Map<number, Resolver>();
  let nextId = 1;

  createInterface({ input: server.stdout }).on("line", (line) => {
    const message: unknown = JSON.parse(line);
    assertIsObject(message, "MCP server must send JSON-RPC objects");
    if (typeof message["id"] === "number") {
      pendingRequests.get(message["id"])?.(message);
      pendingRequests.delete(message["id"]);
    }
  });

  function send(message: Readonly<Record<string, unknown>>): void {
    server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", ...message })}\n`);
  }

  async function request(
    method: string,
    params: Readonly<Record<string, unknown>>,
  ): Promise<Readonly<Record<string, unknown>>> {
    const id = nextId++;
    const response = new Promise<Readonly<Record<string, unknown>>>((resolve) =>
      pendingRequests.set(id, resolve),
    );
    send({ id, method, params });
    const message = await response;
    assertIsObject(
      message["result"],
      `MCP request ${method} must succeed, got ${JSON.stringify(message)}`,
    );
    return message["result"];
  }

  await request("initialize", {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: "tests", version: "0.0.0" },
  });
  send({ method: "notifications/initialized" });

  return {
    callTool: (name, args) => request("tools/call", { name, arguments: args }),
    [Symbol.asyncDispose]: async () => {
      const exited = once(server, "exit");
      server.kill();
      await exited;
    },
  };
}
