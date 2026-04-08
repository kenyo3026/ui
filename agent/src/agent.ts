import { generateText, stepCountIs, type ModelMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { bashTool } from "./bash.js";
import { config } from "./config.js";
import type { ToolSet } from "./mcp.js";

type AgentOptions = {
  history: ModelMessage[];
  mcpTools?: ToolSet;
  onAssistant: (content: string) => void;
  onTool: (name: string, args: Record<string, unknown>, result: string) => void;
};

function resolveModel() {
  const { provider, model, apiKey, baseUrl } = config.llm;

  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey })(model);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(model);
    case "openai-compatible":
      return createOpenAI({ apiKey, baseURL: baseUrl })(model);
    default:
      return createOpenAI({ apiKey })(model);
  }
}

export async function runAgent({
  history,
  mcpTools = {},
  onAssistant,
  onTool,
}: AgentOptions): Promise<void> {
  const llmModel = resolveModel();

  await generateText({
    model: llmModel,
    messages: history,
    tools: { bash: bashTool, ...mcpTools },
    stopWhen: stepCountIs(50),
    onStepFinish({ text, toolCalls, toolResults }) {
      if (text) onAssistant(text);

      for (const result of toolResults) {
        const call = toolCalls.find((c) => c.toolCallId === result.toolCallId);
        onTool(
          result.toolName,
          (call?.input as Record<string, unknown>) ?? {},
          String(result.output)
        );
      }
    },
  });
}
