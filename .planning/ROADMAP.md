# Roadmap: Pomdo

**Created:** 2026-02-28
**Last Updated:** 2026-03-26

## Milestones

- ✅ **v1.0 BGM管理機能追加** — Phases 1-6 (shipped 2026-03-20)
- ✅ **v1.1 favicon追加** — Phase 7 (shipped 2026-03-21)
- ✅ **v1.2 UI/UX改善** — Phases 8-10 (shipped 2026-03-22)
- ✅ **v1.3 アクセシビリティ&品質改善** — Phases 11-13 (shipped 2026-03-24)
- ✅ **v1.4 Bento Grid再設計 & Todo統合** — Phases 14-15 (shipped 2026-03-24)
- ✅ **v1.5 カードヘッダー統一** — Phase 16 (shipped 2026-03-24)
- ✅ **v1.6 TodoカードUI/UX改善** — Phases 17-18 (shipped 2026-03-25)
- 🚧 **v1.6.1 BGMプレイヤーアニメーション刷新** — Phases 19-20 (in progress)

## Progress Summary

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1-6 | v1.0 | 16/16 | Complete | 2026-03-20 |
| 7 | v1.1 | 1/1 | Complete | 2026-03-21 |
| 8-10 | v1.2 | 10/10 | Complete | 2026-03-22 |
| 11-13 | v1.3 | 8/8 | Complete | 2026-03-24 |
| 14-15 | v1.4 | 4/4 | Complete | 2026-03-24 |
| 16 | v1.5 | 2/2 | Complete | 2026-03-24 |
| 17-18 | v1.6 | 7/7 | Complete | 2026-03-25 |
| 19-20 | v1.6.1 | 1/2 | In Progress | - |

**Completed:** 49/52 plans (v1.0-v1.6)

## Phases

<details>
<summary>✅ v1.0 BGM管理機能追加 (Phases 1-6) — SHIPPED 2026-03-20</summary>

**Details:** `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 favicon追加 (Phase 7) — SHIPPED 2026-03-21</summary>

**Details:** `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.2 UI/UX改善 (Phases 8-10) — SHIPPED 2026-03-22</summary>

**Details:** `.planning/milestones/v1.2-ROADMAP.md`

</details>

<details>
<summary>✅ v1.3 アクセシビリティ&品質改善 (Phases 11-13) — SHIPPED 2026-03-24</summary>

**Details:** `.planning/milestones/v1.3-ROADMAP.md`

</details>

<details>
<summary>✅ v1.4 Bento Grid再設計 & Todo統合 (Phases 14-15) — SHIPPED 2026-03-24</summary>

**Details:** `.planning/milestones/v1.4-ROADMAP.md`

</details>

<details>
<summary>✅ v1.5 カードヘッダー統一 (Phase 16) — SHIPPED 2026-03-24</summary>

**Details:** `.planning/milestones/v1.5-ROADMAP.md`

</details>

<details>
<summary>✅ v1.6 TodoカードUI/UX改善 (Phases 17-18) — SHIPPED 2026-03-25</summary>

**Details:** `.planning/milestones/v1.6-ROADMAP.md`

</details>

---

## 🚧 v1.6.1 BGMプレイヤーアニメーション刷新 (In Progress)

**Milestone Goal:** BGM再生中のアルバムアートアニメーションを、点滅しながらパルスを発する表現に刷新する

**Start Date:** 2026-03-26

**Phases:** 2 phases (2 plans)

### Phase 19: CSSアニメーション定義
**Goal**: 点滅とパルスエフェクトのCSSアニメーションを定義
**Depends on**: Phase 18
**Requirements**: BGMAN-01, BGMAN-02
**Success Criteria** (what must be TRUE):
  1. index.cssにblink@keyframesが定義され、opacity 0.6↔1.0、scale 1↔1.02、2s周期で変化する
  2. index.cssにpulse-glow@keyframesが定義され、box-shadowの多層構造でglowエフェクトが広がる
**Plans:** 1/1 plans complete

Plans:
- [x] 19-01: CSS keyframes定義（blink + pulse-glow + rotate削除）


### Phase 20: BgmPlayerコンポーネント修正
**Goal**: アルバムアートが再生中のみ点滅+パルスし、回転アニメーションを削除する
**Depends on**: Phase 19
**Requirements**: BGMAN-03, BGMAN-04
**Success Criteria** (what must be TRUE):
  1. アルバムアートはBGM再生中に点滅+パルスアニメーションを表示する
  2. BGM停止時、アルバムアートは静止した状態で表示される
  3. 回転アニメーション（album-art-spinningクラス）がコードベースから完全に削除されている
**Plans:** 1/1 plans

Plans:
- [ ] 20-01: AlbumArtコンポーネント修正（アニメーション適用 + spinning削除）

---

## Future Milestones (Planned)

- 📋 **v1.7 テスト基盤整備** — TBD
- 📋 **v1.8 アクセシビリティ対応（prefers-reduced-motion）** — TBD
