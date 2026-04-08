import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { tool, jsonSchema, type Tool } from "ai";
import { readFileSync } from "fs";
import { config } from "./config.js";

type McpServerConfig = {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
};

type McpConfig = {
  servers: McpServerConfig[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolSet = Record<string, Tool<any, any>>;

async function connectServer(
  serverConfig: McpServerConfig
): Promise<{ tools: ToolSet; cleanup: () => Promise<void> }> {
  const client = new Client({ name: "agent", version: "0.1.0" });

  const transport = new StdioClientTransport({
    command: serverConfig.command,
    args: serverConfig.args ?? [],
    env: { ...process.env, ...serverConfig.env } as Record<string, string>,
  });

  await client.connect(transport);

  const { tools: mcpTools } = await client.listTools();

  const tools: ToolSet = {};

  for (const mcpTool of mcpTools) {
    const key = `${serverConfig.name}__${mcpTool.name}`;

    tools[key] = tool({
      description: mcpTool.description ?? "",
      inputSchema: jsonSchema<Record<string, unknown>>(
        mcpTool.inputSchema as Record<string, unknown>
      ),
      execute: async (input: Record<string, unknown>): Promise<string> => {
        const result = await client.callTool({
          name: mcpTool.name,
          arguments: input,
        });

        const text = (result.content as Array<{ type: string; text?: string }>)
          .filter((c) => c.type === "text")
          .map((c) => c.text ?? "")
          .join("\n");

        return text || "(no output)";
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as Tool<any, any>;
  }

  return {
    tools,
    cleanup: () => client.close(),
  };
}

export async function loadMcpTools(): Promise<{
  tools: ToolSet;
  cleanup: () => Promise<void>;
}> {
  let mcpConfig: McpConfig;

  try {
    mcpConfig = JSON.parse(readFileSync(config.mcpConfigPath, "utf-8")) as McpConfig;
  } catch {
    return { tools: {}, cleanup: async () => {} };
  }

  if (!mcpConfig.servers?.length) {
    return { tools: {}, cleanup: async () => {} };
  }

  const results = await Promise.allSettled(
    mcpConfig.servers.map((s) => connectServer(s))
  );

  const allTools: ToolSet = {};
  const cleanups: Array<() => Promise<void>> = [];

  for (const [i, result] of results.entries()) {
    if (result.status === "fulfilled") {
      Object.assign(allTools, result.value.tools);
      cleanups.push(result.value.cleanup);
    } else {
      console.warn(
        `MCP server "${mcpConfig.servers[i]!.name}" failed to connect:`,
        result.reason
      );
    }
  }

  return {
    tools: allTools,
    cleanup: async () => {
      await Promise.allSettled(cleanups.map((fn) => fn()));
    },
  };
}
