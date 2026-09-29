import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Clock3, ListChecks, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { messages } from '../../messages'
import { useThemePreference } from '../../hooks/useThemePreference'
import { ThemeToggle } from '../theme/ThemeToggle'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const DEMO_VIDEO_URL = 'https://pub-7e2638ec617c45a7a55b30232114a3a0.r2.dev/pomdo-demo.mp4'
const DEMO_VIDEO_DESCRIPTION = 'タイマーを始めたら、今やることに集中。終わったら、次のタスクへ進みます。'
const DEMO_VIDEO_ACCESSIBLE_NAME = 'Pomdoのタイマーとタスク操作を紹介する動画'

function readReducedMotionPreference() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(REDUCED_MOTION_QUERY).matches
}

export function LandingPage() {
  const { theme, toggleTheme } = useThemePreference()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(readReducedMotionPreference)
  const [videoFailed, setVideoFailed] = useState(false)
  const rootRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const root = rootRef.current
    if (!root || !('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('reveal-in')), { threshold: 0.12 })
    root.querySelectorAll('.reveal').forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    const handleMotionPreferenceChange = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) videoRef.current?.pause()
      setPrefersReducedMotion(event.matches)
      setVideoFailed(false)
    }
    const supportsChangeEvent = typeof mediaQuery.addEventListener === 'function'
    if (supportsChangeEvent) mediaQuery.addEventListener('change', handleMotionPreferenceChange)
    else if (typeof mediaQuery.addListener === 'function') mediaQuery.addListener(handleMotionPreferenceChange)
    else return undefined
    return () => {
      if (supportsChangeEvent) mediaQuery.removeEventListener('change', handleMotionPreferenceChange)
      else mediaQuery.removeListener(handleMotionPreferenceChange)
    }
  }, [])
  const pillarIcons = [Clock3, ListChecks, Sparkles]
  return <main ref={rootRef} className="landing">
    <div className="landing-halo" aria-hidden="true" />
    <div className="landing-inner">
      <div className="landing-toolbar"><ThemeToggle theme={theme} onToggle={toggleTheme} /></div>
      <header className="landing-hero">
        <p className="eyebrow reveal">{messages.landing.eyebrow}</p>
        <h1 className="reveal">{messages.landing.title}</h1>
        <p className="landing-lead reveal">{messages.landing.lead}</p>
        <Link className="cta btn btn-primary btn-lg reveal" to="/app">{messages.landing.cta}<ArrowRight size={17} aria-hidden="true" /></Link>
      </header>
      <section className="demo-card card bg-base-100 border border-base-300 shadow-sm reveal" aria-label="Pomdoのデモ動画">
        <div className="demo-media">
          {prefersReducedMotion ? <div className="demo-video-fallback" role="img" aria-label={`${DEMO_VIDEO_ACCESSIBLE_NAME}。${DEMO_VIDEO_DESCRIPTION}`}><p>{DEMO_VIDEO_DESCRIPTION}</p></div>
            : videoFailed ? <div className="demo-video-fallback" role="status"><p>動画を再生できませんでした。</p><p>{DEMO_VIDEO_DESCRIPTION}</p></div>
              : <video ref={videoRef} className="demo-video" src={DEMO_VIDEO_URL} autoPlay muted loop playsInline controls={false} aria-label={DEMO_VIDEO_ACCESSIBLE_NAME} onError={() => setVideoFailed(true)}>{DEMO_VIDEO_DESCRIPTION}</video>}
        </div>
        {!prefersReducedMotion && !videoFailed ? <p>{DEMO_VIDEO_DESCRIPTION}</p> : null}
      </section>
      <section className="pillars" aria-label="Pomdoの特徴">{messages.landing.pillars.map((pillar, index) => { const Icon = pillarIcons[index]; return <article className="pillar card bg-base-200 border border-base-300 shadow-sm reveal" key={pillar.number}><span className="pillar-number">{pillar.number}</span><div className="pillar-heading"><Icon size={20} aria-hidden="true" /><h2>{pillar.title}</h2></div><p>{pillar.body}</p></article> })}</section>
      <section className="landing-who card bg-base-200 border border-base-300 shadow-sm reveal"><h2>こんな人のために</h2><p>「時間の見積もりが苦手」「同時にいくつも進めると疲れる」「できなかったことに目が向きやすい」と感じる人のために設計しています。</p></section>
      <p className="privacy-note reveal">登録なしで、今すぐ始められます。データはあなたのもの。不要になったら、ワンクリックで削除できます。</p>
      <footer className="landing-footer reveal"><Link to="/about">Pomdoについて</Link><Link to="/legal/terms">利用規約</Link><Link to="/legal/privacy">プライバシーポリシー</Link></footer>
    </div>
  </main>
}
