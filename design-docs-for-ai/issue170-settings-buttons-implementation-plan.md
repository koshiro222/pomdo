# Issue #170 実装計画: 設定ボタンの通常表示と Google ログイン配色

## 対象と目的

- 対象 Issue: https://github.com/koshiro222/pomdo/issues/170
- 対象範囲: Issue 全体
- Issue のコメント: `gh issue view 170 --comments` で確認し、コメントなし。
- 目的: `/app/settings` の `btn-soft` を通常の daisyUI ボタンへ変更し、Google ログインだけ Google を識別しやすい白地・中立色の枠・濃色文字で表示する。

Issue 本文、コメント、現行コードを照合した。Issue #167 / PR #169 の全画面ボタン変更は再適用しない。設定画面以外の variant、認証・設定保存・export・delete の処理は対象外である。

## 現状と設計判断

1. 現在の `src/components/settings/SettingsPage.tsx` には `btn-soft` を使うボタン要素が9個ある。内訳は初期化エラー時の再試行2個、サウンド試聴1個、テーマ選択3個、ログアウト1個、JSON export とアカウント削除2個。テーマ選択3個は1つの JSX map から描画される。Google ログイン用の `src/components/auth/GoogleLoginButton.tsx` にも1個あるため、設定画面で使われる計10個すべてを対象にする。
2. 通常の設定ボタンは `btn-soft` を外すだけにし、`btn`, `btn-sm`, `btn-block`、明示的な寸法・padding とレイアウトを維持する。選択中のテーマの `btn-primary`、削除の `btn-error`、テーマボタンの `aria-pressed` と各処理は維持する。
3. Google ボタンは `btn` と専用クラス `google-login-button` を使う。`btn-soft` と `btn-primary` は付けない。Google Identity の現行ガイドが示す標準4色ロゴ・白背景・`#747775` の枠色・`#1F1F1F` の文字色に合わせ、hover 時だけ背景を `#F2F2F2` にする。Issue の指定どおり light / dark の両テーマで白地とする。ボタン寸法と既存 `FcGoogle` アイコンは維持し、新しい依存やロゴ素材は加えない。
4. 専用 CSS は `google-login-button` に限定する。既存の全体 `:focus-visible` アウトラインと `button:disabled` の表示を上書きせず、disabled 時は hover 背景を適用しない。これにより設定画面外の daisyUI ボタンに影響させない。
5. クリック、遷移、Turnstile、匿名データの引き継ぎ、処理中の二重実行防止、処理中文言とエラー表示は変更しない。Google OAuth の実リダイレクトをE2Eに使わず、必要な認証リクエストはテスト用の route stub で扱う。

## 変更対象ファイル

| ファイル | 変更内容 |
| --- | --- |
| `src/components/settings/SettingsPage.tsx` | エラー再試行2個、試聴、テーマ3個、ログアウト、export、delete の9個から `btn-soft` を削除する。意味のある variant、サイズ、寸法、配置、disabled 条件とイベントを維持する。 |
| `src/components/auth/GoogleLoginButton.tsx` | ボタンを `btn google-login-button` にする。`FcGoogle`、アクセシブルネーム、`disabled={isPreparing}`、`送信を確認中…`、Turnstile・認証・エラー処理を維持する。 |
| `src/index.css` | `.google-login-button` の白背景、細い中立色枠、濃色文字と控えめな hover 背景を定義する。focus-visible と disabled の既存表示を保ち、設定画面外へスタイルを広げない。 |
| `tests/e2e/v1-ui-improvements.spec.ts` | 既存の設定画面 `btn-soft` アサーションを更新し、全設定ボタンの通常 variant、意味のある variant、寸法・配置、Google ボタンの light/dark・hover・keyboard focus・disabled 表示を確認する。初期化エラーの両 retry 表示と操作も追加する。 |

