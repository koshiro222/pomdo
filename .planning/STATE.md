---
gsd_state_version: 1.0
milestone: v1.6
milestone_name: TodoカードUI/UX改善
status: unknown
stopped_at: Completed 17-01-PLAN.md
last_updated: "2026-03-24T18:00:23.170Z"
progress:
  total_phases: 2
  completed_phases: 0
  total_plans: 2
  completed_plans: 1
---

# STATE: Pomdo v1.6 TodoカードUI/UX改善

**Last Updated:** 2026-03-25
**Milestone:** v1.6 TodoカードUI/UX改善

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-03-25)

**Core Value:** ユーザーが集中して作業を完了できるようにする。タイマー、タスク、BGMがシームレスに連携する。

**Current Milestone Goal:** Todoカードのレイアウト整理・アニメーション改善・ドラッグ&ドロップ並び替えを実装し、タスク操作体験を向上させる

## Current Position

Phase: 17 (layout-animation-improvements) — EXECUTING
Plan: 1 of 2

## Decisions

- Phase 17にレイアウト+アニメーションを集約: 同一コンポーネント(TodoList)への変更で密結合のため、1フェーズで一括完成
- Phase 18をD&D専用に分離: DBスキーマ変更（orderカラム追加）が伴い、Phase 17のDOM構造確定後に実装するのが安全
- [Phase 17]: layout propを単体で使用: 既存アイテムがスムーズにスライド
- [Phase 17]: initial条件をisNewに連動させページリロード時のアニメーションを抑制

## Performance Metrics

**Velocity:**

- Total plans completed (v1.6): 0
- Total plans completed (all): 42

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 17 (レイアウト&アニメーション改善) | 0/TBD | - | - |
| 18 (ドラッグ&ドロップ並び替え) | 0/TBD | - | - |
| Phase 17-layout-animation-improvements P01 | 1 | 2 tasks | 2 files |

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

Last session: 2026-03-24T18:00:23.168Z
Stopped at: Completed 17-01-PLAN.md
Resume file: None

---
*State updated: 2026-03-25*
*Roadmap created for v1.6*
