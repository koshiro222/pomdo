/// <reference types="vitest/globals" />

import { describe, expect, it, vi } from 'vitest'
import {
  generateTaskDecompositionProposal,
  TaskDecompositionError,
  type TaskDecompositionAi,
  type TaskDecompositionAiInput,
} from './task-decomposition-service'

function createAi(response: unknown): { ai: TaskDecompositionAi; inputs: TaskDecompositionAiInput[] } {
  const inputs: TaskDecompositionAiInput[] = []
  return {
    inputs,
    ai: {
      run: vi.fn(async (_model, input) => {
        inputs.push(input)
        return response
      }),
    },
  }
}

describe('TaskDecompositionService', () => {
  it('タイトルだけのTaskを、区切られた本文としてAIへ渡す', async () => {
    const { ai, inputs } = createAi('{"items":[{"title":"資料を確認する","note":null}]}')

    await expect(generateTaskDecompositionProposal({ ai, title: '資料を確認する', note: null, e2eTestMode: false })).resolves.toEqual({
      items: [{ title: '資料を確認する', note: null }],
    })
    expect(inputs[0]?.messages[1]?.content).toContain('<task-title>\n資料を確認する\n</task-title>')
    expect(inputs[0]?.messages[1]?.content).toContain('<task-note>\n\n</task-note>')
  })

  it('タイトルとメモを別々の区切りでAIへ渡す', async () => {
    const { ai, inputs } = createAi({ items: [{ title: '資料を確認する', note: '期限と担当者を確認する' }] })

    await generateTaskDecompositionProposal({ ai, title: '資料を確認する', note: '期限と担当者を確認する', e2eTestMode: false })

    expect(inputs[0]?.messages[1]?.content).toContain('<task-title>\n資料を確認する\n</task-title>')
    expect(inputs[0]?.messages[1]?.content).toContain('<task-note>\n期限と担当者を確認する\n</task-note>')
  })

  it('Workers AIの文字列responseとobject responseを同じ分解案へ正規化する', async () => {
    const stringResponse = createAi({ response: '{"items":[{"title":"文字列から作る","note":null}]}' })
    const objectResponse = createAi({ response: { items: [{ title: 'objectから作る', note: 'メモ' }] } })

    await expect(generateTaskDecompositionProposal({ ai: stringResponse.ai, title: '元', note: null, e2eTestMode: false })).resolves.toEqual({ items: [{ title: '文字列から作る', note: null }] })
    await expect(generateTaskDecompositionProposal({ ai: objectResponse.ai, title: '元', note: null, e2eTestMode: false })).resolves.toEqual({ items: [{ title: 'objectから作る', note: 'メモ' }] })
  })

  it.each([
    ['JSONが不正', 'not-json'],
    ['スキーマが不正', { items: [{ title: '', note: null }] }],
    ['空配列', { items: [] }],
  ])('%sならユーザー向けの分解エラーになる', async (_caseName, response) => {
    const { ai } = createAi(response)

    await expect(generateTaskDecompositionProposal({ ai, title: '元', note: null, e2eTestMode: false })).rejects.toBeInstanceOf(TaskDecompositionError)
  })

  it('AI例外とタイムアウトを同じ分解エラーへ変換する', async () => {
    const throwingAi: TaskDecompositionAi = { run: vi.fn(async () => { throw new Error('内部エラー') }) }
    const timeoutAi: TaskDecompositionAi = { run: vi.fn(() => new Promise(() => {})) }

    await expect(generateTaskDecompositionProposal({ ai: throwingAi, title: '元', note: null, e2eTestMode: false })).rejects.toBeInstanceOf(TaskDecompositionError)
    await expect(generateTaskDecompositionProposal({ ai: timeoutAi, title: '元', note: null, e2eTestMode: false, timeoutMs: 1 })).rejects.toBeInstanceOf(TaskDecompositionError)
  })

  it('E2E_TEST_MODEではAIを呼ばず、productionと同じ検証を通した3件を返す', async () => {
    const ai: TaskDecompositionAi = { run: vi.fn() }

    await expect(generateTaskDecompositionProposal({ ai, title: '元', note: null, e2eTestMode: true })).resolves.toEqual({
      items: [
        { title: '目的と完了条件を確認する', note: '何をもって完了とするかを短く整理する' },
        { title: '必要な材料を集める', note: '作業に必要な資料や情報を一か所にまとめる' },
        { title: '最小の実行単位に着手する', note: '25分で終えられる範囲を実行する' },
      ],
    })
    expect(ai.run).not.toHaveBeenCalled()
  })
})
