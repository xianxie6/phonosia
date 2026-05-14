import { useState, useRef, useCallback } from 'react'
import AudioRecorderPlayer, { type RecordBackType } from 'react-native-audio-recorder-player'
import { voiceApi } from '../api/voice.api'
import { useGameStore } from '../store/gameStore'

const CHILD_UX_TIMEOUT_MS = 3000
const AZURE_NETWORK_TIMEOUT_MS = 8000

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState(0)
  const uxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const networkHintFired = useRef(false)

  const { setPhase, setResult, setNetworkHint, incrementFailures, resetFailures } = useGameStore()

  const startRecording = useCallback(async () => {
    try {
      await AudioRecorderPlayer.startRecorder(undefined, undefined, true)
      AudioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
        const db = (e as any).currentMetering ?? -60
        const normalized = Math.max(0, Math.min(1, (db + 60) / 60))
        setVolume(normalized)
      })
      setIsRecording(true)
    } catch (err) {
      console.warn('startRecording error:', err)
    }
  }, [])

  const stopAndAssess = useCallback(
    async (referenceText: string, spiritId: number) => {
      setIsRecording(false)
      AudioRecorderPlayer.removeRecordBackListener()

      let audioPath: string
      try {
        audioPath = await AudioRecorderPlayer.stopRecorder()
      } catch (err) {
        console.warn('stopRecorder error:', err)
        setPhase('waiting')
        return
      }

      setPhase('assessing')
      networkHintFired.current = false

      // Layer 1: 3s UX timeout — show network hint, return to waiting, don't count failure
      uxTimerRef.current = setTimeout(() => {
        networkHintFired.current = true
        setNetworkHint(true)
        setPhase('waiting')
      }, CHILD_UX_TIMEOUT_MS)

      try {
        const result = await Promise.race([
          voiceApi.assessVoice({ audioPath, referenceText, spiritId }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), AZURE_NETWORK_TIMEOUT_MS),
          ),
        ])

        // If UX timer already fired, discard result silently
        if (networkHintFired.current) return

        clearTimeout(uxTimerRef.current!)
        setNetworkHint(false)
        setResult(result as any)
        setPhase('result')

        if ((result as any).counted === true && !(result as any).captured) {
          incrementFailures()
        }
        if ((result as any).captured) {
          resetFailures()
        }
      } catch {
        if (!networkHintFired.current) {
          clearTimeout(uxTimerRef.current!)
          setNetworkHint(true)
          setPhase('waiting')
        }
      } finally {
        setVolume(0)
      }
    },
    [setPhase, setResult, setNetworkHint, incrementFailures, resetFailures],
  )

  return { isRecording, volume, startRecording, stopAndAssess }
}
