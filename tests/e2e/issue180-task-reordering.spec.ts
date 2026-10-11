import { expect, test, type Locator, type Page } from '@playwright/test'
import { failAppProcedure, openAppAsAnonymous } from './helpers/auth'

function onDeck(page: Page): Locator {
  return page.locator('section[aria-labelledby="on-deck-heading"]')
}

function taskRow(page: Page, title: string): Locator {
  return page.locator('.task-row').filter({ has: page.locator('.task-title', { hasText: title }) })
}

async function addTask(page: Page, title: string, bucket: 'onDeck' | 'backlog' = 'onDeck') {
  let target: Locator
  if (bucket === 'backlog') {
    const backlogToggle = page.getByRole('button', { name: /^Backlog/ }).first()
    if (await backlogToggle.getAttribute('aria-expanded') === 'false') await backlogToggle.click()
    target = page.locator('.disclosure-body')
  } else {
    target = onDeck(page)
  }

  const input = target.getByRole('textbox', { name: 'タスクを追加' })
  await input.fill(title)
  await target.getByRole('button', { name: '追加' }).click()
  await expect(page.locator('.task-title', { hasText: title })).toBeVisible()
}

async function onDeckTitles(page: Page): Promise<string[]> {
  return (await onDeck(page).locator('.task-row .task-title').allTextContents()).map((title) => title.trim())
}

async function expectOnDeckOrder(page: Page, titles: string[]) {
  await expect.poll(() => onDeckTitles(page)).toEqual(titles)
}

async function dragHandleTo(page: Page, sourceTitle: string, targetTitle: string) {
  const source = page.getByRole('button', { name: `${sourceTitle}をドラッグして並べ替え` })
  const target = page.getByRole('button', { name: `${targetTitle}をドラッグして並べ替え` })
  await source.scrollIntoViewIfNeeded()
  await target.scrollIntoViewIfNeeded()

  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('並べ替えハンドルの位置を取得できませんでした')

  const startX = sourceBox.x + sourceBox.width / 2
  const startY = sourceBox.y + sourceBox.height / 2
  const targetX = targetBox.x + targetBox.width / 2
  const targetY = targetBox.y + targetBox.height / 2
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + 8, startY + 2, { steps: 2 })
  await page.mouse.move(targetX, targetY, { steps: 12 })
  await page.mouse.up()
}

async function touchDragHandleTo(page: Page, sourceTitle: string, targetTitle: string) {
  const client = await page.context().newCDPSession(page)
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 })
  try {
    const source = page.getByRole('button', { name: `${sourceTitle}をドラッグして並べ替え` })
    const target = page.getByRole('button', { name: `${targetTitle}をドラッグして並べ替え` })
    await source.scrollIntoViewIfNeeded()
    await target.scrollIntoViewIfNeeded()

    const sourceBox = await source.boundingBox()
    const targetBox = await target.boundingBox()
    if (!sourceBox || !targetBox) throw new Error('並べ替えハンドルの位置を取得できませんでした')

    const startX = sourceBox.x + sourceBox.width / 2
    const startY = sourceBox.y + sourceBox.height / 2
    const targetX = targetBox.x + targetBox.width / 2
    const targetY = targetBox.y + targetBox.height / 2
    const touchPoint = (x: number, y: number) => ({ x, y, radiusX: 2, radiusY: 2, force: 1, id: 1 })

    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchPoint(startX, startY)] })
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touchPoint(startX + 8, startY + 2)] })
    for (let step = 1; step <= 12; step += 1) {
      const progress = step / 12
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [touchPoint(startX + (targetX - startX) * progress, startY + (targetY - startY) * progress)],
      })
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } finally {
    await client.send('Emulation.setTouchEmulationEnabled', { enabled: false })
    await client.detach()
  }
}

