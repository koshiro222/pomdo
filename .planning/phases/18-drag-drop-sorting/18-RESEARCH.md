# Phase 18: ドラッグ&ドロップ並び替え - Research

**Researched:** 2026-03-25
**Domain:** React DnDライブラリ + DBスキーマ変更 + State管理
**Confidence:** HIGH

## Summary

Phase 18では、タスクのドラッグ&ドロップによる並び替え機能を実装する。CONTEXT.mdで`@dnd-kit/core` + `@dnd-kit/sortable`の使用が決定済み。Framer Motionの`layout` propとの併用が可能で、Phase 17で実装済みのスムーズなアニメーションを維持しながらDnD機能を追加できる。

主要な技術的課題は2つ：DBスキーマ変更（orderカラム追加）と既存データのマイグレーション。Edge Runtime（Cloudflare Workers）の制約下でDrizzle ORMを使用してPostgreSQLにorderカラムを追加し、既存データをcreatedAt順にorder値で初期化する必要がある。

**Primary recommendation:** CONTEXT.mdの決定に従い、`@dnd-kit/core` + `@dnd-kit/sortable`を導入し、既存のTodoItem/TodoListコンポーネントにDnDロジックを統合する。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- DND-01: ドラッグ&ドロップライブラリ — `@dnd-kit/core` + `@dnd-kit/sortable` を使用
- 理由: React 18対応、Framer Motionの`layout` propと併用可能、パフォーマンス良好
- 使用するAPI: `SortableContext`、`useSortable`、`arrayMove`
- 順序データモデル: orderカラムは整数、初期値は最大order + 1
- 既存データ移行: createdAt順でorderを割り当て（0, 1, 2...）
- 更新戦略: 移動範囲内のみorderを更新（効率的）
- DND-02: 永続化と同期 — `onDragEnd`即時更新、楽観的更新なし
- ゲスト→ログイン移行: ローカルストレージのorder値をDBに保持

### Claude's Discretion
- ドラッグ中のアイテムの具体的なスタイル（opacity、scale等）
- プレースホルダーの詳細デザイン
- エラー発生時のロールバック処理
- 完了済みタスクのD&D可否（基本的には有効だが、UX判断で制限しても良い）

### Deferred Ideas (OUT of SCOPE)
- サブタスクの並び替え — 別Issue
- リスト間のタスク移動（Current Task ↔ Todoリスト） — 別Issue
- キーボードショートカットでの並び替え — v2検討
- ドラッグ中にタスクを一時的に「固定」する機能 — 要望があれば検討
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DND-01 | タスクをドラッグして並び替えができる | @dnd-kit/sortableのSortableContext + useSortableで実装可能。既存のGripVerticalハンドルをlistenersに接続。 |
| DND-02 | 並び替えた順序が保存される（DB: orderカラム追加、ゲスト: localStorage） | Drizzle ORMでorderカラム追加。tRPCでreorder mutation実装。storage.tsにorderフィールド追加。 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | 6.3.1 | DnDコンテキスト提供 | React 18対応、Framer Motionと併用可能、パフォーマンス最適化済み |
| @dnd-kit/sortable | 10.0.0 | ソート可能リスト実装 | SortableContext、useSortable、arrayMove提供 |
| @dnd-kit/utilities | 3.2.2 | DnDユーティリティ | 座標計算、センサー構築ヘルパー |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| framer-motion | 12.35.1 | レイアウトアニメーション | 既存使用中。DnD中のスムーズスライドに継続利用 |
| drizzle-orm | (installed) | DBスキーマ変更 | orderカラム追加、マイグレーション生成 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit | react-beautiful-dnd | メンテナンス停止中、React 18 Strict Mode非対応 |
| @dnd-kit | react-dnd | 複雑なセットアップ、バックエンド必要 |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Version verification:**
```bash
npm view @dnd-kit/core version  # 6.3.1 (confirmed)
npm view @dnd-kit/sortable version  # 10.0.0 (confirmed)
npm view @dnd-kit/utilities version  # 3.2.2 (confirmed)
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/todos/
│   ├── TodoList.tsx     # DndContext, SortableContext追加
│   └── TodoItem.tsx     # useSortableフック追加
├── hooks/
│   └── useTodos.ts      # reorderTodoメソッド追加
├── lib/
│   └── storage.ts       # Todo型にorder追加、reorderメソッド追加
└── app/routers/
    └── todos.ts         # reorder mutation追加
```

