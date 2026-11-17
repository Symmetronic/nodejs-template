import { assertIsObject } from "#/tests/utils/assert.ts";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
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

type JsonObject = Readonly<Record<string, unknown>>;

// https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle
const PROTOCOL_VERSION = "2025-11-25";

interface PendingRequest {
  readonly resolve: (message: JsonObject) => void;
  readonly reject: (error: Error) => void;
}

class JsonRpcProcess implements AsyncDisposable {
  readonly #server: ChildProcessWithoutNullStreams;
  readonly #pendingRequests = new Map<number, PendingRequest>();
  #nextId = 1;
  #stderr = "";
  #failure: Error | undefined;

  constructor(config: McpServerConfig) {
    this.#server = spawn(config.command, config.args, {
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.#server.stderr.setEncoding("utf8").on("data", (chunk: string) => {
      this.#stderr += chunk;
    });
    this.#server.on("error", (error) => {
      this.#fail(error);
    });
    // A broken stdin pipe means the server exited; the exit handler reports why.
    this.#server.stdin.on("error", () => undefined);
    this.#server.on("exit", (code, signal) => {
      this.#fail(
        new Error(
          `MCP server exited (code ${String(code)}, signal ${String(signal)}): ${this.#stderr}`,
        ),
      );
    });
    createInterface({ input: this.#server.stdout }).on("line", (line) => {
      this.#receive(line);
    });
  }

  send(message: JsonObject): void {
    this.#server.stdin.write(
      `${JSON.stringify({ jsonrpc: "2.0", ...message })}\n`,
    );
  }

  async request(method: string, params: JsonObject): Promise<JsonObject> {
    if (this.#failure) {
      throw this.#failure;
    }
    const id = this.#nextId++;
    const response = new Promise<JsonObject>((resolve, reject) =>
      this.#pendingRequests.set(id, { resolve, reject }),
    );
    this.send({ id, method, params });
    const message = await response;
    assertIsObject(
      message["result"],
      `MCP request ${method} must succeed, got ${JSON.stringify(message)}`,
    );
    return message["result"];
  }

  async [Symbol.asyncDispose](): Promise<void> {
    if (this.#server.exitCode !== null || this.#server.signalCode !== null) {
      return;
    }
    const exited = once(this.#server, "exit");
    this.#server.kill();
    await exited;
  }

  #receive(line: string): void {
    const message: unknown = JSON.parse(line);
    assertIsObject(message, "MCP server must send JSON-RPC objects");
    if (typeof message["id"] === "number") {
      this.#pendingRequests.get(message["id"])?.resolve(message);
      this.#pendingRequests.delete(message["id"]);
    }
  }

  #fail(error: Error): void {
    this.#failure ??= error;
    for (const pending of this.#pendingRequests.values()) {
      pending.reject(this.#failure);
    }
    this.#pendingRequests.clear();
  }
}

export async function connectMcpServer(
  config: McpServerConfig,
): Promise<McpClient> {
  const server = new JsonRpcProcess(config);

  await server.request("initialize", {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: "tests", version: "0.0.0" },
  });
  server.send({ method: "notifications/initialized" });

  return {
    callTool: async (name, args) =>
      server.request("tools/call", { name, arguments: args }),
    [Symbol.asyncDispose]: async () => server[Symbol.asyncDispose](),
  };
}
