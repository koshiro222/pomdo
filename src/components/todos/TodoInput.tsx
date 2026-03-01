import { useState } from 'react'

interface TodoInputProps {
  onAdd: (title: string) => void
}

export default function TodoInput({ onAdd }: TodoInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onAdd(title.trim())
      setTitle('')
      setIsExpanded(false)
    }
  }

  const handleBlur = () => {
    if (!title.trim()) {
      setIsExpanded(false)
    }
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-dashed border-white/20 text-cf-subtext hover:text-cf-text hover:border-cf-primary/50 transition-all"
      >
        <span className="material-symbols-outlined">add</span>
        <span className="text-sm">Add a new task...</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
        placeholder="Add a new task..."
        autoFocus
        className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-1 focus:ring-cf-primary focus:border-cf-primary outline-none text-cf-text placeholder:text-cf-subtext"
      />
      <button
        type="submit"
        className="size-10 rounded-lg bg-cf-primary text-white flex items-center justify-center hover:bg-cf-primary/90 transition-colors"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </form>
  )
}
