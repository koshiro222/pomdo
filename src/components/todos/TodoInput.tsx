import { useState } from 'react'

interface TodoInputProps {
  onAdd: (title: string) => void
}

export default function TodoInput({ onAdd }: TodoInputProps) {
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onAdd(title.trim())
      setTitle('')
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
        placeholder="Add a new task..."
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-slate-100 placeholder:text-slate-500"
      />
      <button
        onClick={handleSubmit}
        className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-background-dark transition-colors"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  )
}
