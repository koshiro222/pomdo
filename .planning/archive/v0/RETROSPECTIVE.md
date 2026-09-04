# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.4 — Bento Grid再設計 & Todo統合

**Shipped:** 2026-03-24
**Phases:** 2 | **Plans:** 4

### What Was Built
- BentoGridを12列複雑システムから3カラム均等システムに簡素化
- デスクトップ横3列・モバイル縦積みのレスポンシブレイアウト
- TodoListにCurrentTaskハイライトセクションとComplete/Nextボタンを統合
- E2Eテスト30テスト全パス（Chromium/Firefox/WebKit各10テスト）

### What Worked
- 単純化（12列→3カラム）で保守性が大幅に向上
- 既存カード内部コンテンツに一切触れない方針が安全
- AnimatePresence mode="popLayout"でレイアウトシフトを防止

### What Was Inefficient
- 特になし — 計画通りに実行されました

### Patterns Established
- 選択中タスクはハイライトセクションで強調表示（背景色付きボックス）
- TodoItemの選択中表示は左ボーダーのみ（背景色変更なし）
- 完了数表示は「X done」形式のみ

### Key Lessons
1. グリッドシステムの単純化は保守性向上に直結する
2. CurrentTask機能をTodoListに統合することでDOM構造を簡素化できる

### Cost Observations
- Sessions: 1
- Notable: Phase 15-01が1分（80秒）で完了、効率的な実装

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | - | 6 | BGM管理機能の基盤構築 |
| v1.1 | - | 1 | favicon追加 |
| v1.2 | - | 3 | UI/UX改善（レスポンシブ、Stats、グリッド統一） |
| v1.3 | - | 3 | アクセシビリティ&品質改善 |
| v1.4 | 1 | 2 | Bento Grid再設計 & Todo統合 |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.4 | 30 E2E | - | - |

### Top Lessons (Verified Across Milestones)

1. レスポンシブ対応は lg ブレイクポイントで明確に分割
2. .bento-cardクラス統一でデザインを一元管理
3. spacing scale（4px基数）で一貫性のあるスペーシング
