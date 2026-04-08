import { useEffect, useRef } from "react"
import { MessageBubble, type Message } from "./MessageBubble"
import { InputBar } from "./InputBar"

type Props = {
  messages: Message[]
  onSend: (content: string) => void
  isLoading?: boolean
  connected?: boolean
}

export function ChatWindow({ messages, onSend, isLoading = false, connected = false }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-400"}`} />
        <span className="font-semibold text-sm">Drowdroid</span>
        {isLoading && (
          <span className="text-xs text-muted-foreground animate-pulse">
            thinking...
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[40vh]">
              <p className="text-muted-foreground text-sm">
                輸入訊息開始對話
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <InputBar onSend={onSend} disabled={isLoading} />
    </div>
  )
}
