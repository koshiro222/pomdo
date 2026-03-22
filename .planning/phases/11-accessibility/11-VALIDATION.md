---
phase: 11
slug: accessibility
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- [target_component]` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~30秒 |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- [target_component]`
- **After every plan wave:** Run `npm run test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green + axe DevTools手動検証
- **Max feedback latency:** 60秒

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | A11Y-01 | manual-only | axe DevTools + WebAIM Contrast Checker | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | A11Y-01 | unit | `npm test -- --grep "text-cf-subtext"` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | A11Y-02 | unit | `npm test -- --grep "focus-visible"` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 1 | A11Y-03 | unit | `npm test -- --grep "drag.*handle.*opacity"` | ❌ W0 | ⬜ pending |
| 11-04-01 | 04 | 1 | A11Y-04 | unit | `npm test -- --grep "aria-label"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/todos/TodoItem.test.tsx` — A11Y-02, A11Y-03（focus表示、ドラッグハンドル）
- [ ] `src/components/bgm/TrackItem.test.tsx` — A11Y-04（ARIAラベル）
- [ ] `src/test/accessibility-test-utils.tsx` — 共通アクセシビリティテストユーティリティ
- [ ] Framework install: なし（既にvitest導入済み）

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| カラーコントラスト4.5:1準拠 | A11Y-01 | 自動テストでの視覚的コントラスト検証は不完全 | 1. axe DevToolsを開く<br>2. "Contrast"タブで全テキスト要素をスキャン<br>3. 4.5:1未満の要素がないことを確認<br>4. WebAIM Contrast Checkerで `--df-text-secondary` (#9ca3af) を背景 `#121814` で検証 |
| キーボードナビゲーション | A11Y-02 | 実際のキーボード操作でのUX確認が必要 | 1. Tabキーで全対話要素を巡回<br>2. 青色の2px枠が表示されることを確認<br>3. マウスクリック時はfocus表示が出ないことを確認 |
| ドラッグハンドル視認性 | A11Y-03 | ホバーなしでの視認性確認が必要 | 1. TodoItemのドラッグハンドルを確認<br>2. ホバーなしでopacity-30が見えることを確認<br>3. ホバー時にopacity-50に強調されることを確認 |
| ARIAラベル正確性 | A11Y-04 | スクリーンリーダーでの読み上げ確認 | 1. スクリーンリーダー（macOS: VoiceOver）を起動<br>2. アイコンボタンをフォーカス<br>3. 日本語ラベルが読み上げられることを確認 |

*注: ARIAラベル付与自体は自動テスト可能だが、正確性とUXは手動検証が推奨*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

*Phase: 11-accessibility*
*Validation strategy created: 2026-03-23*
