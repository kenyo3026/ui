import { useState, useRef, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"

type Props = {
  onSend: (content: string) => void
  disabled?: boolean
}

export function InputBar({ onSend, disabled = false }: Props) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="輸入訊息… (Enter 送出，Shift+Enter 換行)"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-input bg-muted px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 max-h-40 overflow-y-auto"
          style={{ lineHeight: "1.5" }}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="rounded-xl px-5 py-3 h-auto"
        >
          送出
        </Button>
      </div>
    </div>
  )
}
