import { WebSocketServer, WebSocket } from "ws";
import { type ModelMessage } from "ai";
import { config } from "./config.js";
import { runAgent } from "./agent.js";
import { loadMcpTools, type ToolSet } from "./mcp.js";

type IncomingMessage = {
  type: "user_message";
  content: string;
};

type OutgoingMessage = {
  role: "assistant" | "tool" | "done";
  content?: string;
  name?: string;
  arguments?: Record<string, unknown>;
};

function send(ws: WebSocket, msg: OutgoingMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

async function main() {
  const { tools: mcpTools, cleanup } = await loadMcpTools();

  if (Object.keys(mcpTools).length > 0) {
    console.log(`Loaded MCP tools: ${Object.keys(mcpTools).join(", ")}`);
  }

  const wss = new WebSocketServer({ port: config.ws.port });

  wss.on("listening", () => {
    console.log(`Agent WS server listening on ws://localhost:${config.ws.port}`);
  });

  wss.on("connection", (ws) => {
    const history: ModelMessage[] = [];

    ws.on("message", async (raw) => {
      let incoming: IncomingMessage;

      try {
        incoming = JSON.parse(raw.toString()) as IncomingMessage;
      } catch {
        return;
      }

      if (incoming.type !== "user_message" || !incoming.content) return;

      history.push({ role: "user", content: incoming.content });

      try {
        await runAgent({
          history,
          mcpTools,
          onAssistant: (content) => {
            history.push({ role: "assistant", content });
            send(ws, { role: "assistant", content });
          },
          onTool: (name, args, result) => {
            send(ws, { role: "tool", name, arguments: args, content: result });
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send(ws, { role: "assistant", content: `Error: ${message}` });
      } finally {
        send(ws, { role: "done" });
      }
    });
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
      await cleanup();
      process.exit(0);
    });
  }
}

main().catch((err) => {
  console.error("Failed to start agent:", err);
  process.exit(1);
});
