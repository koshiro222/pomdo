# Architecture Research

**Domain:** UI/UX改善（レスポンシブ対応、デザイン統一、Stats実装）
**Researched:** 2026-03-21
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Presentation Layer                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  TimerWidget │  │  TodoList    │  │  StatsCard   │  │  BgmPlayer   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │             │
│         └─────────────────┴─────────────────┴─────────────────┘             │
│                                    ↓                                        │
│                        ┌───────────────────┐                                │
│                        │     App.tsx       │                                │
│                        │  (Bento Grid)     │                                │
│                        └─────────┬─────────┘                                │
├──────────────────────────────────┼──────────────────────────────────────────┤
│                                  ↓                                          │
│                        ┌───────────────────┐                                │
│                        │  Custom Hooks     │                                │
│  ┌────────────────────┼───────────────────┼────────────────────┐           │
│  │  useTimer          │  useTodos         │  usePomodoro       │           │
│  │  useAuth           │  useBgm           │  useLocalStorage   │           │
│  └────────────────────┴───────────────────┴────────────────────┘           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                  ↓                                          │
│                        ┌───────────────────┐                                │
│                        │  Data Layer       │                                │
│  ┌────────────────────┼───────────────────┼────────────────────┐           │
│  │  localStorage      │  tRPC Client     │  React Query       │           │
│  │  (ゲストモード)     │  (認証済み)       │  (キャッシュ)       │           │
│  └────────────────────┴───────────────────┴────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **App.tsx** | Bento Gridレイアウト、ブレイクポイント管理 | 12列グリッドシステム、`grid-cols-{n}` と `col-span-{n}` |
| **TimerWidget** | タイマー表示、コントロール | `TimerDisplay` + `TimerControls`、円形プログレス |
| **StatsCard** | 週次統計、グラフ表示 | ローカルストレージからセッションデータを集計 |
| **TodoList** | タスク一覧、フィルター | スクロール可能なリスト、フィルタータブ |
| **BgmPlayer** | 音楽再生、プレイリスト | 展開/縮小アニメーション、音量コントロール |
| **usePomodoro** | セッション管理、localStorage/DB切り替え | ゲスト: localStorage、認証済み: tRPC |
| **useLocalStorage** | ローカルデータ永続化 | useState + useEffectで同期 |

## Recommended Project Structure

```
src/
├── components/
│   ├── layout/           # レイアウトコンポーネント
│   │   ├── Header.tsx    # グローバルヘッダー（ナビゲーション）
│   │   └── Footer.tsx    # グローバルフッター
│   ├── timer/            # タイマー関連
│   │   ├── TimerDisplay.tsx
│   │   ├── TimerControls.tsx
│   │   └── TimerRing.tsx
│   ├── todos/            # タスク管理
│   │   ├── TodoList.tsx
│   │   ├── TodoItem.tsx
│   │   └── TodoInput.tsx
│   ├── stats/            # 統計表示
│   │   └── StatsCard.tsx
│   ├── bgm/              # BGMプレイヤー
│   │   ├── BgmPlayer.tsx
│   │   └── TrackList.tsx
│   └── ui/               # 共通UIコンポーネント
│       └── checkbox.tsx
├── hooks/                # カスタムフック
│   ├── useTimer.ts       # タイマー状態管理
│   ├── usePomodoro.ts    # セッション管理
│   ├── useTodos.ts       # タスクCRUD
│   ├── useAuth.ts        # 認証状態
│   └── useBgm.ts         # BGM再生
├── lib/                  # ユーティリティ
│   ├── storage.ts        # localStorageラッパー
│   ├── animation.ts      # Framer Motionバリアント
│   └── trpc.tsx          # tRPCクライアント
└── index.css             # Tailwind + カスタムスタイル
```

### Structure Rationale

- **`components/`**: 機能領域で分割（timer、todos、stats、bgm）→ 各機能の独立性を確保
- **`hooks/`**: カスタムフックで状態管理とビジネスロジックを分離 → コンポーネントの肥大化防止
- **`lib/storage.ts`**: localStorage操作を一元化 → ゲストモードと認証モードの切り替えを容易に

## Architectural Patterns

### Pattern 1: Bento Grid（ベントグリッド）レイアウト

**What:** CSS Gridを使ったカードベースのダッシュボードレイアウト。各カードが異なるサイズのグリッドセルを占める。

**When to use:** ダッシュボード、 analytics、 複数のウィジェットを1画面に表示する場合

**Trade-offs:**
- ✓ 視覚的階層を作りやすい、情報密度を調整しやすい
- ✗ 複雑なグリッドではレスポンシブ対応が難しくなる