async function reorderOnDeckTo(page: Page, sourceTitle: string, targetTitle: string, useTouch = false) {
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/trpc/tasks.reorder'))
  if (useTouch) await touchDragHandleTo(page, sourceTitle, targetTitle)
  else await dragHandleTo(page, sourceTitle, targetTitle)
  const response = await responsePromise
  expect(response.ok()).toBe(true)
  await expect(page.getByRole('button', { name: `${sourceTitle}をドラッグして並べ替え` })).not.toHaveAttribute('aria-disabled', 'true')
}

async function waitForKeyboardDragMeasurement(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
}

async function moveKeyboardSortable(page: Page, handle: Locator, key: 'ArrowDown' | 'ArrowUp') {
  const status = page.getByRole('status').last()
  const previousStatus = await status.textContent()
  await handle.press(key)
  await expect.poll(() => status.textContent()).not.toBe(previousStatus)
}

async function openDecomposition(page: Page, sourceTitle: string) {
  const row = taskRow(page, sourceTitle)
  await row.getByRole('button', { name: `${sourceTitle}のメニュー` }).click()
  await page.getByRole('menuitem', { name: '編集' }).click()
  await page.getByRole('button', { name: 'AIで分解する' }).click()
  await expect(page.getByRole('heading', { name: 'タスクを分解' })).toBeVisible()
  await expect(page.locator('.decomposition-item')).toHaveCount(3)
}

async function decompositionTitles(page: Page): Promise<string[]> {
  return page.locator('.decomposition-item .field input').evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value))
}

test('On Deck はポインターのドロップ直後に並び替わり、保存後と再読み込み後も順序を保つ', async ({ page }) => {
  await openAppAsAnonymous(page)
  await addTask(page, '順序確認 A')
  await addTask(page, '順序確認 B')
  await addTask(page, '順序確認 C')

  const before = ['順序確認 A', '順序確認 B', '順序確認 C']
  const after = ['順序確認 C', '順序確認 A', '順序確認 B']
  let releaseRequest!: () => void
  let signalRequest!: () => void
  let reorderRequestCount = 0
  const requestGate = new Promise<void>((resolve) => { releaseRequest = resolve })
  const requestStarted = new Promise<void>((resolve) => { signalRequest = resolve })
  await page.route('**/api/trpc/tasks.reorder**', async (route) => {
    reorderRequestCount += 1
    signalRequest()
    await requestGate
    await route.continue()
  })

  try {
    const reorderResponse = page.waitForResponse((response) => response.url().includes('/api/trpc/tasks.reorder'))
    await dragHandleTo(page, '順序確認 C', '順序確認 A')
    await requestStarted
    await expectOnDeckOrder(page, after)
    const movedHandle = page.getByRole('button', { name: '順序確認 Cをドラッグして並べ替え' })
    await expect(movedHandle).toHaveAttribute('aria-disabled', 'true')
    await movedHandle.press('Space')
    await movedHandle.press('ArrowUp')
    await movedHandle.press('Space')
    expect(reorderRequestCount).toBe(1)

    releaseRequest()
    expect((await reorderResponse).ok()).toBe(true)
    await expectOnDeckOrder(page, after)

    await page.reload()
    await expect(page.getByText('Pomdo を5分だけ触ってみる')).toBeVisible()
    await expectOnDeckOrder(page, after)
    expect(await onDeckTitles(page)).not.toEqual(before)
  } finally {
    releaseRequest()
  }
})

test('On Deck の保存失敗は元の順序へ戻り、alert で通知する', async ({ page }) => {
  await openAppAsAnonymous(page)
  await addTask(page, '失敗確認 A')
  await addTask(page, '失敗確認 B')
  await addTask(page, '失敗確認 C')
  await failAppProcedure(page, 'tasks.reorder')

  await dragHandleTo(page, '失敗確認 C', '失敗確認 A')
  await expect(page.getByRole('alert')).toBeVisible()
  await expectOnDeckOrder(page, ['失敗確認 A', '失敗確認 B', '失敗確認 C'])
})

