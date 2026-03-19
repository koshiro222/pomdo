# Phase 02: Authentication - Research

**Researched:** 2026-03-20
**Domain:** Better Auth Admin Plugin + tRPC Authorization
**Confidence:** HIGH

## Summary

Better AuthのAdmin Pluginを使用してadminロール機能を実装します。同プラグインは`users`テーブルに`role`、`banned`、`banReason`、`banExpires`カラムを追加し、デフォルトで`admin`と`user`の2種類のロールを提供します。初期管理者はマイグレーションSQLで直接登録し、tRPCミドルウェアで権限チェックを実装します。

**Primary recommendation:** Better Auth Admin Pluginをそのまま使用し、カスタムアクセスコントロールは導入しない（シンプルな2ロール構成で十分）

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **adminロールの実装方法**: Better Auth 組み込み role 機能を使用
  - role 値: `admin` / `user` の2値（シンプルな2種類）
  - データ型: enum('admin', 'user') — Drizzle で型安全に定義
  - デフォルト: 新規ユーザーは全て `'user'` ロールで開始
  - `users` テーブルに `role` カラムを追加
  - Better Auth の `user` schema に `role` フィールドを追加
  - Better Auth 側で role 許可設定（permissions）を実装

- **初期管理者の登録方法**: マイグレーション SQL に含める（バージョン管理可能、再現可能）
  - 対象: 開発者の Google アカウントメールアドレスを admin に固定
  - 2人目以降: 今回は実装しない（DB 直接操作や別フェーズで対応）
  - マイグレーション SQL 内で特定メールアドレスのユーザーを admin に更新
  - ロール追加と初期管理者登録を同一マイグレーションで完結

- **tRPCでの権限チェック構造**: ミドルウェアで一元管理
  - プロシージャ構造: `adminProcedure`（管理者用）と `protectedProcedure`（ログインユーザー用）の2種類
  - エラー処理: 未認証時は `UNAUTHORIZED(401)`、非管理者時は `FORBIDDEN(403)` を使い分け
  - tRPC ミドルウェアで `ctx.user.role` をチェック
  - `adminProcedure` は role === 'admin' のみ通過
  - `protectedProcedure` はログイン済みユーザーなら通過
  - 権限なし時は `TRPCError` を throw

- **クライアント側の権限参照**: useAuth フックを拡張し、クライアント側でも role を保持
  - UI 表示: 条件レンダリングで管理ボタンを表示
  - 型安全: authClient の型定義を拡張し、role を TypeScript で型安全に参照
  - `src/lib/auth.ts` または新規 hooks で `useAuth` を拡張
  - `authClient.signIn/useSession` の戻り値型に `role` を追加
  - `isAdmin()` 判定関数を用意し、Header 等で条件レンダリング

### Claude's Discretion

- Better Auth の role/permission 設定の詳細なオプション
- マイグレーション SQL のフォーマット
- tRPC ミドルウェアの実装詳細
- クライアント側型拡張の具体的な実装方法

### Deferred Ideas (OUT OF SCOPE)

- 2人目以降の管理者追加機能 — 将来のフェーズまたは DB 直接操作で対応
- 管理者用の UI によるユーザー権限変更画面 — Phase 6 以降で検討
- 複数ロール（moderator 等）の実装 — 必要時に追加

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Better Auth で admin ロール設定方法確認 | Better Auth Admin Pluginが提供するrole機能とschema拡張方法を文書化 |
| AUTH-02 | 管理者判定ロジック実装 | tRPCミドルウェアパターンと型拡張方法を特定 |
| AUTH-03 | 非管理者の管理APIアクセスを拒否（TRPCError） | TRPCErrorのFORBIDDEN(403)使用方法と既存ミドルウェアパターンを確認 |
| API-08 | admin ロール判定ミドルウェア | adminProcedureの実装パターンを提供 |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | 1.5.4 | Authentication framework | Admin Pluginがrole機能を提供 |
| @trpc/server | 11.0.0 | TypeScript RPC | ミドルウェアパターンで権限チェック |
| drizzle-orm | 0.45.1 | Database ORM | usersテーブルにroleカラム追加 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | - | Schema validation | tRPCルーターのinputバリデーション |
| vitest | - | Unit testing | ミドルウェアの単体テスト |
| playwright | - | E2E testing | 認証フローのE2Eテスト |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Better Auth Admin Plugin | カスタムrole実装 | Admin PluginはDBスキーマ、API、型定義を提供するため、自作する必要がない |