**Example:**
```tsx
// 12列グリッドシステム（Tailwind CSS v4）
<div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4">
  {/* タイマー: デスクトップ8列×2行 */}
  <div className="sm:col-span-4 sm:row-span-2 lg:col-span-8 lg:row-span-2">
    <TimerWidget />
  </div>

  {/* Current Task: 2列×1行 */}
  <div className="sm:col-span-2 sm:row-span-1 lg:col-span-2 lg:row-span-1">
    <CurrentTaskCard />
  </div>

  {/* BGM: 2列×1行 */}
  <div className="sm:col-span-2 sm:row-span-1 lg:col-span-2 lg:row-span-1">
    <BgmPlayer />
  </div>

  {/* Stats: 4列×1行 */}
  <div className="sm:col-span-2 sm:row-span-1 lg:col-span-4 lg:row-span-1">
    <StatsCard />
  </div>

  {/* Todo: 12列×1行（全幅） */}
  <div className="sm:col-span-6 sm:row-span-1 lg:col-span-12 lg:row-span-1">
    <TodoList />
  </div>
</div>
```

**ブレイクポイント設計（Tailwind CSS v4 デフォルト）:**
| プレフィックス | 最小幅 | 使用ケース |
|---------------|---------|-----------|
| （なし） | 0px | モバイル（デフォルトスタイル） |
| `sm:` | 640px | タブレット縦、大型スマホ |
| `md:` | 768px | タブレット横、小型ノート |
| `lg:` | 1024px | デスクトップ、ラップトップ |
| `xl:` | 1280px | 大型デスクトップ |
| `2xl:` | 1536px | 超ワイドディスプレイ |

### Pattern 2: Custom Hook for Data Persistence

**What:** localStorageへの読み書きをカスタムフックにカプセル化し、React状態と同期するパターン。

**When to use:** ユーザー設定、一時データ、ゲストモードでのデータ永続化

**Trade-offs:**
- ✓ コンポーネントからデータ永続化ロジックを分離、再利用可能
- ✗ レースコンディションのリスク（mount時の読み込み）

**Example:**
```typescript
// storage.ts
export const storage = {
  getPomodoroSessions(): PomodoroSession[] {
    try {
      const data = localStorage.getItem('pomdo_pomodoro')
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  addPomodoroSession(session: NewPomodoroSession): PomodoroSession {
    const sessions = this.getPomodoroSessions()
    const newSession = {
      id: crypto.randomUUID(),
      ...session,
      createdAt: new Date().toISOString(),
    }
    const updated = [...sessions, newSession]
    localStorage.setItem('pomdo_pomodoro', JSON.stringify(updated))
    return newSession
  },
}

// usePomodoro.ts
export function usePomodoro() {
  const { user } = useAuth()
  const [localSessions, setLocalSessions] = useState<Session[]>([])

  // ゲストモード: localStorage、認証済み: tRPC
  const sessions = user
    ? (sessionsQuery.data ?? [])
    : localSessions

  const startSession = async (type: SessionType, durationSecs: number) => {
    if (user) {
      return await createSessionMutation.mutateAsync({ type, durationSecs })
    } else {
      const created = storage.addPomodoroSession({ type, durationSecs, ... })
      setLocalSessions((prev) => [...prev, created])
      return created
    }
  }

  return { sessions, startSession, ... }
}
```

### Pattern 3: Framer Motion Layout Animation

**What:** Framer Motionの`layout` propと`AnimatePresence`を使ったスムーズなレイアウトトランジション。

**When to use:** グリッドの再配置、リスト項目の追加/削除、展開/折りたたみ

**Trade-offs:**
- ✓ ユーザー体験の向上、状態遷移の視覚化
- ✗ パフォーマンスへの影響（多くの要素でアニメーションすると重い）

**Example:**
```tsx
import { motion, AnimatePresence } from 'framer-motion'

// グリッドカードのスタガードアニメーション
<motion.div
  className="glass rounded-3xl overflow-hidden sm:col-span-4 lg:col-span-8"
  variants={fadeInUpVariants}
  initial="hidden"
  animate="visible"
  custom={0} // 遅延インデックス
  layout // レイアウト変化をアニメート
>
  <TimerWidget />
</motion.div>

// 展開/折りたたみアニメーション
<AnimatePresence>
  {isExpanded && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 展開コンテンツ */}
    </motion.div>
  )}
</AnimatePresence>
```

## Data Flow

### Request Flow

