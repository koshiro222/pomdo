import { CheckCircle2, Pencil } from 'lucide-react'
import { messages } from '../../messages'
import type { TaskView } from '../tasks/TaskRow'

export function NowCard({ task, completedFocusCount, onComplete, onEdit, onJustFocus }: { task: TaskView | null; completedFocusCount: number; onComplete: () => void; onEdit: () => void; onJustFocus: () => void }) {
  const progress = task?.estimate === null || task?.estimate === undefined
    ? `${completedFocusCount} 本`
    : <>{Math.min(completedFocusCount, task.estimate)} / {task.estimate} 本{completedFocusCount >= task.estimate ? ' ✓' : null}{completedFocusCount > task.estimate ? <span className="overflow-count"> {completedFocusCount}</span> : null}</>
  return <section className={`now-card card bg-base-100 border border-base-300 shadow-sm ${task ? '' : 'empty'}`} aria-labelledby="now-heading">
    <div className="kicker" id="now-heading">{messages.app.now}</div>
    {task ? <><h1>{task.title}</h1><p className="now-note">{task.note ?? '小さく始めて、できた分だけ進めます。'}</p><div className="now-footer"><span>{progress}</span><span className="spacer" /><button className="btn btn-sm min-h-[34px] px-[11px] py-[6px]" type="button" onClick={onEdit}><Pencil size={14} /> 編集</button><button className="btn btn-sm min-h-[34px] px-[11px] py-[6px]" type="button" onClick={onComplete}><CheckCircle2 size={14} /> 完了</button></div></> : <><h1>今は、決めなくて大丈夫。</h1><p className="now-note">Next から1つ選ぶか、このまま集中できます。</p><button className="btn btn-primary btn-sm min-h-[34px] px-[11px] py-[6px]" type="button" onClick={onJustFocus}>このまま集中する</button></>}
  </section>
}
