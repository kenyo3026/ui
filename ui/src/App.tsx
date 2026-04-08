import { ChatWindow } from "@/components/chat/ChatWindow"
import { useChat } from "@/hooks/useChat"

export default function App() {
  const { messages, isLoading, connected, sendMessage } = useChat()

  return (
    <ChatWindow
      messages={messages}
      onSend={sendMessage}
      isLoading={isLoading}
      connected={connected}
    />
  )
}
