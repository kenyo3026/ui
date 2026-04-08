import { useState } from "react"
import { marked } from "marked"
import { cn } from "@/lib/utils"

export type Message = {
  role: "user" | "assistant" | "tool"
  content: string
  name?: string
  arguments?: Record<string, unknown>
}

type Props = {
  message: Message
}

function Markdown({ content, className }: { content: string; className?: string }) {
  const html = marked(content) as string
  return (
    <div
      className={cn("markdown-content break-words", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function MessageBubble({ message }: Props) {
  const { role, content } = message

  if (role === "tool") {
    return <ToolMessage message={message} />
  }

  const isUser = role === "user"

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        <Markdown content={content} />
      </div>
    </div>
  )
}

function ToolMessage({ message }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[75%] rounded-xl border border-border bg-card text-sm overflow-hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <span className="text-xs">⚙</span>
          <span className="font-mono text-xs">{message.name ?? "tool"}</span>
          <span className="ml-auto text-xs">{open ? "▲" : "▼"}</span>
        </button>
        {open && (
          <div className="border-t border-border px-4 py-3 space-y-2">
            {message.arguments && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Arguments</p>
                <pre className="text-xs bg-muted rounded p-2 overflow-x-auto">
                  {JSON.stringify(message.arguments, null, 2)}
                </pre>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Result</p>
              <pre className="text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap break-words">
                {message.content}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
