import { exec } from "child_process";
import { promisify } from "util";
import { tool } from "ai";
import { z } from "zod";
import { config } from "./config.js";

const execAsync = promisify(exec);

const TIMEOUT_MS = 30_000;
const MAX_OUTPUT_CHARS = 20_000;

function truncate(output: string): string {
  if (output.length <= MAX_OUTPUT_CHARS) return output;
  return output.slice(0, MAX_OUTPUT_CHARS) + `\n...[truncated ${output.length - MAX_OUTPUT_CHARS} chars]`;
}

export const bashTool = tool({
  description:
    "Execute a bash command in the workspace directory. Prefer non-interactive commands. Avoid commands that run indefinitely.",
  inputSchema: z.object({
    command: z.string().describe("The bash command to execute"),
  }),
  execute: async ({ command }) => {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: config.workspace,
        timeout: TIMEOUT_MS,
        shell: "/bin/bash",
      });

      const out = truncate(stdout.trimEnd());
      const err = truncate(stderr.trimEnd());

      if (out && err) return `stdout:\n${out}\n\nstderr:\n${err}`;
      if (out) return out;
      if (err) return `stderr:\n${err}`;
      return "(no output)";
    } catch (err: unknown) {
      if (err && typeof err === "object" && "killed" in err && err.killed) {
        return `Error: command timed out after ${TIMEOUT_MS / 1000}s`;
      }
      const message = err instanceof Error ? err.message : String(err);
      return `Error: ${message}`;
    }
  },
});
