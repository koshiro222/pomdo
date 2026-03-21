import type { Variants } from 'framer-motion'

/**
 * ページ読み込み時のスタガードアニメーション
 */
export const fadeInUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.2,
      ease: [0, 0, 0.2, 1],
    },
  }),
}

/**
 * スケールアニメーション（ホバー用）
 */
export const scaleVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
}

/**
 * ホバーアニメーション設定
 */
export const hoverAnimation = {
  whileHover: { scale: 1.02 },
}

/**
 * ボタンクリック時のフィードバック
 */
export const tapAnimation = {
  whileTap: { scale: 0.95 },
}

/**
 * Todo追加時のスライドイン
 */
export const slideInVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
}

/**
 * Todo完了時のストライク・フェード
 */
export const completedVariants: Variants = {
  normal: {
    opacity: 1,
    scale: 1,
  },
  completed: {
    opacity: 0.6,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0, 0, 0.2, 1],
    },
  },
}

/**
 * カードの共通アニメーション設定
 */
export const cardAnimation = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
}

/**
 * タイマー起動/停止時のトランジション
 */
export const timerTransition = {
  duration: 0.3,
  ease: [0, 0, 0.2, 1] as const,
}
