# Plan 021-01 Summary: 曜日表示を日曜始まりに変更

**Phase:** 21 - 曜日表示修正
**Plan:** 01 - getDayLabel()関数の日曜始まり修正とテスト更新
**Status:** Complete

---

## What was built

- getDayLabel()関数の日曜始まり実装
- 週データ生成ロジックを日曜始まりに修正
- 更新されたテストコード（コメント追加）

## Tasks completed

1. **Task 1: getDayLabel()関数を日曜始まりに修正** ✓
   - 曜日配列を `['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']` から `['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']` に変更
   - dayIndex計算を `(date.getDay() + 6) % 7` から `date.getDay()` に変更
   - 「Today」表示ロジックは維持

2. **Task 2: テスト内の曜日ハードコードを更新** ✓
   - テストデータに日曜始まり対応を明記するコメントを追加

3. **追加修正: 週データ生成ロジックの修正** ✓
   - 「過去7日間」から「日曜始まりの今週」にロジックを変更
   - グラフのX軸が Sun Mon Tue... の順に正しく表示されるように修正

## Key files created/modified

- `src/components/stats/StatsCard.tsx` - getDayLabel()関数の日曜始まり実装、週データ生成ロジック修正
- `src/components/stats/StatsCard.test.tsx` - コメント追加

## Decisions made

- 週データは「過去7日間」ではなく「日曜始まりの今週」を生成するように変更
- これによりグラフのX軸が日本のカレンダー文化（日曜始まり）に合わせて表示される

## Deviations from plan

- プランにはなかった週データ生成ロジックの修正を追加実施
- 理由: getDayLabel()のみ修正しても、週データが「過去7日間」のため曜日順序がバラバラになっていた

## Integration notes

- getDayLabel()関数はweeklyData[].date生成で使用されている
- グラフのXAxisはdateキーを使用しているため、日曜始まりの曜日が表示される
- 週データは日曜始まりで生成され、X軸は「Sun, Mon, Tue...」の順に表示される

## Commits

1. `feat(stats): 曜日表示を日曜始まりに変更`
2. `test(stats): テストデータに日曜始まり対応を明記`
3. `fix(stats): 週データを日曜始まりで生成するように修正`
