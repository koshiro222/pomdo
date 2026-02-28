import { useState, useEffect } from 'react'
import { useTodos } from '../../hooks/useTodos'
import { storage } from '../../lib/storage'
import { X, CloudUpload, Trash } from 'lucide-react'

interface MigrateDialogProps {
  onClose: () => void
}

export default function MigrateDialog({ onClose }: MigrateDialogProps) {
  const { migrateToApi } = useTodos()
  const [localTodos, setLocalTodos] = useState<any[]>([])
  const [migrating, setMigrating] = useState(false)

  useEffect(() => {
    setLocalTodos(storage.getTodos())
  }, [])

  const handleMigrate = async () => {
    setMigrating(true)
    const success = await migrateToApi(localTodos)
    if (success) {
      onClose()
    }
    setMigrating(false)
  }

  const handleSkip = () => {
    storage.clearTodos()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-widget-modal flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="widget p-6 w-full max-w-md m-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-ctp-text">Migrate Todos</h3>
          <button
            onClick={onClose}
            className="text-ctp-overlay0 hover:text-ctp-text transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-ctp-subtext1 mb-4">
          You have {localTodos.length} todo(s) stored locally. Would you like to
          migrate them to the cloud?
        </p>

        <div className="mb-4 max-h-48 overflow-y-auto">
          {localTodos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-2 bg-ctp-surface0/50 rounded-lg mb-2"
            >
              <span
                className={`flex-1 text-sm ${
                  todo.completed ? 'line-through text-ctp-overlay0' : 'text-ctp-text'
                }`}
              >
                {todo.title}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="flex-1 bg-ctp-mauve hover:bg-ctp-mauve/80 text-ctp-base px-4 py-2 rounded-lg transition-colors cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CloudUpload size={16} />
            {migrating ? 'Migrating...' : 'Migrate'}
          </button>
          <button
            onClick={handleSkip}
            disabled={migrating}
            className="flex-1 bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Trash size={16} />
            Skip & Clear
          </button>
        </div>
      </div>
    </div>
  )
}
