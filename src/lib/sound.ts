export function playFocusChime(volume: number, muted: boolean): void {
  if (muted || volume <= 0 || typeof window === 'undefined') return
  const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextConstructor) return
  const context = new AudioContextConstructor()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const now = context.currentTime
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(660, now)
  oscillator.frequency.setValueAtTime(880, now + 0.14)
  gain.gain.setValueAtTime(0.001, now)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume * 0.18), now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.46)
  oscillator.addEventListener('ended', () => void context.close())
}
