# CONVENTIONS.md — Code Style & Patterns

## TypeScript設定（strict mode）

```json
// tsconfig.app.json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedSideEffectImports": true
}
```

## コンポーネントパターン

### Props定義
```typescript
// interface で厳密に定義・エクスポート
export interface CurrentTaskCardProps {
  selectedTodoId: string | null
  todos: Todo[]
  onSelectTodo: (id: string | null) => void
}

export const CurrentTaskCard: React.FC<CurrentTaskCardProps> = ({ ... }) => { ... }
```

### メモ化
```typescript
// イベントハンドラーは useCallback でメモ化
const handleSelect = useCallback((id: string) => {
  setSelectedTodoId(id)
}, [setSelectedTodoId])
```

### 条件レンダリング
```typescript
// 三項演算子で状態別表示
{selectedTodo ? (
  <div className="...">{selectedTodo.title}</div>
) : (
  <div className="text-gray-400">タスクを選択してください</div>
)}
```

### Tailwind + clsx/cn パターン
```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === 'error' && "error-class"
)} />
```

## Framer Motionパターン

```typescript
// src/lib/animation.ts に統一定義
export const tapAnimation = { scale: 0.95 }
export const hoverAnimation = { scale: 1.02 }

// 使用側
<motion.button
  whileTap={tapAnimation}
  whileHover={hoverAnimation}
>
```

## カスタムフックパターン

### インターフェース定義
```typescript
export interface UseTimerReturn {
  isActive: boolean
  sessionType: SessionType
  remainingSecs: number
  start: () => void
  pause: () => void
  reset: () => void
}

export interface UseTimerOptions {
  onSessionComplete?: (type: SessionType) => void
}

export function useTimer(options?: UseTimerOptions): UseTimerReturn { ... }
```

### Zustand ストア連携
```typescript
const {
  isActive,
  sessionType,
  start,
  pause
} = useTimerStore()
```

### エラーハンドリング
```typescript
try {
  await createMutation.mutateAsync({ title })
} catch (e) {
  const msg = e instanceof Error ? e.message : 'Failed to add todo'
  setError(msg)
}
```

## Zustand ストアパターン

### 型定義の階層化
```typescript
interface TimerState {
  isActive: boolean
  sessionType: SessionType
  remainingSecs: number
}

interface TimerActions {
  start: () => void
  pause: () => void
  reset: () => void
}

type TimerStore = TimerState & TimerActions

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      // state
      isActive: false,
      sessionType: 'work',
      remainingSecs: 25 * 60,

      // actions
      start: () => set({ isActive: true }),
      pause: () => set({ isActive: false }),
    }),
    {
      name: 'pomdo_timer',
      partialize: (state) => ({
        // isActive は永続化しない（リロード時はポーズ状態）
        sessionType: state.sessionType,
        remainingSecs: state.remainingSecs,
      }),
    }
  )
)
```

## tRPCエラーハンドリング

```typescript
// ✅ 正しい: TRPCError を使用
import { TRPCError } from '@trpc/server'

throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Todo not found'
})

throw new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'Authentication required'
})

// ❌ 禁止: new Error() は INTERNAL_SERVER_ERROR になる
throw new Error('Todo not found')
```

## localStorage ラッパーパターン

```typescript
// src/lib/storage.ts 経由でアクセス（直接 localStorage は使わない）
import { storage } from '@/lib/storage'

storage.getTodos()
storage.addTodo({ title })
storage.clearTodos()
```

## ゲスト/ログイン分岐パターン

```typescript
// useAuth から user を取得して分岐
const { user } = useAuth()

// データ取得
const todos = user ? (todosQuery.data ?? []) : localTodos

// 書き込み
if (user) {
  await createMutation.mutateAsync(input)
} else {
  storage.addTodo(input)
}
```

## Zodスキーマパターン

```typescript
// src/app/routers/_shared.ts に共通スキーマを定義
export const createTodoSchema = z.object({
  title: z.string().min(1).max(255),
})

// ルーターでの使用
create: protectedProcedure
  .input(createTodoSchema)
  .mutation(async ({ ctx, input }) => { ... })
```

## インポート規則

```typescript
// パスエイリアス @/* を使用（相対パス禁止）
import { useTimerStore } from '@/core/store/timer'
import { cn } from '@/lib/utils'
import { storage } from '@/lib/storage'

// 型のみのインポートは export type を使用
export type { TimerState, SessionType }
```

## 命名規則まとめ

| 対象 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `TodoItem`, `BgmPlayer` |
| フック | `use` + PascalCase | `useTimer`, `useTodos` |
| ストア | `use` + Name + `Store` | `useTimerStore` |
| インターフェース | PascalCase | `TimerState`, `UseTimerReturn` |
| 定数 | SCREAMING_SNAKE_CASE | `WORK_DURATION_SECS` |
| tRPCプロシージャ | camelCase | `getAll`, `createSession` |
| DBテーブル | camelCase | `todos`, `pomodoroSessions` |
| localStorage キー | `pomdo_` プレフィックス | `pomdo_timer`, `pomdo_todos` |
