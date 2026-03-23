# Phase 13: 動きと一貫性 - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

ユーザーは滑らかなアニメーションと統一された対話フィードバックを体験できる。

新機能追加ではなく、既存UIのアニメーションとボタンスタイルの統一が範囲。
</domain>

<decisions>
## Implementation Decisions

### アニメーション抑制対応
- **今回の実装範囲外**: prefers-reduced-motionには対応しない
- 理由: 今回のフェーズでは実装しないと判断
- 将来の対応が必要な場合は別フェーズで検討

### パフォーマンス最適化
- 現状のアニメーション（transform/opacityのみ）で60fps維持できている
- 特に問題なし、現状維持

### ボタンスタイル統一
- **小ボタンの角丸を`rounded-xl`に統一**
- 変更対象: TodoItem削除ボタン、BgmPlayerの小ボタン群
- 現状の`p-3`（角丸なし）→ `p-3 rounded-xl`に変更
- STARTボタンの`rounded-full`は主要ボタンとして維持
- glass枠線は統一範囲外（現状維持）

### ホバー効果統一
- **Framer Motionを優先**: モダンなアニメーションライブラリを活用
- Framer Motion: `{...hoverAnimation}`（scale 1.02）を維持・拡大適用
- **CSSの`hover:bg-white/10`は削除**: Framer Motionとの重複を解消
- **色変化はCSS維持**: `hover:text-cf-danger`などはCSSで（scaleと色の役割分担）

### Claude's Discretion
- 具体的な変更ファイルの洗い出し
- Framer Motionの最適化オプション（willChangeなど）の要否判断

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — v1.3要件（ANIM-01, ANIM-02, CONS-01, CONS-02）
  - ANIM-01: prefers-reduced-motion対応（今回は実装しない）
  - ANIM-02: 60fps滑らかなアニメーション（現状維持）
  - CONS-01: ボタンスタイル統一（小ボタンの角丸統一）
  - CONS-02: ホバー効果統一（Framer Motion優先）

### Phase Definition
- `.planning/ROADMAP.md` — Phase 13の成功基準（4項目）

### Design System
- `.planning/DESIGN.md` — Animation設定、Border Radius、ボタンスタイル
- `src/lib/animation.ts` — 現在のアニメーション定義（hoverAnimation, tapAnimation等）

### Target Components
- `src/components/todos/TodoItem.tsx` — 削除ボタンの角丸追加対象
- `src/components/bgm/BgmPlayer.tsx` — 小ボタンの角丸追加対象、hover:bg-white/10削除対象
- `src/components/timer/TimerControls.tsx` — hover:bg-white/10削除対象

### Codebase Maps
- `.planning/codebase/CONVENTIONS.md` — コンポーネントパターン
- `.planning/codebase/STRUCTURE.md` — コンポーネント構造

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **framer-motion** — motion.button, AnimatePresence, whileHover, whileTap
- **アニメーション定義** (`src/lib/animation.ts`):
  - `hoverAnimation`: whileHover: { scale: 1.02 }
  - `tapAnimation`: whileTap: { scale: 0.95 }
  - `fadeInUpVariants`, `slideInVariants`, `completedVariants`
- **lucide-react** — アイコン

### Established Patterns
- **Framer Motion**: transform/opacityのみ使用 → GPUアクセラレーション効く → 60fps
- **現在のボタンスタイル**:
  - STARTボタン: `h-16 px-10 rounded-full bg-cf-primary`
  - リセット/スキップ: `size-14 rounded-full glass`
  - 小ボタン: `p-3`（角丸なし）→ これを`rounded-xl`に統一

### Integration Points
- **全てのmotion.button**: `{...hoverAnimation}` spreadを追加/維持
- **全てのボタンclassName**: `hover:bg-white/10`を削除

### Current Issues
- 小ボタンの角丸が不統一（TodoItem削除、BgmPlayerボタンが角丸なし）
- Framer MotionのscaleとCSSの`hover:bg-white/10`が重複
- ホバー効果の実装が混在（Framer Motion + CSS）

</code_context>

<specifics>
## Specific Ideas

- 「モダンなアニメーションがあるサービス」にしたい → Framer Motionを優先的に活用
- 小ボタンの角丸統一は、視覚的な一貫性を高める最小限の変更
- 色変化はCSSで維持することで、役割ごとの使い分け（scaleはFramer、色はCSS）を明確化

</specifics>

<deferred>
## Deferred Ideas

- **prefers-reduced-motion対応** — 今回は実装しない、別フェーズで検討
- **glass枠線統一** — 今回は対象外、将来の検討事項
- **パディング統一** — 今回は対象外

</deferred>

---

*Phase: 13-motion-and-consistency*
*Context gathered: 2026-03-24*
