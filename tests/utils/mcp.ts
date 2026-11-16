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

interface PendingRequest {
  readonly resolve: (message: Readonly<Record<string, unknown>>) => void;
  readonly reject: (error: Error) => void;
}

export async function connectMcpServer(
  config: McpServerConfig,
): Promise<McpClient> {
  const server = spawn(config.command, config.args, {
    stdio: ["pipe", "pipe", "pipe"],
  });
  const pendingRequests = new Map<number, PendingRequest>();
  let nextId = 1;
  let stderr = "";
  let failure: Error | undefined;

  function fail(error: Error): void {
    failure ??= error;
    for (const pending of pendingRequests.values()) {
      pending.reject(failure);
    }
    pendingRequests.clear();
  }

  server.stderr.setEncoding("utf8").on("data", (chunk: string) => {
    stderr += chunk;
  });
  server.on("error", fail);
  // A broken stdin pipe means the server exited; the exit handler reports why.
  server.stdin.on("error", () => undefined);
  server.on("exit", (code, signal) => {
    fail(
      new Error(
        `MCP server exited (code ${String(code)}, signal ${String(signal)}): ${stderr}`,
      ),
    );
  });

  createInterface({ input: server.stdout }).on("line", (line) => {
    const message: unknown = JSON.parse(line);
    assertIsObject(message, "MCP server must send JSON-RPC objects");
    if (typeof message["id"] === "number") {
      pendingRequests.get(message["id"])?.resolve(message);
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
    if (failure) {
      throw failure;
    }
    const id = nextId++;
    const response = new Promise<Readonly<Record<string, unknown>>>(
      (resolve, reject) => pendingRequests.set(id, { resolve, reject }),
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
      if (server.exitCode !== null || server.signalCode !== null) {
        return;
      }
      const exited = once(server, "exit");
      server.kill();
      await exited;
    },
  };
}
