import { useRef, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"

type Props = {
  value: string
  onChange: (value: string) => void
  onSend: (content: string) => void
  onClear: () => void
  disabled?: boolean
}

export function InputBar({ value, onChange, onSend, onClear, disabled = false }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    onChange("")
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
      <div className="flex items-end gap-2 chat-content-width mx-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Send a message... (Enter to send, Shift+Enter for new line)"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-input bg-muted px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 max-h-40 overflow-y-auto"
          style={{ lineHeight: "1.5" }}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="rounded-xl px-5 py-3 h-auto flex items-center gap-1.5"
        >
          Enter
          <kbd className="rounded border border-primary-foreground/30 bg-primary-foreground/10 px-1 py-0.5 font-mono text-[10px]">↵</kbd>
        </Button>
        <Button
          onClick={onClear}
          variant="outline"
          className="rounded-xl px-3 py-3 h-auto flex items-center gap-1.5 text-muted-foreground"
        >
          Clear
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">Ctrl</kbd>
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">K</kbd>
        </Button>
      </div>
    </div>
  )
}