**Installation:**
```bash
# 既存のバージョンで十分（追加インストール不要）
npm list better-auth @trpc/server drizzle-orm
```

**Version verification:**
```bash
npm view better-auth version        # 1.5.5 (latest: 1.5.4 installed)
npm view @trpc/server version      # 11.13.4 (latest: 11.0.0 installed)
npm view drizzle-orm version       # 0.45.1 (latest: 0.45.1 installed)
```

インストール済みバージョンは最新版に近く、追加パッケージは不要。

## Architecture Patterns

### Recommended Project Structure
```
functions/lib/
├── auth.ts              # Better Authインスタンス（admin plugin追加）
├── schema.ts            # usersテーブルにroleカラム追加
└── middleware/
    └── admin.ts         # （新規）tRPC adminミドルウェア

src/app/routers/
├── context.ts           # SessionUser型にrole追加、adminProcedure追加
└── _shared.ts           # 共通スキーマ定義

src/
├── lib/auth.ts          # authClientにadminClient plugin追加
├── hooks/useAuth.ts     # useAuthフックにroleとisAdmin追加
└── core/store/auth.ts   # AuthUser型にrole追加

drizzle/
└── 0006_*.sql           # （新規）roleカラム追加＆初期管理者登録
```

### Pattern 1: Better Auth Admin Plugin Setup
**What:** Admin Pluginを有効化し、roleフィールドをusersテーブルに追加
**When to use:** 認証機能のセットアップ時
**Example:**
```typescript
// Source: https://www.better-auth.com/docs/plugins/admin
import { betterAuth } from "better-auth"
import { admin } from "better-auth/plugins"

export const auth = betterAuth({
  // ... 既存設定
  plugins: [
    admin() // デフォルトでrole='user'、adminRoles=['admin']
  ]
})
```

**重要:** Admin Pluginは自動的に以下のフィールドをusersテーブルに追加する：
- `role` (text, default 'user')
- `banned` (boolean)
- `banReason` (text)
- `banExpires` (timestamp)

### Pattern 2: tRPC Admin Middleware
**What:** ログイン済みかつadminロールのユーザーのみ通過するミドルウェア
**When to use:** 管理者専用APIプロシージャを定義する場合
**Example:**
```typescript
// Source: 既存コードベースの protectedProcedure パターンを拡張
import { TRPCError } from '@trpc/server'

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED', // 401
      message: 'ログインが必要です',
    })
  }
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN', // 403
      message: '管理者権限が必要です',
    })
  }
  return next({
    ctx: { ...ctx, user: ctx.user },
  })
})
```

### Pattern 3: マイグレーションでの初期管理者登録
**What:** 特定メールアドレスのユーザーをadminに更新するSQL
**When to use:** デプロイ時に初期管理者を設定する場合
**Example:**
```sql
-- Source: 既存マイグレーションのパターン (drizzle/0003_*.sql)
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;
-->statement-breakpoint
UPDATE "users" SET "role" = 'admin' WHERE "email" = 'developer@example.com';
```

**注意:** 開発者のメールアドレスは事前に確認し、ハードコードする。

### Pattern 4: クライアント側型拡張
**What:** SessionUser型にroleを追加し、isAdmin判定関数を提供
**When to use:** クライアント側で権限による条件レンダリングを行う場合
**Example:**
```typescript
// src/core/store/auth.ts
export type AuthUser = {
  id: string
  email: string
  name: string
  image: string | null
  emailVerified: boolean
  role: 'admin' | 'user' // 追加
}

// src/hooks/useAuth.ts
export function useAuth() {
  const { data: session } = authClient.useSession()

  const user: AuthUser | null = session?.user
    ? {
        // ... 既存フィールド
        role: session.user.role ?? 'user', // 追加
      }
    : null

  const isAdmin = user?.role === 'admin' // 追加

  return { user, loading: isPending, login, logout, isAdmin }
}
```

### Anti-Patterns to Avoid
- **カスタムroleテーブル作成:** Admin Pluginが提供する機能を再実装する無駄
- **クライアント側のみの権限チェック:** 必ずサーバー側（tRPCミドルウェア）でも検証する
- **roleチェックの分散:** ミドルウェアで一元管理し、各プロシージャで個別にチェックしない

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Role管理システム | 独自のroleテーブル・API | Better Auth Admin Plugin | DBスキーマ、APIエンドポイント、型定義を提供 |
| 権限チェックロジック | 各プロシージャでif文チェック | tRPCミドルウェアパターン | DRY、一元管理、再利用可能 |
| セッション管理 | 独自の認証ミドルウェア | 既存のHonoミドルウェア | パターンが確立済み |