`tests/e2e/v1-auth-link.spec.ts` のテスト用 identity による匿名データ引き継ぎ、`tests/e2e/v1-review.spec.ts` の export / delete、Google 認証や設定保存の実装は回帰対象として現状のまま維持する。追加・変更するアプリ実装ファイルは上記3つで、API・DB変更はない。

## 実装手順

1. `SettingsPage.tsx` の全9個から `btn-soft` のみを外す。テーマボタンは非選択時も `btn`、選択時は `btn btn-primary` になり、`aria-pressed` が従来どおり真偽を示すことを保つ。削除ボタンの `btn-error`、試聴とテーマの `btn-sm`、export / delete の `btn-block`、試聴の `min-h-[34px] px-[11px] py-[6px]` を維持する。
2. `GoogleLoginButton.tsx` の class を `btn google-login-button` にし、他の props と処理を変更しない。`FcGoogle` は引き続き `aria-hidden="true"` とし、ボタンの既存テキストをアクセシブルネームとして使う。
3. `src/index.css` で `.google-login-button` を対象に `background-color: #fff`、`color: #1f1f1f`、`border: 1px solid #747775` を指定し、hover（かつ非 disabled）時に `#f2f2f2` を使う。light / dark で同じ配色にする。既存の共通 `:focus-visible` outline と `button:disabled` opacity / cursor が残ることを確認する。
4. `v1-ui-improvements.spec.ts` の `btn-soft` 検証を更新する。ページ内の設定ボタンに `.btn-soft` が残らないことを確認し、テーマ選択の `btn-primary` / `aria-pressed`、削除の `btn-error`、button dimensions とデータ操作欄の幅・gap を個別に検証する。
5. 同 spec に Google ボタンの視覚・操作確認を加える。light (`data-theme="cmyk"`) と dark (`data-theme="sunset"`) で背景・文字・枠色が同じであること、hover 背景が控えめな灰色に変わること、Tab focus で既存 outline が見えることを確認する。Google ログイン API の route stub を使い、実 OAuth に遷移させずにボタンクリックから Google provider の sign-in リクエストが発生することを確認する。
6. Google ログイン処理中とエラー表示は、`pomdo-focus-outbox` に現在の匿名ユーザー所有の有効な pending Focus fixture を置き、E2E route stub で `focus.complete` を保留・失敗させて検証する。fixture の `ownerUserId` は既存の `GET /api/auth/get-session` 応答の `user.id` から得る。`kind: 'completed'` と非nullの `completedAt` を設定して `focus.complete` を通るデータにする。その他のフィールドは `FocusOutboxPayload` の定義に従う。送信中はボタンが disabled で `送信を確認中…`、失敗後はボタンが再度操作可能になり既存のエラーが表示されることを確認する。実OAuthは呼ばない。
7. 初期化エラー時の2つの retry は、匿名サインイン失敗と `bootstrap.initialize` 失敗をそれぞれE2Eで起こし、通常の `btn` 表示を確認してから retry が復旧させることを確認する。ボタンのイベント先は `useAppSession` が返す `retryAnonymousSignIn` / `retryBootstrap` のままにする。
8. `btn-soft`、Google ボタン、Settings の既存処理への影響が他画面に漏れていないか検索する。Settings 外の button class はこの変更で編集しない。

## 利用 API と一次情報

新しいライブラリ API は導入しない。以下は現在の lockfile の解決バージョンと、この計画で使う既存 API / component class である。

