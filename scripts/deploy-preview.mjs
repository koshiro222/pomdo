import { execFileSync, spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const turnstileEnvironmentVariable = 'VITE_TURNSTILE_SITE_KEY'
const environmentFileNames = ['.env.local', '.dev.vars']

function readGitValue(gitArguments, description) {
  try {
    return execFileSync('git', gitArguments, {
      cwd: rootDirectory,
      encoding: 'utf8',
    }).trim()
  } catch {
    throw new Error(`${description}を確認できません。Gitリポジトリ内で実行してください。`)
  }
}

function parseEnvironmentValue(environmentText, variableName) {
  for (const line of environmentText.split(/\r?\n/)) {
    const environmentLine = line.trim()
    const assignment = environmentLine.match(
      /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/,
    )

    if (!assignment || assignment[1] !== variableName) continue

    const rawEnvironmentValue = assignment[2].trim()
    if (!rawEnvironmentValue) return undefined

    const quote = rawEnvironmentValue[0]
    if ((quote === '"' || quote === "'") && rawEnvironmentValue.at(-1) === quote) {
      return rawEnvironmentValue.slice(1, -1)
    }

    return rawEnvironmentValue
  }

  return undefined
}

async function loadEnvironmentValue(filePath, variableName) {
  let environmentText

  try {
    environmentText = await readFile(filePath, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined
    throw error
  }

  return parseEnvironmentValue(environmentText, variableName)
}

async function loadTurnstileSiteKey() {
  const shellSiteKey = process.env[turnstileEnvironmentVariable]?.trim()
  if (shellSiteKey) return shellSiteKey

  for (const environmentFileName of environmentFileNames) {
    const environmentFilePath = join(rootDirectory, environmentFileName)
    const fileSiteKey = await loadEnvironmentValue(
      environmentFilePath,
      turnstileEnvironmentVariable,
    )
    if (fileSiteKey?.trim()) return fileSiteKey.trim()
  }

  throw new Error(
    `${turnstileEnvironmentVariable} が未設定です。` +
      ' .env.local または .dev.vars に設定してから再実行してください。',
  )
}

function runExternalCommand(executable, commandArguments, environment) {
  const execution = spawnSync(executable, commandArguments, {
    cwd: rootDirectory,
    env: environment,
    stdio: 'inherit',
  })

  if (execution.error) throw execution.error
  if (execution.status !== 0) process.exit(execution.status ?? 1)
}

const currentBranch = readGitValue(['branch', '--show-current'], '現在のブランチ')
if (!currentBranch) {
  throw new Error('現在のブランチを特定できないため、Previewデプロイを中止しました。')
}
if (currentBranch === 'main' || currentBranch === 'master' || currentBranch === 'develop') {
  throw new Error('main/master/developブランチからの手動Previewデプロイは禁止しています。feature branchで実行してください。')
}

const headCommit = readGitValue(['rev-parse', 'HEAD'], 'HEADコミット')
const changedFiles = readGitValue(['status', '--porcelain', '--untracked-files=all'], '作業ツリー')
if (changedFiles) {
  throw new Error('未コミットの変更があります。変更をコミットしてからPreviewへデプロイしてください。')
}

const turnstileSiteKey = await loadTurnstileSiteKey()
const deploymentEnvironment = {
  ...process.env,
  [turnstileEnvironmentVariable]: turnstileSiteKey,
}
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npxExecutable = process.platform === 'win32' ? 'npx.cmd' : 'npx'

runExternalCommand(npmExecutable, ['run', 'build'], deploymentEnvironment)
runExternalCommand(
  npxExecutable,
  [
    '--no-install',
    'wrangler',
    'pages',
    'deploy',
    'dist',
    '--project-name=pomdo',
    `--branch=${currentBranch}`,
    `--commit-hash=${headCommit}`,
  ],
  deploymentEnvironment,
)