test('On Deck のハンドルからキーボードで移動でき、Escape と先頭の境界でキャンセルできる', async ({ page }) => {
  await openAppAsAnonymous(page)
  await addTask(page, 'キーボード確認 A')
  await addTask(page, 'キーボード確認 B')
  await addTask(page, 'キーボード確認 C')

  const thirdHandle = page.getByRole('button', { name: 'キーボード確認 Cをドラッグして並べ替え' })
  await thirdHandle.focus()
  await expect(thirdHandle).toBeFocused()
  await thirdHandle.press('Enter')
  await expect(thirdHandle).toHaveAttribute('aria-pressed', 'true')
  await waitForKeyboardDragMeasurement(page)
  await moveKeyboardSortable(page, thirdHandle, 'ArrowUp')
  await thirdHandle.press('Enter')
  await expectOnDeckOrder(page, ['キーボード確認 A', 'キーボード確認 C', 'キーボード確認 B'])
  await expect(thirdHandle).not.toHaveAttribute('aria-disabled', 'true')

  const firstHandle = page.getByRole('button', { name: 'キーボード確認 Aをドラッグして並べ替え' })
  await firstHandle.focus()
  await firstHandle.press('Space')
  await firstHandle.press('ArrowUp')
  await firstHandle.press('Escape')
  await expectOnDeckOrder(page, ['キーボード確認 A', 'キーボード確認 C', 'キーボード確認 B'])

  await firstHandle.press('Space')
  await expect(firstHandle).toHaveAttribute('aria-pressed', 'true')
  await waitForKeyboardDragMeasurement(page)
  await moveKeyboardSortable(page, firstHandle, 'ArrowDown')
  await moveKeyboardSortable(page, firstHandle, 'ArrowDown')
  await firstHandle.press('Space')
  await expectOnDeckOrder(page, ['キーボード確認 C', 'キーボード確認 B', 'キーボード確認 A'])
  await expect(firstHandle).not.toHaveAttribute('aria-disabled', 'true')
})

test('Task 本文・checkbox・メニューの操作はドラッグを始めず、Backlog と完了にはハンドルがない', async ({ page }) => {
  await openAppAsAnonymous(page)
  await addTask(page, '本文から Now へ')
  await addTask(page, '選択する Task')
  await addTask(page, '編集して完了する Task')
  await addTask(page, 'Backlog の Task', 'backlog')

  const backlogRow = taskRow(page, 'Backlog の Task')
  await expect(backlogRow.getByRole('button', { name: /ドラッグして並べ替え/ })).toHaveCount(0)
  await expect(backlogRow.getByRole('button', { name: /のメニュー/ })).toBeVisible()

  let reorderRequests = 0
  page.on('request', (request) => {
    if (request.url().includes('/api/trpc/tasks.reorder')) reorderRequests += 1
  })

  await taskRow(page, '本文から Now へ').locator('.task-main').click()
  await expect(page.locator('.now-card h1')).toHaveText('本文から Now へ')
  await expect(page.locator('.task-row.is-dragging')).toHaveCount(0)
  expect(reorderRequests).toBe(0)

  const selectableRow = taskRow(page, '選択する Task')
  await selectableRow.getByRole('checkbox', { name: '選択する Taskを削除対象に選択' }).check()
  await expect(page.locator('.task-row.is-dragging')).toHaveCount(0)
  expect(reorderRequests).toBe(0)

  const editableRow = taskRow(page, '編集して完了する Task')
  await editableRow.getByRole('button', { name: '編集して完了する Taskのメニュー' }).click()
  await page.getByRole('menuitem', { name: '編集' }).click()
  await page.getByRole('textbox', { name: 'タイトル' }).fill('編集済み Task')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.locator('.task-title', { hasText: '編集済み Task' })).toBeVisible()
  await expect(page.locator('.task-row.is-dragging')).toHaveCount(0)
  expect(reorderRequests).toBe(0)

  await taskRow(page, '編集済み Task').getByRole('button', { name: '編集済み Taskのメニュー' }).click()
  await page.getByRole('menuitem', { name: '完了' }).click()
  await page.getByRole('button', { name: /今日完了したこと/ }).click()
  const completedRow = page.locator('.task-row.done').filter({ hasText: '編集済み Task' })
  await expect(completedRow).toBeVisible()
  await expect(completedRow.getByRole('button', { name: /ドラッグして並べ替え/ })).toHaveCount(0)
  await expect(page.locator('.task-row.is-dragging')).toHaveCount(0)
  expect(reorderRequests).toBe(0)

  await addTask(page, '削除してもドラッグしない Task')
  const deletionRow = taskRow(page, '削除してもドラッグしない Task')
  await deletionRow.getByRole('button', { name: '削除してもドラッグしない Taskのメニュー' }).click()
  await expect(page.getByRole('menuitem', { name: '削除' })).toBeVisible()
  await expect(page.locator('.task-row.is-dragging')).toHaveCount(0)
  expect(reorderRequests).toBe(0)
  await page.keyboard.press('Escape')
  await expect(deletionRow).toBeVisible()
  expect(reorderRequests).toBe(0)
})