| パッケージ / API | 現在のバージョン | 使用方法と一次情報 |
| --- | --- | --- |
| daisyUI Button component | `daisyui` 5.7.32（`package-lock.json`） | 通常ボタンは `btn`、意味のある色 variant は `btn-primary` / `btn-error`、サイズと幅は既存の `btn-sm` / `btn-block` を使う。`btn-soft` は対象画面から外す。公式 [Button component](https://daisyui.com/components/button/) に variant class と組み合わせ方が記載されている。 |
| `FcGoogle` | `react-icons` 5.7.0（`package-lock.json`） | 既存どおり `import { FcGoogle } from 'react-icons/fc'` として React 内で使う。別アイコンへ置換しない。一次情報: [react-icons README](https://github.com/react-icons/react-icons#readme)。 |
| Playwright Page / Locator / assertions | `@playwright/test` 1.58.2（`package-lock.json`） | `page.route(url, handler)` で認証・tRPCリクエストをstubし、`page.setViewportSize({ width, height })` と `page.emulateMedia({ colorScheme })` で desktop / mobile・light / dark を切り替える。`page.waitForEvent('download')` と `download.suggestedFilename()` でJSON exportを確認する。`page.getByRole('button', { name })`、Locator の `hover()`, `focus()`, `click()`, `isDisabled()`、`page.keyboard.press('Tab')`、`expect(locator).toHaveClass()`, `toHaveAttribute()`, `toHaveCSS()`, `toBeDisabled()` を使う。一次情報: [Page API](https://playwright.dev/docs/api/class-page)、[Download API](https://playwright.dev/docs/api/class-download)、[Locator API](https://playwright.dev/docs/api/class-locator)、[Keyboard API](https://playwright.dev/docs/api/class-keyboard)、[LocatorAssertions API](https://playwright.dev/docs/api/class-locatorassertions)。 |
| Google Identity branding | Google の公開ガイド（ライブラリ依存なし） | カスタムボタンの色とロゴの根拠として標準色ロゴ、白背景、細枠 `#747775`、文字色 `#1F1F1F` を参照する。今回の light / dark 両方を白地にする判断は Issue の明示要件を優先する。一次情報: [Sign in with Google Branding Guidelines](https://developers.google.com/identity/branding-guidelines)。 |

## テスト方針

### E2E: `tests/e2e/v1-ui-improvements.spec.ts`

- 既存の設定画面 E2E を維持しつつ、全表示ボタンに `btn-soft` がないことを確認する。テーマの3ボタンに選択状態と `btn-primary` が同期し、保存後の再読み込みでも選択テーマが復元されることを確認する。
- サウンド試聴、ログアウト、JSON export、削除の操作を維持する。ログアウトは `signInAsTestIdentity` で認証済みにしたユーザーから押してLPへ戻ること、export は `page.waitForEvent('download')` でJSONダウンロードを受け取り、ファイル名が `pomdo-export-YYYYMMDD.json` 形式であること、削除は確認後に従来どおり完了することを確認する。削除が `btn-error`、テーマ以外の通常操作が通常 `btn` であることを確認する。試聴は `min-h-[34px]`, `px-[11px]`, `py-[6px]`、テーマボタンは `btn-sm`、export / delete は `btn-block` が維持されていることを確認する。`.theme-options` の各幅、`.data-actions` の各幅と `10px` gap は既存アサーションを維持し、390px viewport でも横はみ出しがないことを確認する。
- 初期化エラー表示2種で retry が `btn` となり、再試行後に正常表示へ復旧することを確認する。
- Google ボタンを light / dark で計測し、background `rgb(255, 255, 255)`、文字 `rgb(31, 31, 31)`、枠 `rgb(116, 119, 117)` を確認する。hover 時の背景は `rgb(242, 242, 242)` を確認する。4色アイコンのSVG、アクセシブルネーム、Tab focus outline、disabled 時の操作不可とopacity低下も確認する。
- pending Focus outbox fixture を使用するケースでは、`focus.complete` を route stub で保留した間の disabled、処理中文言、既存 `button:disabled` の opacity 低下、失敗時のエラー表示、再操作可能への復帰を確認する。Google OAuth リクエストは route stub で終端し、外部認証画面を開かない。
- Settings 外のLP / App / Reviewに既存の画面遷移・UIテストを通し、今回のクラスやCSSが設定画面外の variant を変えないことを確認する。

### 既存の関連 E2E

- `tests/e2e/v1-auth-link.spec.ts`: テスト用 Google identity による匿名データ引き継ぎが引き続き成功し、Settings にログアウト操作が表示される。Issue が禁止する実 Google OAuth に依存しない。
- `tests/e2e/v1-review.spec.ts`: export ボタン操作と、確認ダイアログ後のアカウント削除・LPへの遷移が維持される。ファイルの実ダウンロード確認は `v1-ui-improvements.spec.ts` で追加する。

この変更はclassとCSSに限定されるため、認証・設定保存・export / delete の処理コードを変えるテストやAPI/DBテストは追加しない。

## 品質管理

実装担当はルート `CLAUDE.md` の「品質管理」を上から順番に実行し、失敗を隠さず記録する。

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test -- --run`
5. `npm run test:coverage`
6. `npm run build`
7. `npm run test:e2e -- --project=chromium`
8. Playwright CLI で実画面を操作する。
9. light / dark / system、mobile / desktop、keyboard、reduced-motion / reduced-transparency、ネットワーク断を確認する。
10. `rtk git diff --check`、`btn-soft` の旧参照検索、secret 混入確認を行う。

## ブラウザでの動作確認

1. この作業ディレクトリのコードを配信している `/app/settings` を desktop 幅（例: 1440×900）で開く。system / light / dark の各テーマを選択し、選択中だけが primary、再読み込み後も同じ選択、各テーマボタンの寸法が同等であることを確認する。
2. 初期化が完了した設定画面で、試聴、ログアウト、JSON export、アカウント削除のボタンが通常の daisyUI 表現であることを確認する。テスト用 identity でログインしてログアウト後LPへ戻ること、export 後にJSONがダウンロードされること、削除は確認後に完了することを確認する。削除は error として識別でき、各操作の結果・disabled 条件・ダイアログは従来どおりであることを確認する。
3. 匿名ユーザーの Google ログインボタンを light と dark の両方で表示する。両方とも白地、1px中立色枠、濃色文字、4色アイコンであり、hover では控えめな灰色になることを確認する。例: 通常時 `#FFFFFF` 背景・`#747775` 枠・`#1F1F1F` 文字、hover 時 `#F2F2F2` 背景。Tab で到達したとき focus-visible outline が見え、処理中は native disabled、既存のopacity低下と not-allowed cursor、「送信を確認中…」で状態が分かる。
4. テスト用の Google sign-in request stub でクリック導線を確認し、実Google OAuthへ遷移しない。既存 `v1-auth-link.spec.ts` のテスト用 identity フローで匿名データ引き継ぎが維持される。
5. 匿名サインイン失敗・bootstrap 失敗の初期化画面をそれぞれ表示する。各画面の retry が通常表示であること、押すと再試行されることを確認する。
6. viewport を 390×844 にする。テーマ3列、試聴ボタン、block の export / delete、Google ボタンに横はみ出しがなく、タップ領域と配置が変わっていないことを light / dark で確認する。
7. E2E の処理中 fixture で Google ログイン準備中の disabled と `送信を確認中…`、送信失敗時の既存エラー、再操作可能状態を確認する。
8. 設定からAppへ戻り、設定専用CSSが他画面のボタン variant に漏れていないことを確認する。system / light / dark と reduced-motion / reduced-transparency、offline 時にもUIが崩れず、設定画面外の操作が維持されることを確認する。

## 完了条件

- Settings の10個すべての `btn-soft` がなくなり、通常の `btn` 表現になっている。
- テーマ選択の primary / `aria-pressed`、削除の error、各寸法と配置・タップ領域が維持される。
- Google ボタンが light / dark で白地・中立色の枠・濃色文字・既存4色アイコンとなり、hover / focus-visible / disabled と処理中表示を判別できる。
- クリック・遷移・認証・Turnstile・テーマ保存・匿名データ引き継ぎ・export / delete に回帰がない。
- Settings 外の button variant に変更がなく、更新した E2E と `CLAUDE.md` の品質管理を完了する。
