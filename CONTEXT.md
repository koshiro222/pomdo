# Pomdo

ADHD 当事者向けの「ポモドーロ × ToDo」Webアプリ。時間を外在化して見せ、次の一手を1つだけ指し、進捗を咎めずに振り返らせることを目的とする。

## Language

### タスクとキュー

**Task**:
ユーザーがやりたい／やるべき作業の1単位。状態は Backlog / Today / Done のいずれか。
_Avoid_: ToDo（プロダクト名としてのみ使用）, Item, Card

**Today**:
「今日やる」とユーザーが意思表示した Task に付くフラグ。Task は Today か Backlog のどちらか一方に属する。
_Avoid_: Scheduled, Planned

**Backlog**:
Today フラグが付いていない Task の集合。「いつかやる」置き場。
_Avoid_: Inbox, Someday

**Now**:
ユーザーが「今これをやる」と決めた唯一の Task。UI の主役として最大表示される。0 個または 1 個だけ存在する。
_Avoid_: Current Task, Active Task, Selected

**On Deck**:
Today のうち Now スロットに入っていない Task の待ち行列。「次はこれ」の控え。
_Avoid_: Queue, Up Next, Pending

### AI分解

**分解**:
大きすぎる、または曖昧な Task を、ユーザーの明示的な操作によって AI が複数の実行可能な Task に分割すること。生成される Task は元の Task と親子関係を持たず、独立した Task として並ぶ。分解を確定すると元の Task は削除される。
_Avoid_: Breakdown（Break と紛らわしいため避ける）, Split, Subtask（階層構造を連想させるため避ける）

**分解案**:
分解の実行によって AI が生成した、まだ確定していない Task の候補。ユーザーが確定前に編集・削除・並び替えできる一時的な状態で、確定すると通常の Task になる。
_Avoid_: Proposal, Suggestion, Draft Task

### 集中と時間

**Focus Session**:
集中して作業する1回の計測付き時間区間（いわゆる「ポモドーロ」）。任意で1つの Task に紐付く。**Completed**（予定時間に到達して終わった）と **Interrupted**（ユーザーが自分で区切った。経過が極端に短いものは記録しない）を区別する。集中実績の集計（Focused Days・完了本数・Estimate 進捗）は Completed のみを数え、Interrupted は「合計集中時間」にのみ寄与する。
_Avoid_: Pomodoro（技法名としてのみ使用）, Timer, Interval

**Break**:
Focus Session の合間の休憩区間。Short Break と Long Break がある。
_Avoid_: Rest, Pause

**Just Focus**:
Task に紐付けずに開始する Focus Session。既定フローではなく例外的な入口。
_Avoid_: Untracked session, Freestyle

**Estimate**:
Task の完了に必要そうな Focus Session の本数（任意）。残り本数を見せて「時間の外在化」に使う。
_Avoid_: Points, Effort

### 振り返り

**Today's Done**:
その日に完了した Task。当日中は達成感のために見え続け、翌日以降は Archive として扱われる（実際の移動はなく、完了日で判定される）。
_Avoid_: Completed list, History

**Archive**:
翌日以降に持ち越された Done な Task の保管場所。物理削除ではない。
_Avoid_: Trash, Deleted

**Focused Days**:
Focus Session を1回以上完了した日の累積カウント。減らない。途切れて0に戻る Streak の代わり。
_Avoid_: Streak, Chain
