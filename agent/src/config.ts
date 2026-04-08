import "dotenv/config";

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  ws: {
    port: parseInt(optional("WS_PORT", "7415")),
  },
  llm: {
    provider: optional("PROVIDER", "openai") as "openai" | "anthropic" | "google" | "openai-compatible",
    model: required("MODEL"),
    apiKey: process.env["API_KEY"],
    baseUrl: process.env["BASE_URL"],
  },
  workspace: optional("WORKSPACE", process.cwd()),
  mcpConfigPath: optional("MCP_CONFIG_PATH", "./mcps.json"),
} as const;
