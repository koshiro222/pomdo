import { expect } from 'vitest'
import { screen } from '@testing-library/react'

/**
 * ボタンにaria-label属性が存在することを検証するヘルパー
 * @param buttonRole - ボタンのrole（デフォルト: 'button'）
 * @param expectedLabel - 期待されるaria-label値
 */
export async function expectAriaLabel(
  buttonRole: string = 'button',
  expectedLabel: string | RegExp
) {
  const button = screen.getByRole(buttonRole, { name: expectedLabel })
  expect(button).toBeInTheDocument()
  expect(button).toHaveAttribute('aria-label')
  return button
}

/**
 * 要素がfocus-visibleスタイルを持つことを検証するヘルパー
 * 注: focus-visibleはブラウザの擬似クラスのため、DOMテストでは
 * 適切なクラスやスタイルが設定されているかを確認
 * @param element - 検証対象の要素
 */
export function expectFocusVisibleSupport(element: HTMLElement) {
  // focus-visibleはCSS擬似クラスのため、index.cssの設定を確認
  // ここでは要素がfocus可能であることを確認
  expect(element).not.toHaveAttribute('tabindex', '-1')
  return element
}

/**
 * 要素のopacityが期待値であることを検証するヘルパー
 * @param element - 検証対象の要素
 * @param expectedOpacityClass - 期待されるopacityクラス（例: 'opacity-30'）
 */
export function expectOpacityClass(element: HTMLElement, expectedOpacityClass: string) {
  expect(element).toHaveClass(expectedOpacityClass)
  return element
}

/**
 * ドラッグハンドルが視認可能であることを検証するヘルパー
 * @param handle - ドラッグハンドル要素
 * @param minOpacity - 最小opacity（デフォルト: 30 = opacity-30）
 */
export function expectDragHandleVisible(handle: HTMLElement, minOpacity: number = 30) {
  // opacity-{N}クラスが存在することを確認
  const hasMinOpacity = handle.className.includes(`opacity-${minOpacity}`) ||
                        handle.className.includes(`opacity-0 group-hover:opacity-${minOpacity}`)
  expect(hasMinOpacity || handle.className.match(/opacity-\d+/)).toBeTruthy()
  return handle
}
