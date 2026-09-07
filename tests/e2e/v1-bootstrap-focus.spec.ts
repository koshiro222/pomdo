import { expect, test } from '@playwright/test'
import { setServerNowFromBrowserClock } from './helpers/auth'

test('LPから匿名で始めて、TaskとFocusの一連の流れを操作できる', async ({ page }) => {
  const fixedNow = new Date('2026-09-04T09:00:00+09:00')
  await page.clock.install({ time: fixedNow })
  await page.addInitScript((value) => localStorage.setItem('pomdo-e2e-now', value), fixedNow.toISOString())
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'ひとつずつ、前に進める。' })).toBeVisible()
  await expect(page.getByRole('link', { name: '使ってみる' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '数字を追わない' })).toBeVisible()
  const firstPillarHeading = page.locator('.pillar-heading').first()
  const firstPillarIcon = await firstPillarHeading.locator('svg').boundingBox()
  const firstPillarTitle = await firstPillarHeading.getByRole('heading').boundingBox()
  expect(firstPillarIcon).not.toBeNull()
  expect(firstPillarTitle).not.toBeNull()
  expect(firstPillarIcon!.x + firstPillarIcon!.width).toBeLessThanOrEqual(firstPillarTitle!.x)
  expect(firstPillarIcon!.y).toBeLessThan(firstPillarTitle!.y + firstPillarTitle!.height)
  expect(firstPillarIcon!.y + firstPillarIcon!.height).toBeGreaterThan(firstPillarTitle!.y)
  await page.getByRole('link', { name: '使ってみる' }).click()
  await expect(page).toHaveURL(/\/app$/)
  await expect(page.getByText('Pomdo を5分だけ触ってみる')).toBeVisible()

  await page.getByLabel('タスクを追加').fill('請求書を確認する')
  await page.getByRole('button', { name: '追加' }).first().click()
  await expect(page.getByText('請求書を確認する')).toBeVisible()

  await setServerNowFromBrowserClock(page)
  await page.getByRole('button', { name: '15' }).click()
  await page.getByRole('button', { name: '▶ はじめる' }).click()
  await expect(page.getByRole('button', { name: 'ストップ' })).toBeVisible()
  await page.clock.runFor('00:15:01')
  await expect(page.getByText('ひと区切り。少し休みますか？')).toBeVisible()
  await page.getByRole('button', { name: 'もう1本' }).click()

  await setServerNowFromBrowserClock(page)
  await page.getByRole('button', { name: '▶ はじめる' }).click()
  await page.clock.runFor('00:00:30')
  await page.getByRole('button', { name: 'ストップ' }).click()
  await expect(page.getByRole('button', { name: '▶ はじめる' })).toBeVisible()

  await setServerNowFromBrowserClock(page)
  await page.getByRole('button', { name: '▶ はじめる' }).click()
  // 停止時刻がちょうど60秒境界になると、ブラウザのイベント処理順で59秒扱いになり得るため1秒余裕を持たせる。
  await page.clock.runFor('00:01:01')
  await page.getByRole('button', { name: 'ストップ' }).click()
  await page.getByRole('link', { name: /振り返りを見る/ }).click()
  await expect(page.getByText('合計集中時間')).toBeVisible()
  await expect(page.getByText('16分')).toBeVisible()
})

test('BacklogからNowへ昇格し、Nowが空ならJust Focusを選べる', async ({ page }) => {
  await page.goto('/app')
  await expect(page.getByText('Pomdo を5分だけ触ってみる')).toBeVisible()

  await page.getByRole('button', { name: /Backlog/ }).click()
  await page.getByLabel('タスクを追加').last().fill('いつか読む記事')
  await page.getByRole('button', { name: '追加' }).last().click()
  await expect(page.getByText('いつか読む記事')).toBeVisible()
  await page.getByRole('button', { name: /^いつか読む記事 \d+ 本$/ }).click()
  await expect(page.getByRole('heading', { name: 'いつか読む記事' })).toBeVisible()

  await page.getByRole('button', { name: '完了' }).first().click()
  await expect(page.getByText('今は、決めなくて大丈夫。')).toBeVisible()
  await page.getByRole('button', { name: 'このまま集中する' }).click()
  await page.getByRole('button', { name: '▶ はじめる' }).click()
  await expect(page.getByRole('button', { name: 'ストップ' })).toBeVisible()
  await page.getByRole('button', { name: 'ストップ' }).click()
})