### Pattern 1: dnd-kit + Framer Motion 併用
**What:** DnD中にFramer Motionのlayout propでアイテムをスムーズにスライド
**When to use:** ソート可能なリストでアニメーションが必要な場合
**Example:**
```tsx
// Source: https://docs.dndkit.com/presets/sortable
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// TodoList内で使用
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
    {todos.map(todo => <SortableItem key={todo.id} id={todo.id}><TodoItem {...props} /></SortableItem>)}
  </SortableContext>
</DndContext>
```

### Pattern 2: arrayMoveで効率的並び替え
**What:** @dnd-kit/utilitiesのarrayMoveで配列要素を移動
**When to use:** ドラッグ完了後の配列並び替え
**Example:**
```tsx
import { arrayMove } from '@dnd-kit/sortable';

const handleDragEnd = (event) => {
  const { active, over } = event;
  if (active.id !== over.id) {
    setTodos((items) => {
      const oldIndex = items.findIndex((t) => t.id === active.id);
      const newIndex = items.findIndex((t) => t.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }
};
```

### Pattern 3: Sensor構築（マウス + タッチ）
**What:** PointerSensorでマウスとタッチ両対応
**When to use:** デスクトップとモバイル両対応が必要な場合
**Example:**
```tsx
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 8px移動でドラッグ開始（誤操作防止）
    },
  })
);
```

### Anti-Patterns to Avoid
- **AnimatePresence内で直接SortableItem使用**: AnimatePresenceとSortableContextの組み合わせは複雑。外側でDndContext、内側でAnimatePresenceの構造推奨
- **keyがないmap**: dnd-kitは安定したidをキーに要求
- **フィルター済み配列をSortableContextに渡す**: filteredTodosではなく全todosを渡し、フィルタリングは表示側で処理

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ドラッグ検出 | マウス/タッチイベント自作 | PointerSensor | 座標計算、アクティベーション制約、アクセシビリティ考慮済み |
| 衝突検出 | 距離計算自�作 | closestCenter | パフォーマンス最適化、エッジケース対応済み |
| 配列並び替え | splice等で自作 | arrayMove | バグりやすいインデックス計算を隠蔽 |
| 座標変換 | CSS transform自作 | CSS.Transform.toString() | ブラウザ互換性、GPUアクセラレーション考慮済み |

**Key insight:** DnDは見た目簡単だがエッジケースが多岐（境界、スクロール、タッチ、アクセシビリティ）。@dnd-kitはこれらを網羅済み。

## Common Pitfalls

### Pitfall 1: AnimatePresenceとの競合
**What goes wrong:** 削除アニメーションとDnDが競合し、アイテムが消えたり配置が壊れる
**Why it happens:** AnimatePresenceが exitingアイテムをDOMに残すが、SortableContextはこれを認識できない
**How to avoid:**
- AnimatePresenceのmode="popLayout"を使用（Phase 17で実装済み）
- SortableContextには常に安定した全件リストを渡す
- 削除はDnD中に無効化（完了済みタスクのD&D制限等）
**Warning signs:** アイテム削除時にDnDが壊れる、位置が飛ぶ

### Pitfall 2: フィルタリング時のDnD
**What goes wrong:** Active/Doneフィルター中にドラッグすると、ドロップ先が見つからないエラー
**Why it happens:** filteredTodosのみをSortableContextに渡すと、over.idが全件配列に存在しない
**How to avoid:** 常に全todosをSortableContextに渡し、filteredTodosは表示のみに使用
**Warning signs:** "Cannot find droppable area"エラー、ドロップできない

