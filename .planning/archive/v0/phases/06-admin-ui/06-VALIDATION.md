---
phase: 6
slug: admin-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + Testing Library |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- src/components/bgm/<ComponentName>.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/components/bgm/<ComponentName>.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | UI-01 | component | `npm test -- src/components/layout/Header.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | UI-02 | component | `npm test -- src/components/bgm/AdminModal.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | UI-03 | component | `npm test -- src/components/bgm/TrackList.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | UI-03 | component | `npm test -- src/components/bgm/TrackItem.test.ts` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | UI-04 | integration | `npm test -- src/components/bgm/AddTrackForm.test.ts` | ❌ W0 | ⬜ pending |
| 06-04-01 | 04 | 2 | UI-05 | integration | `npm test -- src/components/bgm/EditTrackDialog.test.ts` | ❌ W0 | ⬜ pending |
| 06-05-01 | 05 | 2 | UI-06 | component | `npm test -- src/components/bgm/DeleteConfirmDialog.test.ts` | ❌ W0 | ⬜ pending |
| 06-05-02 | 05 | 2 | UI-07 | component | `npm test -- src/components/bgm/AddTrackForm.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/bgm/AdminModal.test.tsx` — AdminModalコンポーネント（UI-02）
- [ ] `src/components/bgm/TrackList.test.tsx` — TrackListコンポーネント（UI-03）
- [ ] `src/components/bgm/TrackItem.test.tsx` — TrackItemコンポーネント（UI-03）
- [ ] `src/components/bgm/AddTrackForm.test.tsx` — AddTrackFormコンポーネント（UI-04, UI-07）
- [ ] `src/components/bgm/EditTrackDialog.test.tsx` — EditTrackDialogコンポーネント（UI-05）
- [ ] `src/components/bgm/DeleteConfirmDialog.test.tsx` — DeleteConfirmDialogコンポーネント（UI-06）
- [ ] `src/components/layout/Header.test.tsx` — 管理ボタン表示テスト追加（UI-01）

Note: 既存の`src/test/setup.ts`でTesting Libraryのセットアップ済み。localStorage mockも含まれているため、Zustand storeのテストも可能。

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 色プレビュー視認性 | UI-05 | 視覚的確認が必要 | 1. 管理者でログイン 2. Adminモーダルを開く 3. 色選択inputで色を変更 4. 隣接するプレビューdivの色が正しく表示されることを確認 |
| ドラッグ&ドロップ除外 | UI-04 | 否定テスト | 1. MP3ファイルをドラッグ 2. 入力エリアにドロップ 3. ファイルが選択されないことを確認 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
