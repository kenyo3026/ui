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
  rulesSection?: string;
  onAssistant: (content: string) => void;
  onTool: (name: string, args: Record<string, unknown>, result: string) => void;
};

function buildSystemPrompt(rulesSection: string): string {

  return `
You are a powerful agentic AI coding assistant.

You are pair programming with a USER to solve their coding task.
The task may require creating a new codebase, modifying or debugging an existing codebase, or simply answering a question.
Your main goal is to follow the USER's instructions at each message.

<tool_calling>
You have tools at your disposal to solve the coding task. Follow these rules regarding tool calls:
1. ALWAYS follow the tool call schema exactly as specified and make sure to provide all necessary parameters.
2. NEVER refer to tool names when speaking to the USER. Instead, just say what the tool is doing in natural language.
3. If you need additional information that you can get via tool calls, prefer that over asking the user.
4. Make a plan and immediately follow it without waiting for user confirmation.
5. If you are not sure about file content or codebase structure, use your tools to read files and gather information. Do NOT guess.
6. You can autonomously run as many commands as needed to fully resolve the user's request.
</tool_calling>

<making_code_changes>
When making code changes, NEVER output code to the USER unless requested. Use tools to implement changes directly.

Ensure your generated code can be run immediately:
1. Add all necessary imports, dependencies, and configuration.
2. Never generate binary or non-textual content.
3. If you introduce errors, fix them. Do not loop more than 3 times on the same linter error — ask the user instead.
</making_code_changes>

<code_style>
Write clear, readable code optimized for human review.

Naming:
- Avoid short variable names. Never use 1-2 character names.
- Functions should be verbs/verb-phrases, variables should be nouns/noun-phrases.
- Use meaningful, descriptive names. Prefer full words over abbreviations.

Typed languages:
- Explicitly annotate function signatures and exported APIs.
- Avoid unsafe typecasts or broad types like any.

Control flow:
- Use guard clauses and early returns.
- Handle error and edge cases first.
- Avoid deep nesting beyond 2-3 levels.

Comments:
- Do not comment trivial or obvious code.
- Add comments for complex logic; explain "why" not "how".
- Avoid TODO comments — implement instead.
</code_style>

<environment>
The user's workspace is: ${config.workspace}
Platform: ${process.platform}
Shell: ${process.env["SHELL"] ?? "/bin/bash"}
</environment>

Do what has been asked; nothing more, nothing less.
${rulesSection ? `\n${rulesSection}` : ""}
`.trim();
}

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
  rulesSection = "",
  onAssistant,
  onTool,
}: AgentOptions): Promise<void> {
  const llmModel = resolveModel();

  await generateText({
    model: llmModel,
    system: buildSystemPrompt(rulesSection),
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
