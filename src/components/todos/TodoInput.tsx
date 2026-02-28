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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a todo..."
        className="flex-1 bg-ctp-surface0 border border-ctp-surface1 rounded-lg px-3 py-2 text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:ring-2 focus:ring-ctp-mauve"
      />
      <button
        type="submit"
        className="bg-ctp-mauve hover:bg-ctp-mauve/80 text-ctp-base px-4 py-2 rounded-lg transition-colors cursor-pointer font-bold"
      >
        Add
      </button>
    </form>
  )
}
