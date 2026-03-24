---
phase: 18-drag-drop-sorting
plan: 01
subsystem: backend
tags: [database, trpc, schema]
dependency_graph:
  requires: []
  provides: [order-column, reorder-mutation]
  affects: [todos-table, todos-router]
tech_stack:
  added: []
  patterns: [range-update-optimization]
key_files:
  created:
    - drizzle/0007_majestic_eternals.sql
  modified:
    - functions/lib/schema.ts
    - src/app/routers/todos.ts
    - src/app/routers/_shared.ts
decisions: []
metrics:
  duration_seconds: 287
  completed_date: "2026-03-25T04:29:52Z"
---

# Phase 18 Plan 01: DBスキーマにorderカラム追加 + reorder mutation実装 Summary

Todoカードのドラッグ&ドロップ並び替え機能のためのバックエンド基盤を構築。

## 実装内容

### 1. todosテーブルにorderカラム追加

- `functions/lib/schema.ts`: `order: integer("order").notNull().default(0)` を追加
- 配置位置: `completedPomodoros` の後、`createdAt` の前
- マイグレーションファイル生成: `drizzle/0007_majestic_eternals.sql`
- SQL: `ALTER TABLE "todos" ADD COLUMN "order" integer DEFAULT 0 NOT NULL;`

### 2. tRPCルーターにreorder mutation実装

**入力スキーマ:**
```typescript
{ id: uuid, newOrder: number (int >= 0) }
```

**処理ロジック（移動範囲内更新戦略）:**
1. 対象タスク取得・認証チェック
2. 古い位置と新しい位置が同じなら早期リターン
3. 移動範囲を決定（前方/後方移動で条件分岐）
4. 範囲内のorder値をSQL式でシフト（効率的）
5. ターゲットタスクを新しい位置に更新

**追加・変更したmutation/query:**
- `getAll`: `orderBy(schema.todos.order)` でソート追加
- `create`: 現在の最大order + 1 を自動設定
- `reorder`: 新規追加

### 3. 型定義更新

- `src/app/routers/_shared.ts`: `todoSchema` に `order: z.number().int().default(0)` 追加
- TypeScriptコンパイルエラーを修正

## Deviations from Plan

なし - プラン通り実行完了。

## Verification Results

- [x] `functions/lib/schema.ts` に `order: integer("order").notNull().default(0)` が存在
- [x] `npm run db:generate` 成功、マイグレーションファイル生成
- [x] `src/app/routers/todos.ts` に `reorder` mutation 存在
- [x] `npm run build` 成功

## Success Criteria

- [x] todosテーブルにorderカラム（integer, NOT NULL, DEFAULT 0）が追加
- [x] reorder mutationが{id, newOrder}を受け取り、移動範囲内のorder値を更新
- [x] getAllクエリがorder順でソートした結果を返す

## Technical Notes

**移動範囲内更新戦略のメリット:**
- 全タスク更新ではなく影響範囲のみ更新（効率的）
- SQL式 `order + ${shift}` でDRYに実装
- ユーザー間の分離: `userId` でフィルタリング済み

**次のフェーズ（18-02〜18-04）への準備:**
- orderカラム永続化基盤完了
- reorder APIエンドポイント利用可能
- フロントエンドでDnDライブラリと連携可能

## Self-Check: PASSED

- [x] `functions/lib/schema.ts` にorderカラム存在確認
- [x] `drizzle/0007_majestic_eternals.sql` 生成確認
- [x] `src/app/routers/todos.ts` にreorder mutation存在確認
- [x] コミット 8017c30, dc963a6 存在確認
