import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, extname } from "path";

type RuleFrontmatter = {
  alwaysApply: boolean;
  description: string;
};

type ParsedRule = {
  frontmatter: RuleFrontmatter;
  content: string;
  filePath: string;
};

type LoadedRules = {
  alwaysApply: ParsedRule[];
  requestable: ParsedRule[];
};

const FRONTMATTER_PATTERN = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

function parseFrontmatter(raw: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    if (value.toLowerCase() === "true") result[key] = true;
    else if (value.toLowerCase() === "false") result[key] = false;
    else result[key] = value;
  }

  return result;
}

function parseMdcFile(filePath: string): ParsedRule {
  const raw = readFileSync(filePath, "utf-8");
  const match = FRONTMATTER_PATTERN.exec(raw.trim());

  if (!match) {
    return {
      frontmatter: { alwaysApply: false, description: "" },
      content: raw.trim(),
      filePath,
    };
  }

  const metadata = parseFrontmatter(match[1]!);

  return {
    frontmatter: {
      alwaysApply: metadata["alwaysApply"] === true,
      description: typeof metadata["description"] === "string" ? metadata["description"] : "",
    },
    content: match[2]!.trim(),
    filePath,
  };
}

function collectMdcFiles(rulesPath: string): string[] {
  const resolved = resolve(rulesPath);
  const stat = statSync(resolved);

  if (stat.isFile()) {
    if (extname(resolved) !== ".mdc") return [];
    return [resolved];
  }

  if (stat.isDirectory()) {
    return readdirSync(resolved)
      .filter((name) => extname(name) === ".mdc")
      .sort()
      .map((name) => resolve(resolved, name));
  }

  return [];
}

export function loadRules(rulesPath: string): LoadedRules {
  const files = collectMdcFiles(rulesPath);

  const alwaysApply: ParsedRule[] = [];
  const requestable: ParsedRule[] = [];

  for (const filePath of files) {
    try {
      const rule = parseMdcFile(filePath);
      if (rule.frontmatter.alwaysApply) {
        alwaysApply.push(rule);
      } else {
        requestable.push(rule);
      }
    } catch (err) {
      console.warn(`Failed to load rule file ${filePath}:`, err);
    }
  }

  return { alwaysApply, requestable };
}

export function formatRulesPrompt(rules: LoadedRules): string {
  const sections: string[] = [];

  if (rules.alwaysApply.length > 0) {
    const content = rules.alwaysApply.map((r) => r.content).join("\n\n");
    sections.push(
      `<always_applied_workspace_rules>\n${content}\n</always_applied_workspace_rules>`
    );
  }

  if (rules.requestable.length > 0) {
    const list = rules.requestable
      .map((r) => `- ${r.frontmatter.description}: ${r.filePath}`)
      .join("\n");
    sections.push(
      `<agent_requestable_workspace_rules description="Rules available on request. Read the file with bash to load the full content when needed.">\n${list}\n</agent_requestable_workspace_rules>`
    );
  }

  return sections.join("\n\n");
}
