const STORAGE_KEY = 'pomdo_todos'

export type Todo = {
  id: string
  title: string
  completed: boolean
  completedPomodoros?: number
  order: number
  createdAt: string
  updatedAt: string
}

export type NewTodo = Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateTodo = Partial<Pick<Todo, 'title' | 'completed' | 'completedPomodoros'>>

export type PomodoroSession = {
  id: string
  todoId: string | null
  type: 'work' | 'short_break' | 'long_break'
  startedAt: string
  completedAt: string | null
  durationSecs: number
  createdAt: string
}

export type NewPomodoroSession = Omit<PomodoroSession, 'id' | 'createdAt'>

export type UpdatePomodoroSession = Partial<
  Pick<PomodoroSession, 'completedAt'>
>

// Internal helper function (not exported)
function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch (e) {
    console.error('Failed to save todos to localStorage:', e)
  }
}

const POMODORO_STORAGE_KEY = 'pomdo_pomodoro'

function savePomodoroSessions(sessions: PomodoroSession[]): void {
  try {
    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(sessions))
  } catch (e) {
    console.error('Failed to save pomodoro sessions to localStorage:', e)
  }
}

export const storage = {
  getTodos(): Todo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      const todos = data ? JSON.parse(data) : []
      // 古いデータにorderを付与（createdAt順）
      return todos.map((t: Todo, i: number) => ({
        ...t,
        order: typeof t.order === 'number' ? t.order : i
      }))
    } catch {
      return []
    }
  },

  addTodo(todo: NewTodo): Todo {
    const todos = this.getTodos()
    const now = new Date().toISOString()
    const maxOrder = todos.length > 0 ? Math.max(...todos.map(t => t.order ?? 0)) : -1
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      ...todo,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    }
    const updated = [...todos, newTodo]
    saveTodos(updated)
    return newTodo
  },

  updateTodo(id: string, updates: UpdateTodo): Todo | null {
    const todos = this.getTodos()
    const index = todos.findIndex((t) => t.id === id)
    if (index === -1) return null

    const updated = [...todos]
    updated[index] = {
      ...updated[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    saveTodos(updated)
    return updated[index]
  },

  deleteTodo(id: string): boolean {
    const todos = this.getTodos()
    const filtered = todos.filter((t) => t.id !== id)
    if (filtered.length === todos.length) return false

    saveTodos(filtered)
    return true
  },

  reorder(id: string, newOrder: number): boolean {
    const todos = this.getTodos()
    const oldIndex = todos.findIndex(t => t.id === id)
    if (oldIndex === -1) return false

    const [moved] = todos.splice(oldIndex, 1)
    todos.splice(newOrder, 0, moved)

    // order値を再採番
    todos.forEach((t, i) => { t.order = i })
    saveTodos(todos)
    return true
  },

  clearTodos(): void {
    localStorage.removeItem(STORAGE_KEY)
  },

  getPomodoroSessions(): PomodoroSession[] {
    try {
      const data = localStorage.getItem(POMODORO_STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  addPomodoroSession(session: NewPomodoroSession): PomodoroSession {
    const sessions = this.getPomodoroSessions()
    const now = new Date().toISOString()
    const newSession: PomodoroSession = {
      id: crypto.randomUUID(),
      ...session,
      createdAt: now,
    }
    const updated = [...sessions, newSession]
    savePomodoroSessions(updated)
    return newSession
  },

  updatePomodoroSession(
    id: string,
    updates: UpdatePomodoroSession,
  ): PomodoroSession | null {
    const sessions = this.getPomodoroSessions()
    const index = sessions.findIndex((s) => s.id === id)
    if (index === -1) return null

    const updated = [...sessions]
    updated[index] = {
      ...updated[index],
      ...updates,
    }
    savePomodoroSessions(updated)
    return updated[index]
  },

  clearPomodoroSessions(): void {
    localStorage.removeItem(POMODORO_STORAGE_KEY)
  },
}

// Timer state persistence
const TIMER_STORAGE_KEY = 'pomdo_timer'

export type TimerState = {
  isActive: boolean
  sessionType: 'work' | 'short_break' | 'long_break'
  remainingSecs: number
  pomodoroCount: number
}

export function saveTimerState(state: TimerState): void {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save timer state to localStorage:', e)
  }
}

export function getTimerState(): TimerState | null {
  try {
    const data = localStorage.getItem(TIMER_STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function clearTimerState(): void {
  localStorage.removeItem(TIMER_STORAGE_KEY)
}

// BGM state persistence
const BGM_STORAGE_KEY = 'pomdo_bgm'

export type BgmState = {
  isPlaying: boolean
  currentIndex: number
  volume: number
}

export function saveBgmState(state: BgmState): void {
  try {
    localStorage.setItem(BGM_STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save BGM state to localStorage:', e)
  }
}

export function getBgmState(): BgmState | null {
  try {
    const data = localStorage.getItem(BGM_STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function clearBgmState(): void {
  localStorage.removeItem(BGM_STORAGE_KEY)
}