test('AI 分解案はキーボードで並べ替えた表示順を確定内容へ反映する', async ({ page }) => {
  await openAppAsAnonymous(page)
  await addTask(page, '順序どおりに分解する Task')
  await openDecomposition(page, '順序どおりに分解する Task')

  const dialog = page.getByRole('dialog', { name: 'タスクを分解' })
  await expect(dialog.locator('[aria-label*="を上へ"], [aria-label*="を下へ"]')).toHaveCount(0)
  const lastHandle = page.getByRole('button', { name: '最小の実行単位に着手するをドラッグして並べ替え' })
  await lastHandle.focus()
  await lastHandle.press('Space')
  await expect(lastHandle).toHaveAttribute('aria-pressed', 'true')
  await waitForKeyboardDragMeasurement(page)
  await moveKeyboardSortable(page, lastHandle, 'ArrowUp')
  await moveKeyboardSortable(page, lastHandle, 'ArrowUp')
  await lastHandle.press('Space')

  const expectedTitles = ['最小の実行単位に着手する', '目的と完了条件を確認する', '必要な材料を集める']
  await expect.poll(() => decompositionTitles(page)).toEqual(expectedTitles)

  const confirmRequest = page.waitForRequest((request) => request.url().includes('/api/trpc/tasks.decomposeConfirm'))
  await page.getByRole('button', { name: '分解を確定する' }).click()
  const request = await confirmRequest
  const requestBody = `${request.url()} ${request.postData() ?? ''}`
  const titlePositions = expectedTitles.map((title) => requestBody.indexOf(title))
  expect(titlePositions.every((position) => position >= 0)).toBe(true)
  expect(titlePositions).toEqual([...titlePositions].sort((left, right) => left - right))

  await expect(dialog).not.toBeVisible()
  await expectOnDeckOrder(page, expectedTitles)
  await page.reload()
  await expect(page.getByText('Pomdo を5分だけ触ってみる')).toBeVisible()
  await expectOnDeckOrder(page, expectedTitles)
})

test('AI 分解案はポインターで並べ替えた表示順を確定内容へ反映する', async ({ page }) => {
  await openAppAsAnonymous(page)
  await addTask(page, 'ポインターで分解する Task')
  await openDecomposition(page, 'ポインターで分解する Task')

  await dragHandleTo(page, '必要な材料を集める', '目的と完了条件を確認する')
  const expectedTitles = ['必要な材料を集める', '目的と完了条件を確認する', '最小の実行単位に着手する']
  await expect.poll(() => decompositionTitles(page)).toEqual(expectedTitles)
  await page.getByRole('button', { name: '分解を確定する' }).click()

  await expect(page.getByRole('heading', { name: 'タスクを分解' })).not.toBeVisible()
  await expectOnDeckOrder(page, expectedTitles)
})

