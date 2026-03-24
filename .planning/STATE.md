---
gsd_state_version: 1.0
milestone: v1.6
milestone_name: TodoカードUI/UX改善
status: unknown
stopped_at: "Completed Phase 18 Plan 01: DB order column + reorder mutation"
last_updated: "2026-03-24T19:26:51.495Z"
progress:
  total_phases: 2
  completed_phases: 1
  total_plans: 6
  completed_plans: 4
---

# STATE: Pomdo v1.6 TodoカードUI/UX改善

**Last Updated:** 2026-03-25
**Milestone:** v1.6 TodoカードUI/UX改善

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-03-25)

**Core Value:** ユーザーが集中して作業を完了できるようにする。タイマー、タスク、BGMがシームレスに連携する。

**Current Milestone Goal:** Todoカードのレイアウト整理・アニメーション改善・ドラッグ&ドロップ並び替えを実装し、タスク操作体験を向上させる

## Current Position

Phase: 18 (drag-drop-sorting) — EXECUTING
Plan: 2 of 4

## Decisions

- Phase 17にレイアウト+アニメーションを集約: 同一コンポーネント(TodoList)への変更で密結合のため、1フェーズで一括完成
- Phase 18をD&D専用に分離: DBスキーマ変更（orderカラム追加）が伴い、Phase 17のDOM構造確定後に実装するのが安全
- [Phase 17]: layout propを単体で使用: 既存アイテムがスムーズにスライド
- [Phase 17]: initial条件をisNewに連動させページリロード時のアニメーションを抑制
- [Phase 18]: NewTodo型からorderフィールドを除外（addTodo内部で自動採番）
- [Phase 18]: getTodosで古いデータにorderを付与（createdAt順の後方互換）

## Performance Metrics

**Velocity:**

- Total plans completed (v1.6): 2
- Total plans completed (all): 44

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 17 (レイアウト&アニメーション改善) | 2/2 | 1 task | 1 files |
| 18 (ドラッグ&ドロップ並び替え) | 0/TBD | - | - |
| Phase 17 P02 | 875 | 1 tasks | 1 files |
| Phase 18-drag-drop-sorting P01 | 287 | 2 tasks | 3 files |
| Phase 18-drag-drop-sorting P02 | 1774380403 | 2 tasks | 3 files |

## Accumulated Context

### Technical Constraints

- Edge Runtime（Cloudflare Workers）— Node.js API使用不可
- Framer Motion導入済み（v1.2で `layout="position"` を採用）
- Tailwind CSS — スタイルはユーティリティクラスで実装
- **カラースキーム**: Deep Forest（プライマリー #22c55e）

### Technical Debt (Carried Over)

- TEST-01〜TEST-04: tRPCルーター単体テスト等がプレースホルダー状態（v2へ繰り越し）
- ACCESS-01: prefers-reduced-motion対応が未実装（v2へ繰り越し）

### Blockers

なし

## Session Continuity

Last session: 2026-03-24T19:26:51.493Z
Stopped at: Completed Phase 18 Plan 01: DB order column + reorder mutation
Resume file: None

---
*State updated: 2026-03-25*
*Phase 17 completed*
*Ready for Phase 18*