```
[User Action] タイマー開始ボタンクリック
    ↓
[TimerControls] onClickハンドラ
    ↓
[useTimer] start()関数
    ↓
[usePomodoro] startSession(type, durationSecs)
    ↓
    ├── [user authenticated] → tRPC createSession.mutateAsync()
    │                                ↓
    │                           [API] pomodoroRouter.createSession
    │                                ↓
    │                           [DB] pomodoro_sessions テーブル
    │
    └── [guest mode] → storage.addPomodoroSession()
                         ↓
                      [localStorage] pomdo_pomodoro キー
    ↓
[React Query] invalidateQueries → データ再取得
    ↓
[Component] 再レンダリング → UI更新
```

### State Management

```
[Local Storage] ←→ [Custom Hooks] ←→ [Components]
     ↓                  ↓                  ↓
  pomdo_todos      useTodos          TodoList
  pomdo_pomodoro   usePomodoro       StatsCard
  pomdo_timer      useTimer          TimerWidget
  pomdo_bgm        useBgm            BgmPlayer

同期フロー:
1. マウント時: localStorage → useState
2. 更新時: useState更新 → useEffectでlocalStorageに保存
3. ログイン時: localStorageデータ → tRPCでDBにマイグレーション
```

### Key Data Flows

1. **Statsデータフロー（localStorage → 表示）:**
   - `usePomodoro`フックが`storage.getPomodoroSessions()`でセッションデータを取得
   - `StatsCard`コンポーネントが`sessions`を受け取り、本日・週次データを集計
   - 週次チャートは`weeklyData.map()`で各日のバーを描画
   - **問題点**: `sessions`が空の場合、グラフが表示されない

2. **レスポンシブグリッドフロー:**
   - デフォルト（モバイル）: `grid-cols-1`（1列）
   - `sm:`以上: `sm:grid-cols-6`（6列）
   - `lg:`以上: `lg:grid-cols-12`（12列）
   - 各カードは`col-span-{n}`で幅を指定
   - **問題点**: スマートフォンで要素が重なることがある

3. **selectedTaskデータフロー:**
   - `TodoList`でタスククリック → `setSelectedTodoId(id)`
   - `CurrentTaskCard`が`selectedTodoId`に対応するタスクを表示
   - タスク完了時 → `setSelectedTodoId(null)`で選択解除

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | 現行アーキテクチャで対応可能。localStorage + tRPCハイブリッド |
| 1k-100k users | React Queryのキャッシュ戦略を見直し、APIレスポンスの最適化 |
| 100k+ users | Stats集計をDBで行うAPIを作成、CDNで静的アセット配信 |

### Scaling Priorities

1. **First bottleneck:** Statsの週次集計処理
   - セッション数が増えるとクライアント側での集計が重くなる
   - **解決策**: `pomodoroRouter`に集計エンドポイントを追加

2. **Second bottleneck:** localStorageの容量制限（5-10MB）
   - ゲストモードで長期間使用すると容量超過のリスク
   - **解決策**: 古いセッションデータの自動削除、IndexedDBへの移行

## Anti-Patterns

### Anti-Pattern 1: ブレイクポイントの乱用

**What people do:** すべての画面サイズに対応しようとして過剰にブレイクポイントを設定

**Why it's wrong:** コードが複雑になり、メンテナンスが困難になる

**Do this instead:**
- モバイルファーストでデフォルトスタイルを定義
- 必要最小限のブレイクポイント（`sm:`, `lg:`）のみ使用
- ```tsx
  // Bad
  <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">

  // Good
  <div className="text-sm sm:text-base lg:text-lg">
  ```

### Anti-Pattern 2: localStorageへの直接的アクセス

**What people do:** 各コンポーネントで直接`localStorage.getItem()`を呼ぶ

**Why it's wrong:** データの不整合、テスト困難、エラーハンドリングの重複

**Do this instead:**
- `lib/storage.ts`のような一元化されたアクセスレイヤーを作成
- カスタムフック経由でアクセス
- ```tsx
  // Bad
  const sessions = JSON.parse(localStorage.getItem('pomdo_pomodoro') || '[]')

  // Good
  const { sessions } = usePomodoro()
  ```

### Anti-Pattern 3: グリッドカラムの固定

**What people do:** すべての画面サイズで同じグリッド構造を使用

**Why it's wrong:** モバイルでカードが潰れたり、重なったりする

**Do this instead:**
- モバイルでは1列、タブレットでは中程度の列数、デスクトップで最大列数
- カードサイズに応じて`col-span`を調整
- ```tsx
  // Bad: モバイルでも12列
  <div className="grid grid-cols-12 gap-4">

  // Good: モバイルで1列、デスクトップで12列
  <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4">
  ```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| tRPC API | `trpc.{router}.{procedure}.useQuery()` | 認証済みユーザーのみ使用 |