**Key insight:** Better Auth Admin Pluginは、role管理に必要なインフラ（DBスキーマ、API、型）をすべて提供する。これを再構築する価値はない。

## Common Pitfalls

### Pitfall 1: マイグレーション実行順序
**What goes wrong:** Better Auth Admin Pluginの有効化前に、roleフィールドを手動で追加しようとすると競合する
**Why it happens:** Admin Pluginが自動的に同じフィールドを追加しようとする
**How to avoid:**
1. 先にAdmin Pluginを有効化
2. `npm run db:generate`でスキーマ変更を検出
3. 生成されたマイグレーションを確認し、初期管理者登録のSQLを追記
**Warning signs:** マイグレーション生成時に「roleカラムは既に存在する」エラー

### Pitfall 2: tRPCコンテキストと型の不一致
**What goes wrong:** `ctx.user`にroleが含まれていないため、adminProcedureで型エラー
**Why it happens:** SessionUser型定義とDrizzleスキーマの不一致
**How to avoid:**
1. `schema.ts`のusersテーブルにroleカラムを追加
2. `context.ts`のSessionUser型にroleを追加
3. tRPCコンテキスト生成時にroleを渡す
**Warning signs:** `Property 'role' does not exist on type 'SessionUser'`

### Pitfall 3: クライアント側のadminClient plugin未追加
**What goes wrong:** `authClient.admin.setRole()`等のメソッドが存在しない
**Why it happens:** サーバー側のみadmin pluginを有効化し、クライアント側を忘れている
**How to avoid:** `src/lib/auth.ts`のauthClientにもadminClient pluginを追加
**Warning signs:** `authClient.admin is undefined`

### Pitfall 4: 初期管理者登録のタイミング
**What goes wrong:** マイグレーション実行時に対象ユーザーがまだ存在しない
**Why it happens:** ユーザー登録後にマイグレーションを実行すると、UPDATEが0件になる
**How to avoid:**
1. 開発環境で先にGoogleログインし、ユーザーを作成
2. メールアドレスを確認
3. マイグレーションSQLにそのメールアドレスをハードコード
**Warning signs:** マイグレーション後もroleが'user'のまま

## Code Examples

Verified patterns from official sources:

### Better Auth Admin Plugin Setup
```typescript
// Source: https://www.better-auth.com/docs/plugins/admin
import { betterAuth } from "better-auth"
import { admin } from "better-auth/plugins"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  plugins: [
    admin() // デフォルト: defaultRole='user', adminRoles=['admin']
  ]
})
```

### Drizzle Schema with role field
```typescript
// Source: 既存コードベースのパターン (functions/lib/schema.ts)
import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  googleId: text("google_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // Admin Pluginが自動追加するフィールド（手動定義は不要だが、型安全のため明示）
  role: text("role").notNull().default('user'), // 追加
  banned: boolean("banned").notNull().default(false), // 追加
  banReason: text("ban_reason"), // 追加
  banExpires: timestamp("ban_expires"), // 追加
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})
```

**注:** Better Auth Admin Pluginは、これらのフィールドを自動的に管理する。Drizzleスキーマに明示的に定義するか、Plugin側に任せるか選択できる。型安全性のため明示定義を推奨。

### tRPC Context with role
```typescript
// Source: 既存コードベースのパターン (src/app/routers/context.ts)
import { initTRPC, TRPCError } from '@trpc/server'

type SessionUser = {
  id: string
  email: string
  name: string
  image: string | null
  role: 'admin' | 'user' // 追加
}

interface Context {
  user: SessionUser | null
  db: any
  schema: any
}
```

### Admin Procedure Middleware
```typescript
// Source: 既存コードベースの protectedProcedure パターン
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'ログインが必要です',
    })
  }
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: '管理者権限が必要です',
    })
  }
  return next({
    ctx: { ...ctx, user: ctx.user },
  })
})
```

### Client-side authClient with admin plugin
```typescript
// Source: https://www.better-auth.com/docs/plugins/admin
import { createAuthClient } from 'better-auth/client'
import { adminClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  plugins: [
    adminClient() // 追加
  ]
})
```

### Migration SQL with initial admin setup
```sql
-- Source: 既存マイグレーションパターン (drizzle/0003_*.sql)
-- Admin Pluginがroleカラムを追加
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;
-->statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banned" boolean DEFAULT false NOT NULL;
-->statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_reason" text;
-->statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_expires" timestamp;
-->statement-breakpoint
-- 初期管理者を登録（開発者のメールアドレス）
UPDATE "users" SET "role" = 'admin' WHERE "email" = 'developer@example.com';
```