test('AI 分解の確定が失敗しても編集した内容と並び順を保つ', async ({ page }) => {
  await openAppAsAnonymous(page)
  await addTask(page, '失敗後も編集を保つ Task')
  await openDecomposition(page, '失敗後も編集を保つ Task')

  const titles = page.getByLabel('分解案のタイトル')
  await titles.nth(0).fill('編集済みの完了条件')
  await page.getByLabel('分解案のメモ').nth(0).fill('失敗後も残るメモ')
  const lastHandle = page.getByRole('button', { name: '最小の実行単位に着手するをドラッグして並べ替え' })
  await lastHandle.focus()
  await lastHandle.press('Space')
  await expect(lastHandle).toHaveAttribute('aria-pressed', 'true')
  await waitForKeyboardDragMeasurement(page)
  await moveKeyboardSortable(page, lastHandle, 'ArrowUp')
  await lastHandle.press('Space')

  const expectedTitles = ['編集済みの完了条件', '最小の実行単位に着手する', '必要な材料を集める']
  await expect.poll(() => decompositionTitles(page)).toEqual(expectedTitles)
  await failAppProcedure(page, 'tasks.decomposeConfirm')
  await page.getByRole('button', { name: '分解を確定する' }).click()

  await expect(page.getByRole('alert')).toContainText('分解を確定できませんでした')
  await expect.poll(() => decompositionTitles(page)).toEqual(expectedTitles)
  await expect(page.getByLabel('分解案のタイトル').nth(0)).toHaveValue('編集済みの完了条件')
  await expect(page.getByLabel('分解案のメモ').nth(0)).toHaveValue('失敗後も残るメモ')
  await expect(page.getByRole('button', { name: '分解を確定する' })).toBeVisible()
})

test('desktop と mobile の幅で On Deck と AI 分解案のハンドルを表示し、画面内で操作できる', async ({ page }) => {
  await openAppAsAnonymous(page)
  await addTask(page, '幅を確認する Task A')
  await addTask(page, '幅を確認する Task B')

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    await reorderOnDeckTo(page, '幅を確認する Task B', '幅を確認する Task A', width === 390)
    await expectOnDeckOrder(page, ['幅を確認する Task B', '幅を確認する Task A'])
    await reorderOnDeckTo(page, '幅を確認する Task B', '幅を確認する Task A', width === 390)
    await expectOnDeckOrder(page, ['幅を確認する Task A', '幅を確認する Task B'])
    const onDeckHandle = page.getByRole('button', { name: '幅を確認する Task Aをドラッグして並べ替え' })
    await expect(onDeckHandle).toBeVisible()
    const handleBox = await onDeckHandle.boundingBox()
    expect(handleBox).not.toBeNull()
    expect(handleBox!.x).toBeGreaterThanOrEqual(0)
    expect(handleBox!.x + handleBox!.width).toBeLessThanOrEqual(width)
    await expect(page.locator('html')).toHaveJSProperty('scrollWidth', width)
  }

  await openDecomposition(page, '幅を確認する Task A')
  const decompositionHandle = page.getByRole('button', { name: '目的と完了条件を確認するをドラッグして並べ替え' })
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    if (width === 390) await touchDragHandleTo(page, '必要な材料を集める', '目的と完了条件を確認する')
    else await dragHandleTo(page, '必要な材料を集める', '目的と完了条件を確認する')
    await expect.poll(() => decompositionTitles(page)).toEqual([
      '必要な材料を集める',
      '目的と完了条件を確認する',
      '最小の実行単位に着手する',
    ])
    await expect(decompositionHandle).toBeVisible()
    const handleBox = await decompositionHandle.boundingBox()
    expect(handleBox).not.toBeNull()
    expect(handleBox!.x).toBeGreaterThanOrEqual(0)
    expect(handleBox!.x + handleBox!.width).toBeLessThanOrEqual(width)
    await expect(page.locator('html')).toHaveJSProperty('scrollWidth', width)
    if (width === 390) await touchDragHandleTo(page, '必要な材料を集める', '最小の実行単位に着手する')
    else await dragHandleTo(page, '必要な材料を集める', '最小の実行単位に着手する')
    await expect.poll(() => decompositionTitles(page)).toEqual([
      '目的と完了条件を確認する',
      '最小の実行単位に着手する',
      '必要な材料を集める',
    ])
  }
})