| Google OAuth | Better Auth Client | `/api/auth/*` エンドポイント |
| React Query | `@tanstack/react-query` | tRPCが内部的に使用 |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Components ↔ Hooks | Props return値 | hooksはUIを持たない純粋なロジック |
| Hooks ↔ Storage | 関数呼び出し | 非同期処理は`async/await` |
| Guest Mode ↔ Auth Mode | `user`状態で分岐 | `useAuth()`で判定 |

## 統合ポイント（v1.2で新規実装）

### 1. レスポンシブ対応の統合ポイント

**新規コンポーネント:**
- なし（既存コンポーネントのTailwindクラス調整）

**変更コンポーネント:**
- `App.tsx`: Bento Gridのグリッド定義を修正
  - 現在: `grid-cols-1 sm:grid-cols-6 lg:grid-cols-12`
  - 課題: スマートフォンで要素が重なる
  - 解決策: `gap`の調整、カード内の`padding`最適化

- 全コンポーネント: レスポンシブなサイズ指定
  - タイマー: `text-5xl sm:text-6xl lg:text-7xl`
  - カード内パディング: `p-4 sm:p-6`

**統合方法:**
```tsx
// App.tsx
<main className="flex-1 p-2 sm:p-4 overflow-y-auto sm:overflow-hidden">
  <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-2 sm:gap-4">
    {/* 各カード */}
  </div>
</main>
```

### 2. グリッドデザイン統一

**新規コンポーネント:**
- `src/components/ui/BentoCard.tsx`（共通カードラッパー）

**変更コンポーネント:**
- 全カードコンポーネントが`BentoCard`を使用

**統合方法:**
```tsx
// src/components/ui/BentoCard.tsx（新規）
interface BentoCardProps {
  children: React.ReactNode
  className?: string
}

export function BentoCard({ children, className = '' }: BentoCardProps) {
  return (
    <div className={`glass rounded-3xl overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

// 使用例
<BentoCard className="sm:col-span-4 lg:col-span-8">
  <TimerWidget />
</BentoCard>
```

### 3. Statsデータフローの設計

**新規機能:**
- 週次統計のリアルタイム更新
- グラフのアニメーション改善

**変更コンポーネント:**
- `StatsCard.tsx`: データ集計ロジックの強化

**データフロー:**
```
[localStorage: pomdo_pomodoro]
    ↓
[usePomodoro: sessions state]
    ↓
[StatsCard: 集計処理]
    ├── 今日: sessions.filter(今日 &完了).reduce(集計)
    └── 週次: 7日分のデータをmapで生成
    ↓
[表示: カウント + チャート]
```

**課題解決:**
```tsx
// 現在の問題点
const { sessions } = usePomodoro()
// → sessionsが空の場合、何も表示されない

// 解決策: ローディング状態と空状態を明示的に実装
const { sessions, loading } = usePomodoro()

if (loading) return <div>Loading...</div>
if (sessions.length === 0) return <div>No data yet</div>
```

### 4. selectedTask UXの改善

**変更コンポーネント:**
- `CurrentTaskCard.tsx`: 選択時の視覚的フィードバック強化
- `TodoList.tsx`: 選択状態の表示改善

**データフロー:**
```
[TodoItem クリック]
    ↓
[handleTodoClick] → setSelectedTodoId(id)
    ↓
[useTodos: selectedTodoId state]
    ↓
[CurrentTaskCard: 選択タスクを表示]
[TodoItem: 選択状態のハイライト]
```

**UX改善案:**
- 選択時にアニメーションでフィードバック
- タイマー起動中は選択タスクを強調表示
- 完了時に次のタスクを自動選択するオプション

## Sources

- [Tailwind CSS - Responsive Design](https://tailwindcss.com/docs/responsive-design) (HIGH confidence - 公式ドキュメント)
- [Tailwind CSS v4.2 Release Notes](https://tailwindcss.com/blog) (MEDIUM confidence - 公式ブログ)
- [Framer Motion - Layout Animations](https://www.framer.com/motion/layout-animation/) (MEDIUM confidence - 公式ドキュメント)
- 既存コードベースの分析 (`src/App.tsx`, `src/hooks/usePomodoro.ts`, etc.)

---
*Architecture research for: UI/UX改善（レスポンシブ対応、デザイン統一、Stats実装）*
*Researched: 2026-03-21*
