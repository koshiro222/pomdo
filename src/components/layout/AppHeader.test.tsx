import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AppHeader } from './AppHeader'

describe('AppHeader', () => {
  it('/app では設定リンクとテーマトグルを表示する', () => {
    const onToggleTheme = vi.fn()
    render(<MemoryRouter initialEntries={['/app']}><AppHeader theme="light" onToggleTheme={onToggleTheme} /></MemoryRouter>)

    expect(screen.getByRole('link', { name: '設定' })).toHaveAttribute('href', '/app/settings')
    expect(screen.getByRole('checkbox', { name: 'ダークテーマに切り替え' })).toBeInTheDocument()
    screen.getByRole('checkbox', { name: 'ダークテーマに切り替え' }).click()
    expect(onToggleTheme).toHaveBeenCalledOnce()
  })

  it('サブページでは戻るリンクとブランドを維持する', () => {
    render(<MemoryRouter initialEntries={['/app/review']}><AppHeader theme="dark" onToggleTheme={vi.fn()} /></MemoryRouter>)

    expect(screen.getByRole('link', { name: '戻る' })).toHaveAttribute('href', '/app')
    expect(screen.getByText('Pomdo')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'ライトテーマに切り替え' })).toBeInTheDocument()
  })
})
