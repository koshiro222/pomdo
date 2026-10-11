# 派生できる状態は保存せず、日付から都度導出する

Task の「Today / Backlog / Done / Archive」という状態は、専用の状態カラムやフラグ（`archived_at` など）で持たず、`planned_for`（日付）・`completed_at`（タイムスタンプ）・「ユーザーのタイムゾーンにおける今日」から都度算出する。[[0004-focus-session-single-source-of-truth]] の「非正規化カウンタを持たない」方針を、Task の状態表現へ拡張したもの。

## 背景

「翌日になったら完了タスクを Archive へ移す」「今日やる予定だったが手をつけなかったタスクを Backlog へ戻す」といった日次の状態遷移を素直に実装すると、日付ロールオーバー時のバッチ処理が要る。バッチはタイムゾーンごとに発火タイミングが異なり、ユーザーがタイムゾーンを変更すると過去の遷移が正しくない状態で固定される。

## 理由

- 状態は完全に `planned_for` と `completed_at` から導ける。`Today = planned_for が今日(TZ)`、`Backlog = planned_for が null または昨日以前`、`Today's Done = completed_at >= 今日0:00(TZ)`、`Archive = completed_at < 今日0:00(TZ)`。
- 都度導出ならタイムゾーン変更に自動追従し、「昨日」「今日」の境界がユーザーの現在地基準で常に正しい。
- v1 の規模では導出クエリのコストは無視できる。

## 結果

- `tasks` テーブルに `archived_at` は無い。Archive は「完了済みかつ完了日が今日より前」というビュー上の概念。
- 昨日以前の `planned_for` を持つ未完了 Task は Today ビューから自然に外れる。`deck_order` などのゴミは app 起動時の軽いスイープ（`planned_for < today(TZ)` の自 Task を `planned_for = null, deck_order = null` に一括 UPDATE）で片付ける。`current_task_id` が指す Task だけは例外で、起動時に `planned_for = today` へリフレッシュする。
- 将来「Archive 日時が知りたい」等でカラムを足したくなったら、まずこの ADR を読むこと。監査ログが要るなら別テーブルで持つ。
