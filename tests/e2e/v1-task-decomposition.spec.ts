import { expect, test } from '@playwright/test'
import { openAppAsAnonymous } from './helpers/auth'

test('NowのTaskをpreviewで編集してから分解を確定し、リロード後も結果を保持する', async ({ page }) => {
  await openAppAsAnonymous(page)
  await page.getByRole('button', { name: '編集' }).click()
  await page.getByRole('button', { name: 'AIで分解する' }).click()

  await expect(page.getByRole('heading', { name: 'タスクを分解' })).toBeVisible()
  await expect(page.getByLabel('分解案のタイトル').first()).toHaveValue('目的と完了条件を確認する')
  await expect(page.getByLabel('分解案のメモ').first()).toHaveValue('何をもって完了とするかを短く整理する')
  await expect(page.getByRole('heading', { name: 'Pomdo を5分だけ触ってみる' })).toBeVisible()

  const firstTitle = page.getByLabel('分解案のタイトル').first()
  await firstTitle.fill('編集した最初のTask')
  await page.getByLabel('分解案のメモ').first().fill('編集したメモ')
  await page.getByRole('button', { name: '必要な材料を集めるをこの分解案を削除' }).click()
  const keyboardDragHandle = page.getByRole('button', { name: '最小の実行単位に着手するをドラッグして並べ替え' })
  await keyboardDragHandle.press('Space')
  await keyboardDragHandle.press('ArrowUp')
  await keyboardDragHandle.press('Space')
  await page.getByRole('button', { name: '分解を確定する' }).click()

  await expect(page.getByRole('heading', { name: 'タスクを分解' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: /最小の実行単位に着手する 0 \/ 1 本/ })).toBeVisible()
  await expect(page.getByText('0 / 1 本').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pomdo を5分だけ触ってみる' })).not.toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: /最小の実行単位に着手する 0 \/ 1 本/ })).toBeVisible()
  await expect(page.getByText('編集した最初のTask')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pomdo を5分だけ触ってみる' })).not.toBeVisible()
})
