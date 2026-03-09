import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTodos } from '../../hooks/useTodos'
import { storage } from '../../lib/storage'
import { X, CloudUpload, Trash } from 'lucide-react'
import { tapAnimation } from '@/lib/animation'

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
    <AnimatePresence>
      <div className="fixed inset-0 z-widget-modal flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="widget p-6 w-full max-w-md m-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-ctp-text">Migrate Todos</h3>
            <motion.button
              {...tapAnimation}
              onClick={onClose}
              className="text-ctp-overlay0 hover:text-ctp-text transition-colors cursor-pointer"
            >
              <X size={20} />
            </motion.button>
          </div>

          <p className="text-ctp-subtext1 mb-4">
            You have {localTodos.length} todo(s) stored locally. Would you like to
            migrate them to cloud?
          </p>

          <div className="mb-4 max-h-48 overflow-y-auto">
            {localTodos.map((todo, index) => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                className="flex items-center gap-3 p-2 bg-ctp-surface0/50 rounded-lg mb-2"
              >
                <span
                  className={`flex-1 text-sm ${
                    todo.completed ? 'line-through text-ctp-overlay0' : 'text-ctp-text'
                  }`}
                >
                  {todo.title}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMigrate}
              disabled={migrating}
              className="flex-1 bg-ctp-mauve hover:bg-ctp-mauve/80 text-ctp-base px-4 py-2 rounded-lg transition-colors cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CloudUpload size={16} />
              {migrating ? 'Migrating...' : 'Migrate'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSkip}
              disabled={migrating}
              className="flex-1 bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Trash size={16} />
              Skip & Clear
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
