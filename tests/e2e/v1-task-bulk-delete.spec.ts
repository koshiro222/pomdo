import { expect, test, type Locator, type Page } from '@playwright/test'
import { failAppProcedure, openAppAsAnonymous, setServerNowFromBrowserClock } from './helpers/auth'

async function addTask(page: Parameters<typeof openAppAsAnonymous>[0], title: string, bucket: 'onDeck' | 'backlog') {
  const backlogToggle = page.getByRole('button', { name: /^Backlog/ }).first()
  if (bucket === 'backlog' && await backlogToggle.getAttribute('aria-expanded') === 'false') {
    await backlogToggle.click()
  }
  const input = page.getByRole('textbox', { name: 'タスクを追加' }).last()
  await input.fill(title)
  await page.getByRole('button', { name: '追加' }).last().click()
  await expect(page.locator('.task-title', { hasText: title })).toBeVisible()
}

async function tabTo(page: Page, target: Locator) {
  for (let index = 0; index < 120; index += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  throw new Error('Tab 移動で目的の要素にフォーカスできませんでした')
}

test('Now・On Deck・Backlogを横断して選択し、確認後に選択Taskだけ削除する', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openAppAsAnonymous(page)
  const nowTitle = 'Pomdo を5分だけ触ってみる'
  await addTask(page, '削除するNext', 'onDeck')
  await addTask(page, '残すNext', 'onDeck')
  await addTask(page, '削除するBacklog', 'backlog')

  const orderBefore = await page.locator('.task-row:not(.done) .task-title').allTextContents()
  await page.getByRole('checkbox', { name: `${nowTitle}を削除対象に選択` }).check()
  await page.getByRole('checkbox', { name: '削除するNextを削除対象に選択' }).check()
  await page.getByRole('checkbox', { name: '削除するBacklogを削除対象に選択' }).check()
  await expect(page.locator('.bulk-delete-toolbar [role="status"]')).toHaveText('3件を削除対象として選択中')
  await expect(page.locator('.now-card h1')).toHaveText(nowTitle)
  expect(await page.locator('.task-row:not(.done) .task-title').allTextContents()).toEqual(orderBefore)

  await page.getByRole('button', { name: /^Backlog/ }).first().click()
  await expect(page.locator('.bulk-delete-toolbar [role="status"]')).toHaveText('3件を削除対象として選択中')
  await page.getByRole('button', { name: '選択した3件のタスクを削除' }).click()
  const dialog = page.getByRole('dialog', { name: '選択した3件のタスクを削除' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('list', { name: '削除するTaskの一覧' }).getByRole('listitem')).toHaveText([nowTitle, '削除するNext', '削除するBacklog'])
  const mobileDialogBox = await dialog.boundingBox()
  expect(mobileDialogBox).not.toBeNull()
  expect(mobileDialogBox!.x).toBeGreaterThanOrEqual(0)
  expect(mobileDialogBox!.x + mobileDialogBox!.width).toBeLessThanOrEqual(390)
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', 390)

  const cancelButton = page.getByRole('button', { name: 'キャンセル' })
  await expect(cancelButton).toHaveClass(/btn-ghost/)
  await cancelButton.click()
  await expect(page.locator('.bulk-delete-toolbar [role="status"]')).toHaveText('3件を削除対象として選択中')
  await expect(page.getByRole('heading', { name: 'Next' })).toBeVisible()
  await expect(page.locator('.now-card h1')).toHaveText(nowTitle)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByRole('button', { name: /^Backlog/ }).first().click()
  await page.getByRole('button', { name: '選択した3件のタスクを削除' }).click()
  const desktopDialog = page.getByRole('dialog', { name: '選択した3件のタスクを削除' })
  await expect(desktopDialog).toBeVisible()
  const desktopDialogBox = await desktopDialog.boundingBox()
  expect(desktopDialogBox).not.toBeNull()
  expect(desktopDialogBox!.x).toBeGreaterThanOrEqual(0)
  expect(desktopDialogBox!.y).toBeGreaterThanOrEqual(0)
  expect(desktopDialogBox!.x + desktopDialogBox!.width).toBeLessThanOrEqual(1440)
  expect(desktopDialogBox!.y + desktopDialogBox!.height).toBeLessThanOrEqual(900)
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', 1440)
  const confirmDelete = page.getByRole('button', { name: '3件を削除する' })
  await expect(confirmDelete).toHaveClass(/btn-error/)
  await confirmDelete.click()

  await expect(page.getByRole('heading', { name: '今は、決めなくて大丈夫。' })).toBeVisible()
  await expect(page.locator('.task-title', { hasText: '残すNext' })).toBeVisible()
  await expect(page.locator('.task-suggestion')).toContainText('残すNext')
  await expect(page.locator('.task-title', { hasText: '削除するNext' })).not.toBeVisible()
  await expect(page.locator('.task-title', { hasText: '削除するBacklog' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: '選択した3件のタスクを削除' })).not.toBeVisible()
})

test('Now削除後の提案Taskも削除すると提案から消える', async ({ page }) => {
  await openAppAsAnonymous(page)
  await addTask(page, '提案後に削除するTask', 'onDeck')
  await page.getByRole('checkbox', { name: 'Pomdo を5分だけ触ってみるを削除対象に選択' }).check()
  await page.getByRole('button', { name: '選択した1件のタスクを削除' }).click()
  await page.getByRole('button', { name: '1件を削除する' }).click()

  const suggestion = page.locator('.task-suggestion')
  await expect(suggestion).toContainText('提案後に削除するTask')
  await page.getByRole('checkbox', { name: '提案後に削除するTaskを削除対象に選択' }).check()
  await page.getByRole('button', { name: '選択した1件のタスクを削除' }).click()
  await page.getByRole('button', { name: '1件を削除する' }).click()

  await expect(suggestion).not.toBeVisible()
  await expect(page.getByRole('heading', { name: '今は、決めなくて大丈夫。' })).toBeVisible()
})

test('一括削除APIが失敗したら選択を維持して再確認できる', async ({ page }) => {
  await openAppAsAnonymous(page)
  await addTask(page, '削除失敗を確認するTask', 'onDeck')
  await page.getByRole('checkbox', { name: '削除失敗を確認するTaskを削除対象に選択' }).check()
  await failAppProcedure(page, 'tasks.deleteMany')

  await page.getByRole('button', { name: '選択した1件のタスクを削除' }).click()
  await page.getByRole('button', { name: '1件を削除する' }).click()
  await expect(page.getByRole('alert')).toContainText('選択したTaskを削除できませんでした')
  await expect(page.locator('.bulk-delete-toolbar [role="status"]')).toHaveText('1件を削除対象として選択中')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByRole('button', { name: '選択した1件のタスクを削除' }).click()
  await expect(page.getByRole('dialog')).toContainText('削除失敗を確認するTask')
})

test('キーボードだけで選択、キャンセル、再確認、一括削除を操作できる', async ({ page }) => {
  await openAppAsAnonymous(page)
  await addTask(page, 'キーボードで削除するTask', 'onDeck')
  await addTask(page, '選択しないTask', 'onDeck')
  const nowCheckbox = page.getByRole('checkbox', { name: 'Pomdo を5分だけ触ってみるを削除対象に選択' })
  const taskCheckbox = page.getByRole('checkbox', { name: 'キーボードで削除するTaskを削除対象に選択' })
  const deleteButton = page.getByRole('button', { name: '選択した2件のタスクを削除' })

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  })
  await tabTo(page, nowCheckbox)
  await page.keyboard.press('Space')
  await tabTo(page, taskCheckbox)
  await page.keyboard.press('Space')
  await expect(nowCheckbox).toBeChecked()
  await expect(taskCheckbox).toBeChecked()
  await expect(page.locator('.bulk-delete-toolbar [role="status"]')).toHaveText('2件を削除対象として選択中')

  await tabTo(page, deleteButton)
  await page.keyboard.press('Enter')
  const cancelButton = page.getByRole('button', { name: 'キャンセル' })
  await expect(cancelButton).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(deleteButton).toBeFocused()
  await expect(taskCheckbox).toBeChecked()

  await page.keyboard.press('Enter')
  const confirmButton = page.getByRole('button', { name: '2件を削除する' })
  await expect(confirmButton).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(confirmButton).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page.locator('.task-title', { hasText: 'キーボードで削除するTask' })).not.toBeVisible()
  await expect(page.locator('.task-title', { hasText: '選択しないTask' })).toBeVisible()
  await expect(nowCheckbox).not.toBeVisible()
  await expect(page.locator('.bulk-delete-toolbar')).not.toBeVisible()
})