### Pitfall 3: DB更新の競合
**What goes wrong:** 連続DnDでorder値が重複・欠損
**Why it happens:** 複数のAPIリクエストが並列実行され、古いorder値で上書き
**How to avoid:**
- onDragEnd即時更新（CONTEXT.md決定）
- 楽観的更新なし（CONTEXT.md決定）
- 必要に応じてdebounceやmutex導入（Claude's Discretion）
**Warning signs:** リロード後順序が狂う、order値に重複

### Pitfall 4: Edge Runtimeでのマイグレーション
**What goes wrong:** Node.js API依存のマイグレーションスクリプトが失敗
**Why it happens:** DrizzleマイグレーションはデフォルトでNode.jsランタイム
**How to avoid:**
- `wrangler pages dev`環境で`npm run db:migrate`実行
- 本番はCloudflare Pagesのマイグレーションフック使用
**Warning signs:** "crypto is not defined"等のNode.jsエラー

## Code Examples

Verified patterns from official sources:

### Sensor構築（マウス + タッチ対応）
```tsx
// Source: https://docs.dndkit.com/docs/api-docs/sensor
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 8pxドラッグで有効化（クリック誤検出防止）
    },
  })
);
```

### useSortableフック統合（TodoItem用）
```tsx
// Source: https://docs.dndkit.com/presets/sortable
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function TodoItemWithDnD({ id, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <motion.button {...listeners} {...attributes}>
        <GripVertical />
      </motion.button>
      {/* 既存TodoItemコンテンツ */}
    </div>
  );
}
```

