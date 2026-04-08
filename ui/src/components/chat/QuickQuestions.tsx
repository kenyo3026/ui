type Props = {
  questions: string[]
  onSelect: (question: string) => void
}

export function QuickQuestions({ questions, onSelect }: Props) {
  if (questions.length === 0) return null

  return (
    <div className="w-56 shrink-0 border-r border-border bg-muted/30 flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-medium text-muted-foreground">Suggested Questions</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            className="w-full text-left rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <span className="mr-1.5 opacity-40">•</span>{q}
          </button>
        ))}
      </div>
    </div>
  )
}
