# アーキテクチャ

React UI は TanStack Query/tRPC をサーバー状態に使い、実行中 Focus だけ Zustand persist に置く。Functions は tRPC の入口から server context を作り、router → service → repository で処理する。DB は Better Auth 標準テーブル、`tasks`、`focus_sessions`、`analytics_events` で構成する。

具体例: `tasks.complete` は router で認可し、repository の Task 更新と `users.current_task_id` の NULL 化を実行する。UI から `user_id` を受け取って信頼してはいけない。