### Check admin role on client
```typescript
// Source: 既存コードベースの useAuth パターン (src/hooks/useAuth.ts)
export function useAuth() {
  const { data: session, isPending } = authClient.useSession()

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image ?? null,
        emailVerified: session.user.emailVerified,
        role: session.user.role ?? 'user', // 追加
      }
    : null

  const isAdmin = user?.role === 'admin' // 追加

  return {
    user,
    loading: isPending,
    login,
    logout,
    isAdmin // 追加
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 独自role管理 | Better Auth Admin Plugin | v1.0+ | DBスキーマ、API、型定義が自動生成される |
| パスワード保護API | tRPCミドルウェアパターン | tRPC v10+ | 権限チェックを再利用可能なミドルウェアに抽出 |

**Deprecated/outdated:**
- 独自のadminテーブル: Admin Pluginがusersテーブル内で管理するため不要
- roleチェックの分散: ミドルウェアパターンが推奨されている

## Open Questions

なし。調査により全項目が解決済み。

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Playwright |
| Config file | `vitest.config.ts` / `playwright.config.ts` |
| Quick run command | `npm test` (Vitest unit tests) |
| Full suite command | `npm run test:e2e` (Playwright E2E) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Better Auth admin pluginが有効化されている | unit | `npm test -- auth.test.ts` | ❌ Wave 0 |
| AUTH-02 | tRPCミドルウェアでroleチェックが行われる | unit | `npm test -- admin-middleware.test.ts` | ❌ Wave 0 |
| AUTH-03 | 非adminユーザーがadminプロシージャを呼ぶとFORBIDDEN | unit | `npm test -- admin-middleware.test.ts` | ❌ Wave 0 |
| API-08 | adminProcedureが定義され、権限チェックを行う | unit | `npm test -- admin-middleware.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test` (Vitest単体テスト)
- **Per wave merge:** `npm run test:e2e` (Playwright E2Eテスト)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/auth.test.ts` — Better Auth admin plugin設定テスト（AUTH-01）
- [ ] `tests/unit/admin-middleware.test.ts` — tRPC adminProcedureミドルウェアテスト（AUTH-02, AUTH-03, API-08）
- [ ] `tests/e2e/admin-auth.spec.ts` — 管理者ログインと権限チェックのE2Eテスト
- [ ] `tests/helpers/admin.ts` — 管理者テストユーザーのヘルパー関数

**注:** 既存のE2Eテストインフラ（`tests/e2e/auth.spec.ts`, `tests/helpers/auth.ts`）が存在するため、これを拡張して管理者テストを追加する。

## Sources

### Primary (HIGH confidence)
- [Better Auth Admin Plugin Documentation](https://www.better-auth.com/docs/plugins/admin) - Admin Pluginの設定、API、スキーマ変更、権限システム
- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization) - アクセスコントロールパターンの参考
- `/Users/koshiro/develop/pomdo/functions/lib/auth.ts` - 既存のBetter Auth設定
- `/Users/koshiro/develop/pomdo/functions/lib/schema.ts` - 既存のDrizzleスキーマ
- `/Users/koshiro/develop/pomdo/src/app/routers/context.ts` - 既存のtRPCコンテキストとミドルウェアパターン
- `/Users/koshiro/develop/pomdo/src/hooks/useAuth.ts` - 既存のuseAuthフック
- `/Users/koshiro/develop/pomdo/drizzle/0003_*.sql` - 既存のマイグレーションパターン
- `/Users/koshiro/develop/pomdo/tests/e2e/auth.spec.ts` - 既存のE2Eテストパターン

### Secondary (MEDIUM confidence)
- [tRPC v11 Documentation](https://trpc.io/docs) - ミドルウェアパターン（既存コードベースで検証済み）
- [Drizzle ORM Documentation](https://orm.drizzle.team/) - PostgreSQL方言とマイグレーション（既存コードベースで検証済み）

### Tertiary (LOW confidence)
- なし（WebSearchは結果なし。公式ドキュメントと既存コードベースで十分）

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - インストール済みバージョンを確認し、公式ドキュメントと照合
- Architecture: HIGH - 既存コードベースのパターンを分析し、公式ドキュメントで検証
- Pitfalls: HIGH - 既存のマイグレーションとテストパターンから抽出

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (30日 - 安定したライブラリのため)
