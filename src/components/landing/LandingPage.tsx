import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Clock3, ListChecks, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { messages } from '../../messages'
import { TimerDisc } from '../timer/TimerDisc'

export function LandingPage() {
  const [demoSeconds, setDemoSeconds] = useState(18 * 60)
  const rootRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const root = rootRef.current
    if (!root || !('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('reveal-in')), { threshold: 0.12 })
    root.querySelectorAll('.reveal').forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
  const pillarIcons = [Clock3, ListChecks, Sparkles]
  return <main ref={rootRef} className="landing">
    <div className="landing-halo" aria-hidden="true" />
    <div className="landing-inner">
      <header className="landing-hero">
        <p className="eyebrow reveal">{messages.landing.eyebrow}</p>
        <h1 className="reveal">{messages.landing.title}</h1>
        <p className="landing-lead reveal">{messages.landing.lead}</p>
        <Link className="cta reveal" to="/app">{messages.landing.cta}<ArrowRight size={17} /></Link>
      </header>
      <section className="demo-card reveal" aria-label="円盤タイマーのデモ">
        <TimerDisc remainingSecs={demoSeconds} plannedSecs={25 * 60} mode="focus" />
        <p>タイマーを始めたら、今やることに集中。終わったら、次のタスクへ進みます。</p>
        <input type="range" min="0" max="1500" value={demoSeconds} onChange={(event) => setDemoSeconds(Number(event.target.value))} aria-label="デモの残り時間" />
      </section>
      <section className="pillars" aria-label="Pomdoの特徴">{messages.landing.pillars.map((pillar, index) => { const Icon = pillarIcons[index]; return <article className="pillar reveal" key={pillar.number}><span className="pillar-number">{pillar.number}</span><div className="pillar-heading"><Icon size={20} aria-hidden="true" /><h2>{pillar.title}</h2></div><p>{pillar.body}</p></article> })}</section>
      <section className="landing-who reveal"><h2>こんな人のために</h2><p>「時間の見積もりが苦手」「同時にいくつも進めると疲れる」「できなかったことに目が向きやすい」と感じる人のために設計しています。</p></section>
      <p className="privacy-note reveal">登録なしで、今すぐ始められます。データはあなたのもの。不要になったら、ワンクリックで削除できます。</p>
      <footer className="landing-footer reveal"><Link to="/about">Pomdoについて</Link><Link to="/legal/terms">利用規約</Link><Link to="/legal/privacy">プライバシーポリシー</Link></footer>
    </div>
  </main>
}
