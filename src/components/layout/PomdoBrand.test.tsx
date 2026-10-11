import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PomdoBrand } from './PomdoBrand'

describe('PomdoBrand', () => {
  it('タイマーアイコンとPomdoのブランド名を表示する', () => {
    const { container } = render(<PomdoBrand />)

    expect(screen.getByText('Pomdo')).toBeInTheDocument()
    expect(container.querySelector('.brand-mark svg')).toBeInTheDocument()
  })
})
