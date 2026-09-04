import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TimerDisc } from './TimerDisc'

describe('TimerDisc', () => {
  it('残り時間とスクリーンリーダー向けの説明を表示する', () => {
    render(<TimerDisc remainingSecs={61} plannedSecs={1500} mode="focus" />)

    expect(screen.getByRole('timer', { name: '残り 2分' })).toBeInTheDocument()
    expect(screen.getByText('01:01')).toBeInTheDocument()
  })

  it('休憩モードは休憩のラベルとアクセント用クラスを持つ', () => {
    render(<TimerDisc remainingSecs={0} plannedSecs={300} mode="shortBreak" />)

    expect(screen.getByRole('timer', { name: '休憩、残り 0分' })).toHaveClass('disc-break')
    expect(screen.getByText('00:00')).toBeInTheDocument()
  })
})
