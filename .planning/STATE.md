---
gsd_state_version: 1.0
milestone: v1.6
milestone_name: TodoカードUI/UX改善
status: ready_to_plan
stopped_at: Roadmap created for v1.6
last_updated: "2026-03-25T00:00:00.000Z"
progress:
  total_phases: 2
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# STATE: Pomdo v1.6 TodoカードUI/UX改善

**Last Updated:** 2026-03-25
**Milestone:** v1.6 TodoカードUI/UX改善

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-03-25)

**Core Value:** ユーザーが集中して作業を完了できるようにする。タイマー、タスク、BGMがシームレスに連携する。

**Current Milestone Goal:** Todoカードのレイアウト整理・アニメーション改善・ドラッグ&ドロップ並び替えを実装し、タスク操作体験を向上させる

## Current Position

Phase: 17 (レイアウト&アニメーション改善) — Ready to plan
Plan: 0 of TBD
Status: Ready to plan

Progress: [░░░░░░░░░░] 0%

## Decisions

- Phase 17にレイアウト+アニメーションを集約: 同一コンポーネント(TodoList)への変更で密結合のため、1フェーズで一括完成
- Phase 18をD&D専用に分離: DBスキーマ変更（orderカラム追加）が伴い、Phase 17のDOM構造確定後に実装するのが安全

## Performance Metrics

**Velocity:**

- Total plans completed (v1.6): 0
- Total plans completed (all): 42

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 17 (レイアウト&アニメーション改善) | 0/TBD | - | - |
| 18 (ドラッグ&ドロップ並び替え) | 0/TBD | - | - |

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

Last session: 2026-03-25
Stopped at: v1.6ロードマップ作成完了、Phase 17プランニング待ち
Resume file: None

---
*State updated: 2026-03-25*
*Roadmap created for v1.6*
