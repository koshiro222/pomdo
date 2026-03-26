# Requirements: Pomdo

**Defined:** 2026-03-26
**Core Value:** ユーザーが集中して作業を完了できるようにする。タイマー、タスク、BGMがシームレスに連携する。

## v1.6.1 Requirements

BGMプレイヤーアニメーション刷新の要件。回転する円盤から点滅+パルスエフェクトへの移行。

### BGMアニメーション

- [ ] **BGMAN-01**: アルバムアートが点滅する（opacity 0.6 ↔ 1.0, scale 1 ↔ 1.02, 2s周期）
- [ ] **BGMAN-02**: アルバムアートからパルスが広がる（box-shadow多層構造によるglowエフェクト）
- [ ] **BGMAN-03**: 再生中のみアニメーションが動作し、停止時は静止する
- [ ] **BGMAN-04**: 回転アニメーション（album-art-spinning）を削除する

## Future Requirements

将来のリリース向け。現在のロードマップには含まれない。

### アクセシビリティ

- **ACC-01**: prefers-reduced-motion対応 — OSの「動作を減らす」設定を尊重

## Out of Scope

明示的に除外。スコープ creep を防ぐため文書化。

| 機能 | 理由 |
|------|------|
| 回転アニメーション（rotate） | 削除対象。点滅+パルスで「鼓動」を表現 |
| 高速点滅（< 1s周期） | 光過敏性エピレプシーのリスク（WCAG 2.3.1違反） |
| 複雑な変換（skew/perspective） | パフォーマンス低下、アクセシビリティ低下 |
| JavaScript制御のアニメーション | CSS keyframesの方がパフォーマンス良好 |

## Traceability

どのフェーズがどの要件をカバーするか。ロードマップ作成時に更新。

| Requirement | Phase | Status |
|-------------|-------|--------|
| BGMAN-01 | Phase 19 | Pending |
| BGMAN-02 | Phase 19 | Pending |
| BGMAN-03 | Phase 19 | Pending |
| BGMAN-04 | Phase 19 | Pending |

**Coverage:**
- v1.6.1 requirements: 4 total
- Mapped to phases: 0（ロードマップ作成後に更新）
- Unmapped: 4

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after initial definition*