### DBスキーマ変更（Drizzle ORM）
```typescript
// functions/lib/schema.ts
import { pgTable, serial, text, boolean, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

export const todos = pgTable("todos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedPomodoros: integer("completed_pomodoros").notNull().default(0),
  order: integer("order").notNull().default(0), // 追加
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### 既存データ移行SQL
```sql
-- createdAt順でorderを割り当て（0, 1, 2...）
WITH ordered_todos AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as row_num
  FROM todos
)
UPDATE todos
SET "order" = ordered_todos.row_num
FROM ordered_todos
WHERE todos.id = ordered_todos.id;
```

### tRPC reorder mutation
```typescript
// src/app/routers/todos.ts
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const todosRouter = router({
  reorder: protectedProcedure
    .input(z.object({ id: z.string(), newOrder: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { id, newOrder } = input;
      const userId = ctx.user.id;

      // 移動対象アイテム取得
      const [target] = await db
        .select()
        .from(todos)
        .where(eq(todos.id, id))
        .limit(1);

      if (!target || target.userId !== userId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const oldOrder = target.order;
      const items = await db
        .select()
        .from(todos)
        .where(eq(todos.userId, userId))
        .orderBy(todos.order);

      // 移動範囲内のみ更新（効率的）
      const [minOrder, maxOrder] = oldOrder < newOrder
        ? [oldOrder + 1, newOrder]
        : [newOrder, oldOrder - 1];

      // 該当範囲のorderを±1シフト
      const shift = oldOrder < newOrder ? -1 : 1;
      await db
        .update(todos)
        .set({ order: sql`${todos.order} + ${shift}` })
        .where(
          and(
            eq(todos.userId, userId),
            gte(todos.order, minOrder),
            lte(todos.order, maxOrder)
          )
        );

      // ターゲットを新しい位置に移動
      await db
        .update(todos)
        .set({ order: newOrder })
        .where(eq(todos.id, id));

      return { success: true };
    }),
  // ... 既存ルーター
});
```

### localStorage reorder実装
```typescript
// src/lib/storage.ts
interface Todo {
  id: string;
  title: string;
  completed: boolean;
  completedPomodoros: number;
  order: number; // 追加
  createdAt: string;
}

export const todoStorage = {
  // ... 既存メソッド

  reorder(id: string, newOrder: number) {
    const todos = this.getAll();
    const oldIndex = todos.findIndex(t => t.id === id);
    if (oldIndex === -1) return;

    const [moved] = todos.splice(oldIndex, 1);
    todos.splice(newOrder, 0, moved);

    // order値を再採番
    todos.forEach((t, i) => { t.order = i; });
    localStorage.setItem('todos', JSON.stringify(todos));
  },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | 2021 | React 18 Strict Mode対応、メンテナンス継続 |
| 手動CSS transform | CSS.Transform.toString() | - | ブラウザ互換性、GPUアクセレレーション |
| 全件order更新 | 移動範囲内のみ更新 | - | パフォーマンス向上（大規模リストで顕著） |

**Deprecated/outdated:**
- react-beautiful-dnd: メンテナンス停止、React 18非対応

## Open Questions

1. **完了済みタスクのDnD可否**
   - What we know: CONTEXT.mdで「基本的には有効だが、UX判断で制限しても良い」と記載
   - What's unclear: ユーザビリティへの影響、完了タスクの順序変更需要
   - Recommendation: 実装後にUXテスト。問題あれば完了タスクのDnDを無効化（isDragging制御）

2. **エラー時のロールバック処理**
   - What we know: CONTEXT.mdでClaude's Discretionとして記載
   - What's unclear: API失敗時のUI挙動（トースト表示？元の位置に戻す？）
   - Recommendation: 最小実装ではトーストエラー表示のみ。必要に応じて楽観的UIのロールバック追加

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DND-01 | ドラッグ中の視覚的フィードバック | manual-only | N/A | - |
| DND-01 | ドロップ完了で配列並び替え | integration | `npm test -- todos.test.ts -t "reorder"` | ❌ Wave 0 |
| DND-02 | DBのorderカラム更新 | unit | `npm test -- todos.test.ts -t "reorder mutation"` | ❌ Wave 0 |
| DND-02 | localStorageのorder更新 | unit | `npm test -- storage.test.ts -t "reorder"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useTodos.test.ts` — reorderTodoメソッドのゲスト/ログイン分岐テスト
- [ ] `src/lib/storage.test.ts` — reorderメソッドのテスト
- [ ] `src/app/routers/todos.test.ts` — reorder mutationのモックテスト
- [ ] `src/components/todos/TodoList.test.tsx` — DnDユーザー操作のテスト（userEvent使用）
- [ ] Test utils: dnd-kitのmock/sensorユーティリティ（必要に応じて）

**Note:** DnDの視覚的フィedbackはマニュアルテスト推奨（Playwright等でのE2Eは複雑）

## Sources

### Primary (HIGH confidence)
- @dnd-kit/core Documentation - https://docs.dndkit.com/ - DndContext, Sensor API
- @dnd-kit/sortable Documentation - https://docs.dndkit.com/presets/sortable - SortableContext, useSortable, arrayMove
- Pomdo CONTEXT.md - Implementation decisions locked
- Pomdo REQUIREMENTS.md - DND-01, DND-02 requirements

### Secondary (MEDIUM confidence)
- @dnd-kit GitHub - https://github.com/clauderic/dnd-kit - Examples, issues
- Drizzle ORM Documentation - https://orm.drizzle.team/ - Schema changes, migrations

### Tertiary (LOW confidence)
- (なし - 全て公式ドキュメントまたはプロジェクト内決定事項に基づく)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 公式ドキュメントで動作確認済み、バージョン特定済み
- Architecture: HIGH - dnd-kit + Framer Motion併用パターン公式推奨
- Pitfalls: HIGH - AnimatePresence競合は既知の問題、フィルタリング問題はドキュメントで言及

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (30日 - dnd-kitは安定しているが、React 19対応等で変更可能性)
