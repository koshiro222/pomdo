import { access, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import net from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const rootDirectory = resolve(dirname(new URL(import.meta.url).pathname), '..')

async function loadEnvironmentValue(filePath, variableName) {
  let environmentText
  try {
    environmentText = await readFile(filePath, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined
    throw error
  }

  for (const line of environmentText.split(/\r?\n/)) {
    const assignment = line.trim().match(
      /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/,
    )
    if (!assignment || assignment[1] !== variableName) continue
    const rawValue = assignment[2].trim()
    if (!rawValue) return undefined
    const quote = rawValue[0]
    if ((quote === '"' || quote === "'") && rawValue.at(-1) === quote) {
      return rawValue.slice(1, -1).trim() || undefined
    }
    return rawValue
  }

  return undefined
}

const databaseUrl = await loadEnvironmentValue(join(rootDirectory, '.dev.vars'), 'DATABASE_URL')
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL が未設定です。ローカルE2E専用Neon branchの接続先を .dev.vars に設定してください。' +
      ' Preview/Production URLを代わりに使用しないでください。',
  )
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'pomdo-e2e-'))
const childProcesses = []
let isShuttingDown = false

async function linkIfPresent(name, type) {
  const source = join(rootDirectory, name)
  const destination = join(temporaryDirectory, name)

  try {
    await access(source)
  } catch {
    return
  }

  await symlink(source, destination, type)
}

async function isListening(port) {
  return new Promise((resolveListening) => {
    const socket = net.createConnection({ host: '127.0.0.1', port })
    const finish = (listening) => {
      socket.destroy()
      resolveListening(listening)
    }

    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
  })
}

async function prepareE2eRuntime() {
  await Promise.all([
    linkIfPresent('functions', 'dir'),
    linkIfPresent('src', 'dir'),
    linkIfPresent('dist', 'dir'),
    linkIfPresent('node_modules', 'dir'),
    linkIfPresent('.dev.vars', 'file'),
  ])

  await writeFile(join(temporaryDirectory, 'wrangler.toml'), `name = "pomdo-e2e"
compatibility_date = "2026-09-04"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"
`)
}

function startProcess(command, args, options) {
  const child = spawn(process.execPath, [command, ...args], {
    ...options,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl, E2E_TEST_MODE: 'true' },
  })
  childProcesses.push(child)
  return child
}

async function stopProcesses(exitCode) {
  if (isShuttingDown) return
  isShuttingDown = true

  for (const child of childProcesses) {
    if (!child.killed) child.kill('SIGTERM')
  }

  await rm(temporaryDirectory, { recursive: true, force: true })
  process.exit(exitCode)
}

await prepareE2eRuntime()

const viteCommand = join(rootDirectory, 'node_modules/vite/bin/vite.js')
const wranglerCommand = join(rootDirectory, 'node_modules/wrangler/wrangler-dist/cli.js')

if (!(await isListening(5173))) {
  const viteProcess = startProcess(viteCommand, ['--host', '127.0.0.1', '--port', '5173', '--strictPort'], { cwd: rootDirectory })
  viteProcess.once('exit', (code) => {
    if (!isShuttingDown) void stopProcesses(code ?? 1)
  })
}

const wranglerProcess = startProcess(wranglerCommand, ['pages', 'dev', '--proxy', '5173', '--port', '8788'], { cwd: temporaryDirectory })
wranglerProcess.once('exit', (code) => {
  if (!isShuttingDown) void stopProcesses(code ?? 1)
})

process.once('SIGINT', () => void stopProcesses(130))
process.once('SIGTERM', () => void stopProcesses(143))

await new Promise(() => {})
