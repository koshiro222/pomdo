import { useRef, useState, useCallback, useEffect } from 'react'

export type Track = {
  id: string
  title: string
  src: string
}

export const TRACKS: Track[] = [
  { id: '1', title: 'Lo-Fi Study 01', src: '/audio/lofi-01.mp3' },
  { id: '2', title: 'Lo-Fi Study 02', src: '/audio/lofi-02.mp3' },
]

export type BgmState = {
  tracks: Track[]
  currentTrack: Track
  currentIndex: number
  isPlaying: boolean
  volume: number
  hasError: boolean
  toggle: () => void
  selectTrack: (index: number) => void
  next: () => void
  prev: () => void
  setVolume: (vol: number) => void
}

export function useBgm(): BgmState {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [volume, setVolumeState] = useState(0.5)
  const [hasError, setHasError] = useState(false)

  // Initialize audio element on mount
  useEffect(() => {
    const audio = new Audio()
    audio.volume = volume
    audio.preload = 'metadata'
    audioRef.current = audio

    const handleEnded = () => {
      setCurrentIndex(prev => (prev + 1) % TRACKS.length)
    }
    const handleError = () => {
      setHasError(true)
      setIsPlaying(false)
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.pause()
      audioRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle track change: reload src and resume if was playing
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const wasPlaying = isPlaying
    setHasError(false)
    audio.src = TRACKS[currentIndex].src
    audio.load()

    if (wasPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    }
  }, [currentIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      // Ensure src is set
      if (!audio.src || !audio.src.includes(TRACKS[currentIndex].src.replace('/audio/', ''))) {
        audio.src = TRACKS[currentIndex].src
        audio.load()
      }
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [currentIndex])

  const selectTrack = useCallback((index: number) => {
    if (index === currentIndex) {
      // Same track: toggle play/pause
      toggle()
      return
    }
    setCurrentIndex(index)
  }, [currentIndex, toggle])

  const next = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % TRACKS.length)
  }, [])

  const prev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + TRACKS.length) % TRACKS.length)
  }, [])

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol))
    setVolumeState(clamped)
    if (audioRef.current) {
      audioRef.current.volume = clamped
    }
  }, [])

  return {
    tracks: TRACKS,
    currentTrack: TRACKS[currentIndex],
    currentIndex,
    isPlaying,
    volume,
    hasError,
    toggle,
    selectTrack,
    next,
    prev,
    setVolume,
  }
}
