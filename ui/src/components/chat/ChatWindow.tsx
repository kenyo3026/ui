import { useEffect, useRef, useState } from "react"
import { MessageBubble, type Message } from "./MessageBubble"
import { InputBar } from "./InputBar"
import { QuickQuestions } from "./QuickQuestions"
import suggestedQuestionsConfig from "@suggested-questions"

type Props = {
  messages: Message[]
  onSend: (content: string) => void
  onClear: () => void
  isLoading?: boolean
  connected?: boolean
}

function ThinkingBubble() {
  const [dots, setDots] = useState(".")

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."))
    }, 400)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex w-full justify-start">
      <div className="bg-muted text-muted-foreground rounded-2xl rounded-bl-sm px-4 py-3 text-sm font-mono tracking-widest">
        thinking {dots}
      </div>
    </div>
  )
}

export function ChatWindow({ messages, onSend, onClear, isLoading = false, connected = false }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault()
        onClear()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClear])

  const handleQuickSelect = (question: string) => {
    setInputValue(question)
  }

  const suggestedQuestions: string[] = suggestedQuestionsConfig.questions

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-400"}`} />
        <span className="font-semibold text-sm">Drowdroid</span>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Quick Questions sidebar */}
        <QuickQuestions questions={suggestedQuestions} onSelect={handleQuickSelect} />

        {/* Chat area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="chat-content-width mx-auto space-y-4">
              {messages.length === 0 && !isLoading && (
                <div className="flex items-center justify-center h-full min-h-[40vh]">
                  <p className="text-muted-foreground text-sm">Send a message to start.</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const lastIndexOfRole = messages.findLastIndex((m) => m.role === msg.role)
                return <MessageBubble key={i} message={msg} showAvatar={i === lastIndexOfRole} />
              })}
              {isLoading && <ThinkingBubble />}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <InputBar
            value={inputValue}
            onChange={setInputValue}
            onSend={onSend}
            onClear={onClear}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