test('Focus中Nowの一括削除はタイマーを続け、削除後も記録できる', async ({ page }) => {
  const fixedNow = new Date('2026-09-04T09:00:00+09:00')
  await page.clock.install({ time: fixedNow })
  await page.addInitScript((value) => localStorage.setItem('pomdo-e2e-now', value), fixedNow.toISOString())
  await openAppAsAnonymous(page)
  await setServerNowFromBrowserClock(page)
  await page.getByRole('button', { name: '15' }).click()
  await page.getByRole('button', { name: '▶ はじめる' }).click()
  await expect(page.getByRole('button', { name: 'ストップ' })).toBeVisible()

  const nowTitle = 'Pomdo を5分だけ触ってみる'
  await page.getByRole('checkbox', { name: `${nowTitle}を削除対象に選択` }).check()
  await page.getByRole('button', { name: '選択した1件のタスクを削除' }).click()
  await expect(page.getByRole('dialog')).toHaveAccessibleDescription(/タイマーは続き、Focus SessionはTaskに紐づかない記録になります/)
  await page.getByRole('button', { name: 'キャンセル' }).click()
  await expect(page.getByRole('button', { name: 'ストップ' })).toBeVisible()

  await page.getByRole('button', { name: '選択した1件のタスクを削除' }).click()
  await page.getByRole('button', { name: '1件を削除する' }).click()
  await expect(page.getByRole('heading', { name: '今は、決めなくて大丈夫。' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ストップ' })).toBeVisible()
  await page.clock.runFor('00:01:01')
  const interruptResponsePromise = page.waitForResponse((response) => response.url().includes('/api/trpc/focus.interrupt') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'ストップ' }).click()
  const interruptResponse = await interruptResponsePromise
  expect(interruptResponse.ok()).toBeTruthy()
  expect(JSON.stringify(await interruptResponse.json())).toContain('"taskId":null')
  await expect(page.getByRole('button', { name: '▶ はじめる' })).toBeVisible()
})
