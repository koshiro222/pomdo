import { Link } from 'react-router'

export function LegalPage({ section = 'combined' }: { section?: 'about' | 'terms' | 'privacy' | 'combined' }) {
  const title = section === 'about' ? 'Pomdoについて' : section === 'terms' ? '利用規約（ドラフト）' : section === 'privacy' ? 'プライバシーポリシー（ドラフト）' : '利用規約・プライバシーポリシー（ドラフト）'
  return <main className="page-shell legal-page"><Link to="/">← LPへ戻る</Link><h1>{title}</h1>{section === 'about' ? <><p>Pomdo は、時間と次の一手を外在化するための集中ツールです。</p><h2>設計の考え方</h2><p>できなかったことではなく、できた分を静かに振り返れる体験を目指します。</p></> : <><p>Pomdo は集中とタスク管理を支援するサービスです。医療行為・診断・治療の代替ではありません。</p><h2>データについて</h2><p>タスク、Focus Session、設定はサービス提供のために保存します。ユーザーは JSON エクスポートとアカウント削除をいつでも実行できます。</p>{section === 'combined' || section === 'terms' ? <><h2>利用規約</h2><p>利用者は、自身の責任でサービスを利用します。サービスの正式な利用規約は公開前に確定します。</p></> : null}{section === 'combined' || section === 'privacy' ? <><h2>プライバシー</h2><p>認証、タスク、Focus Session のデータはサービス提供のために扱います。不要になったデータは設定画面から削除できます。</p></> : null}</>}<h2>ローンチ前の確認</h2><p className="warning">このページの公開は人間による法務レビュー完了をローンチ条件とします。</p></main>
}
