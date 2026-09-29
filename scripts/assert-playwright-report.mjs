import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const reportPath = resolve(process.cwd(), 'test-results/results.json')
const allowedSkippedTitle = 'テスト専用認証 endpoint は本番モードで公開しない'

function collectSkippedTests(report) {
  const skippedTests = []

  function visitSuite(suite) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const resultStatuses = (test.results ?? []).map((result) => result.status)
        const hasSkippedResult = resultStatuses.length > 0 && resultStatuses.every((status) => status === 'skipped')
        const isSkipped = test.status === 'skipped' || test.expectedStatus === 'skipped' || hasSkippedResult

        if (isSkipped) {
          skippedTests.push(spec.title ?? test.title ?? '(タイトル不明)')
        }
      }

      for (const nestedSuite of spec.suites ?? []) visitSuite(nestedSuite)
    }

    for (const nestedSuite of suite.suites ?? []) visitSuite(nestedSuite)
  }

  for (const suite of report.suites ?? []) visitSuite(suite)
  return skippedTests
}

let report
try {
  report = JSON.parse(await readFile(reportPath, 'utf8'))
} catch (error) {
  const reason = error?.code === 'ENOENT' ? 'JSON reportがありません' : 'JSON reportを読み込めません'
  console.error(`${reason}: ${reportPath}`)
  process.exit(1)
}

const skippedTests = collectSkippedTests(report)
const hasDisabledBaseUrl = Boolean(process.env.E2E_DISABLED_BASE_URL?.trim())
const expectedSkippedTitles = hasDisabledBaseUrl ? [] : [allowedSkippedTitle]
const hasExpectedSkips = skippedTests.length === expectedSkippedTitles.length
  && skippedTests.every((title, index) => title === expectedSkippedTitles[index])

if (!hasExpectedSkips) {
  console.error('許可されていないPlaywrightのskipを検出しました。')
  console.error(`検出: ${skippedTests.length ? skippedTests.join(', ') : 'なし'}`)
  console.error(`期待: ${expectedSkippedTitles.length ? expectedSkippedTitles.join(', ') : 'なし'}`)
  process.exit(1)
}

console.log(`Playwrightのskip検査に成功しました（${skippedTests.length}件）。`)
