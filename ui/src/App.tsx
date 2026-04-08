import { ChatWindow } from "@/components/chat/ChatWindow"
import { useChat } from "@/hooks/useChat"

export default function App() {
  const { messages, isLoading, connected, sendMessage, clearMessages } = useChat()

  return (
    <ChatWindow
      messages={messages}
      onSend={sendMessage}
      onClear={clearMessages}
      isLoading={isLoading}
      connected={connected}
    />
  )
}
