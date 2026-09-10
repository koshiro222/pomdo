import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ThemeToggle', () => {
  it.each([
    ['light', false, 'ダークテーマに切り替え'],
    ['dark', true, 'ライトテーマに切り替え'],
  ] as const)('保存値 %s の実効テーマに応じたラベルを表示する', (theme, checked, label) => {
    mockMatchMedia(false)
    render(<ThemeToggle theme={theme} onToggle={vi.fn()} />)

    const toggle = screen.getByRole('checkbox', { name: label })
    if (checked) expect(toggle).toBeChecked()
    else expect(toggle).not.toBeChecked()
    expect(toggle.closest('label')).toHaveClass('swap')
    expect(toggle.closest('label')).toHaveClass('swap-rotate')
  })

  it('system は OS の実効テーマに応じてラベルと checked を変える', () => {
    mockMatchMedia(true)
    render(<ThemeToggle theme="system" onToggle={vi.fn()} />)

    expect(screen.getByRole('checkbox', { name: 'ライトテーマに切り替え' })).toBeChecked()
  })

  it('system の light 実効テーマでは dark への切り替えを案内する', () => {
    mockMatchMedia(false)
    render(<ThemeToggle theme="system" onToggle={vi.fn()} />)

    expect(screen.getByRole('checkbox', { name: 'ダークテーマに切り替え' })).not.toBeChecked()
  })

  it('native checkbox の操作を onToggle に一度だけ渡し、アイコンを支援技術から隠す', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    mockMatchMedia(false)
    const { container } = render(<ThemeToggle theme="light" onToggle={onToggle} />)

    await user.click(screen.getByRole('checkbox', { name: 'ダークテーマに切り替え' }))

    expect(onToggle).toHaveBeenCalledOnce()
    expect(container.querySelector('svg.swap-on')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('svg.swap-off')).toHaveAttribute('aria-hidden', 'true')
  })
})
