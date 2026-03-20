import { useRef, useState, useCallback, useEffect } from 'react'
import { getBgmState, saveBgmState } from '../lib/storage'
import { trpc } from '../lib/trpc'

export type Track = {
  id: string
  title: string
  src: string
  artist?: string
  color?: string // アルバムアート用の色
}

// フォールバックトラック（ローディング中またはエラー時に使用）
const FALLBACK_ENABLED = import.meta.env.VITE_BGM_FALLBACK !== 'false'
const FALLBACK_TRACKS: Track[] = [
  { id: '1', title: 'Lo-Fi Study 01', src: '/api/bgm/lofi-01.mp3', artist: 'Chill Beats', color: '#3b82f6' },
  { id: '2', title: 'Lo-Fi Study 02', src: '/api/bgm/lofi-02.mp3', artist: 'Relax Sounds', color: '#8b5cf6' },
]

export type BgmState = {
  tracks: Track[]
  currentTrack: Track
  currentIndex: number
  isPlaying: boolean
  volume: number
  hasError: boolean      // Audio要素の再生エラー用（既存）
  loading: boolean       // APIローディング状態
  error: unknown         // APIエラー情報（状態監視用、トースト表示はしない）
  toggle: () => void
  selectTrack: (index: number) => void
  setVolume: (vol: number) => void
}

export function useBgm(): BgmState {
  // tRPCクエリでトラック取得
  const bgmQuery = trpc.bgm.getAll.useQuery(undefined, {
    enabled: true,
    staleTime: 60 * 60 * 1000, // 1時間
    refetchOnWindowFocus: false,
  })

  const { data: apiTracks, isLoading, error } = bgmQuery

  // DBスキーマからTrack型にマッピング（tier, createdAt, updatedAtは破棄）
  const dbTracks: Track[] = (apiTracks ?? []).map((track: any) =>
    ({
      id: track.id,
      title: track.title,
      src: track.src,
      artist: track.artist ?? undefined,
      color: track.color ?? undefined
    })
  )

  // フォールバックロジック: ローディング中、エラー時、またはDBトラックが空の場合にフォールバック使用
  const shouldUseFallback = ((isLoading || error || dbTracks.length === 0) && FALLBACK_ENABLED)
  const tracks = shouldUseFallback ? FALLBACK_TRACKS : dbTracks

  // エラー状態を抽出（フォールバック機能がエラーハンドリングとして機能）
  const apiError = error

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = getBgmState()
    return saved?.currentIndex ?? 0
  })
  const [volume, setVolumeState] = useState(() => {
    const saved = getBgmState()
    return saved?.volume ?? 0.5
  })
  const [hasError, setHasError] = useState(false)

  // Initialize audio element on mount
  useEffect(() => {
    const audio = new Audio()
    audio.volume = volume
    audio.loop = true
    audio.preload = 'metadata'
    audioRef.current = audio

    const handleError = () => {
      setHasError(true)
      setIsPlaying(false)
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('error', handleError)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.pause()
      audioRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update audio volume when volume state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Handle track change: reload src and resume if was playing
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || tracks.length === 0) return

    const wasPlaying = isPlaying
    setHasError(false)
    // currentIndexが範囲外の場合は最初のトラックを使用
    const safeIndex = Math.min(currentIndex, tracks.length - 1)
    audio.src = tracks[safeIndex].src
    audio.load()

    if (wasPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    }
  }, [currentIndex, tracks.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save BGM state to localStorage when it changes
  useEffect(() => {
    saveBgmState({
      isPlaying: false, // Always save as false for safety
      currentIndex,
      volume,
    })
  }, [currentIndex, volume])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio || tracks.length === 0) return

    if (audio.paused) {
      // Ensure src is set
      const safeIndex = Math.min(currentIndex, tracks.length - 1)
      if (!audio.src || !audio.src.includes(tracks[safeIndex].src.replace('/audio/', ''))) {
        audio.src = tracks[safeIndex].src
        audio.load()
      }
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [currentIndex, tracks.length])

  const selectTrack = useCallback((index: number) => {
    if (index === currentIndex) {
      // Same track: toggle play/pause
      toggle()
      return
    }
    setCurrentIndex(index)
  }, [currentIndex, toggle])

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol))
    setVolumeState(clamped)
    if (audioRef.current) {
      audioRef.current.volume = clamped
    }
  }, [])

  // currentTrackがundefinedにならないように安全に取得
  const currentTrack = tracks[currentIndex] ?? tracks[0] ?? FALLBACK_TRACKS[0]

  return {
    tracks,
    currentTrack,
    currentIndex,
    isPlaying,
    volume,
    hasError,
    loading: isLoading,
    error: apiError ?? null,
    toggle,
    selectTrack,
    setVolume,
  }
}
