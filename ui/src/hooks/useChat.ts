import { useCallback, useEffect, useRef, useState } from "react"
import type { Message } from "@/components/chat/MessageBubble"

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:7414/ws"

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)

    ws.onmessage = (event) => {
      const raw = JSON.parse(event.data)
      const role = raw.role as Message["role"]

      if (role === "done") {
        setIsLoading(false)
        return
      }

      if (!["assistant", "tool"].includes(role)) return

      const msg: Message = {
        role,
        content: raw.content ?? "",
        name: raw.name,
        arguments: raw.arguments,
      }

      setMessages((prev) => [...prev, msg])
    }

    return () => ws.close()
  }, [])

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    setMessages((prev) => [...prev, { role: "user", content }])
    setIsLoading(true)
    wsRef.current.send(JSON.stringify({ type: "user_message", content }))
  }, [])

  return { messages, isLoading, connected, sendMessage }
}
