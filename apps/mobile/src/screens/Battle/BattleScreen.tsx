import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions'
import { useNavigation } from '@react-navigation/native'

import { progressApi } from '../../api/progress.api'
import { useGameStore } from '../../store/gameStore'
import { useAuthStore } from '../../store/authStore'
import { cacheDailyTask, getCachedDailyTask } from '../../store/gameStore'
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder'
import { SoundCrystal } from '../../components/SoundCrystal'
import { SpiritDisplay } from '../../components/SpiritDisplay'
import { PronunciationGuide } from '../../components/PronunciationGuide'
import { colors, spacing, radius } from '../../theme'
import type { Spirit } from '../../utils/types'

const MIC_PERMISSION = Platform.OS === 'ios'
  ? PERMISSIONS.IOS.MICROPHONE
  : PERMISSIONS.ANDROID.RECORD_AUDIO

const SILENCE_DETECT_MS = 2500

export function BattleScreen() {
  const navigation = useNavigation()

  const {
    todayQueue, currentIndex, battlePhase, lastResult,
    consecutiveFailures, networkHint, isOffline,
    setQueue, advance, setPhase, setResult, resetFailures, setNetworkHint,
  } = useGameStore()

  const userId = useAuthStore((s) => s.userId)

  const { isRecording, volume, startRecording, stopAndAssess } = useVoiceRecorder()

  const [showGuide, setShowGuide] = useState(false)
  const [showPhonetic, setShowPhonetic] = useState(false)
  const [captureVersion, setCaptureVersion] = useState<'standard' | 'shiny' | null>(null)
  const [newCaptured, setNewCaptured] = useState<Spirit[]>([])
  const [reviewCaptured, setReviewCaptured] = useState(0)
  const [companionEgg, setCompanionEgg] = useState(false)

  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phoneticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentSpirit = todayQueue[currentIndex] ?? null

  // ── Load daily task on mount (API first, MMKV cache fallback) ───────────
  useEffect(() => {
    let mounted = true

    const buildQueue = (task: { new: Spirit[]; review: Array<Spirit & { userSpirit?: object }> }) => {
      return [...task.new, ...task.review.map((r) => ({
        id: r.id, word: r.word, islandId: r.islandId, theme: r.theme,
        difficulty: r.difficulty, phonetic: r.phonetic, meaningZh: r.meaningZh,
        exampleSentence: r.exampleSentence, isBoss: r.isBoss,
      }))]
    }

    progressApi.getDailyTask().then((task) => {
      if (!mounted) return
      if (userId) cacheDailyTask(userId, task)
      setQueue(buildQueue(task))
    }).catch(() => {
      if (!mounted) return
      // Network failed — try MMKV cache
      if (userId) {
        const cached = getCachedDailyTask(userId)
        if (cached) setQueue(buildQueue(cached))
      }
    })

    return () => { mounted = false }
  }, [])

  // ── entering → waiting after 1.2s ────────────────────────────────────────
  useEffect(() => {
    if (battlePhase === 'entering') {
      setShowPhonetic(false)
      setCaptureVersion(null)
      clearTimeout(enterTimerRef.current!)
      enterTimerRef.current = setTimeout(() => setPhase('waiting'), 1200)
    }
    return () => clearTimeout(enterTimerRef.current!)
  }, [battlePhase, currentIndex])

  // ── Handle result ────────────────────────────────────────────────────────
  useEffect(() => {
    if (battlePhase !== 'result' || !lastResult || !currentSpirit) return

    if (lastResult.captured) {
      const ver = (lastResult.captureVersion as 'standard' | 'shiny') ?? 'standard'
      setCaptureVersion(ver)
      setNewCaptured((p) => [...p, currentSpirit])
      setPhase('celebrating')
      if ((lastResult as any).companionUnlocked) {
        setCompanionEgg(true)
      }
    }
    // counted:false → silent retry, no extra action needed (networkHint already set)
  }, [battlePhase, lastResult])

  // ── After capture animation done ─────────────────────────────────────────
  const handleCaptureAnimDone = useCallback(() => {
    setShowPhonetic(true)
    phoneticTimerRef.current = setTimeout(() => {
      setShowPhonetic(false)
      advance()
    }, 1500)
  }, [advance])

  // ── Show guide at 3 consecutive failures ─────────────────────────────────
  useEffect(() => {
    if (consecutiveFailures >= 3 && battlePhase === 'waiting') {
      setShowGuide(true)
    }
  }, [consecutiveFailures, battlePhase])

  // ── Silence detection while recording ────────────────────────────────────
  useEffect(() => {
    if (battlePhase === 'recording') {
      if (volume > 0.05) {
        clearTimeout(silenceTimerRef.current!)
        silenceTimerRef.current = setTimeout(triggerAssess, SILENCE_DETECT_MS)
      }
    } else {
      clearTimeout(silenceTimerRef.current!)
    }
  }, [volume, battlePhase])

  const triggerAssess = useCallback(() => {
    if (!currentSpirit) return
    stopAndAssess(currentSpirit.word, currentSpirit.id)
  }, [currentSpirit, stopAndAssess])

  // ── Mic permission + start recording ─────────────────────────────────────
  const handleCrystalPress = useCallback(async () => {
    if (battlePhase !== 'waiting') return

    const status = await check(MIC_PERMISSION)
    if (status !== RESULTS.GRANTED) {
      const result = await request(MIC_PERMISSION)
      if (result !== RESULTS.GRANTED) return
    }

    setNetworkHint(false)
    setPhase('recording')
    await startRecording()

    // Auto-stop after 8s max
    silenceTimerRef.current = setTimeout(triggerAssess, 8000)
  }, [battlePhase, startRecording, triggerAssess, setPhase, setNetworkHint])

  // ── crystal state derivation ──────────────────────────────────────────────
  const crystalState = (() => {
    if (battlePhase === 'recording') return 'listening'
    if (battlePhase === 'assessing') return 'assessing'
    if (battlePhase === 'celebrating') return 'success'
    if (lastResult && !lastResult.captured && lastResult.counted && battlePhase === 'waiting')
      return 'confused'
    if (networkHint || (lastResult && !lastResult.counted && battlePhase === 'waiting'))
      return 'network_retry'
    return 'idle'
  })() as any

  // ── Completed: celebration page ───────────────────────────────────────────
  if (battlePhase === 'completed') {
    return (
      <CompletionPage
        captured={newCaptured}
        reviewCount={reviewCaptured}
        onViewGrimoire={() => (navigation as any).navigate('Grimoire')}
      />
    )
  }

  // ── Empty queue ───────────────────────────────────────────────────────────
  if (!currentSpirit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>正在加载今日任务...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const newTotal = todayQueue.filter((_, i) => i < (todayQueue.length)).length
  const doneCount = currentIndex

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>当前离线，发音暂不计分，联网后自动同步</Text>
        </View>
      )}

      {/* Network hint banner */}
      {!isOffline && networkHint && (
        <View style={styles.networkBanner}>
          <Text style={styles.networkBannerText}>网络有点慢，语灵还在聆听～</Text>
        </View>
      )}

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <Text style={styles.progressText}>
          今日进度 {doneCount}/{todayQueue.length}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${todayQueue.length ? (doneCount / todayQueue.length) * 100 : 0}%` },
            ]}
          />
        </View>
      </View>

      {/* Spirit display */}
      <View style={styles.spiritArea}>
        <SpiritDisplay
          spirit={currentSpirit}
          phase={battlePhase}
          failureCount={consecutiveFailures}
          captureVersion={captureVersion}
          onCaptureAnimDone={handleCaptureAnimDone}
        />
      </View>

      {/* Phonetic + meaning (shown after capture) */}
      <View style={styles.phoneticArea}>
        {showPhonetic && (
          <View style={styles.phoneticCard}>
            <Text style={styles.phonetic}>{currentSpirit.phonetic}</Text>
            <Text style={styles.meaning}>{currentSpirit.meaningZh}</Text>
          </View>
        )}
      </View>

      {/* Sound crystal */}
      <View style={styles.crystalArea}>
        <SoundCrystal
          state={crystalState}
          volume={volume}
          consecutiveFailures={consecutiveFailures}
          networkHintText={networkHint ? '网络稍慢，语灵还没收到你的声音' : undefined}
          onPress={handleCrystalPress}
        />
      </View>

      {/* Pronunciation guide modal */}
      {currentSpirit && (
        <PronunciationGuide
          visible={showGuide}
          spirit={currentSpirit}
          onRetry={() => {
            resetFailures()
            setShowGuide(false)
            setPhase('waiting')
          }}
          onDismiss={() => setShowGuide(false)}
        />
      )}

      {/* Companion unlock easter egg overlay */}
      {companionEgg && (
        <View style={styles.companionEggOverlay}>
          <Text style={styles.companionEggEmoji}>✨🌟✨</Text>
          <Text style={styles.companionEggTitle}>守护语灵解锁了！</Text>
          <Text style={styles.companionEggSub}>你的语灵伙伴在地图等着你～</Text>
          <TouchableOpacity
            style={styles.companionEggBtn}
            onPress={() => setCompanionEgg(false)}
          >
            <Text style={styles.companionEggBtnText}>好的！</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

// ── Completion page ────────────────────────────────────────────────────────────
function CompletionPage({
  captured,
  reviewCount,
  onViewGrimoire,
}: {
  captured: Spirit[]
  reviewCount: number
  onViewGrimoire: () => void
}) {
  return (
    <SafeAreaView style={styles.completionContainer}>
      <Text style={styles.completionEmoji}>🎉</Text>
      <Text style={styles.completionTitle}>今日冒险完成！</Text>

      {/* Captured spirits */}
      <View style={styles.capturedRow}>
        {captured.map((s) => (
          <View key={s.id} style={styles.capturedAvatar}>
            <Text style={{ fontSize: 28 }}>✨</Text>
            <Text style={styles.capturedWord} numberOfLines={1}>{s.word}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.statsText}>
        新词 {captured.length} 只 · 复习 {reviewCount} 只
      </Text>

      <TouchableOpacity style={styles.grimoireBtn} onPress={onViewGrimoire} activeOpacity={0.85}>
        <Text style={styles.grimBtnText}>去图鉴看看 📖</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.landBeige,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: colors.text.secondary },

  offlineBanner: {
    height: 32,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBannerText: { fontSize: 12, color: '#8A7020' },

  networkBanner: {
    backgroundColor: '#FFF9E6',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  networkBannerText: { fontSize: 13, color: '#7A6020' },

  progressBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  progressText: { fontSize: 12, color: colors.text.secondary, marginBottom: 4 },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border.light,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.spiritPurple,
    borderRadius: radius.full,
  },

  spiritArea: { flex: 55, justifyContent: 'center' },
  phoneticArea: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  phoneticCard: { alignItems: 'center' },
  phonetic: { fontSize: 16, color: colors.text.secondary },
  meaning: { fontSize: 18, fontWeight: '600', color: colors.text.primary },

  crystalArea: {
    flex: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },

  // Completion page
  completionContainer: {
    flex: 1,
    backgroundColor: colors.landBeige,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  completionEmoji: { fontSize: 72 },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.spiritPurple,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  capturedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  capturedAvatar: {
    width: 72,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  capturedWord: { fontSize: 11, color: colors.text.secondary, marginTop: 2 },
  statsText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  grimoireBtn: {
    height: 52,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.spiritPurple,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grimBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  companionEggOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(26,26,46,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  companionEggEmoji: { fontSize: 48, marginBottom: spacing.lg },
  companionEggTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: spacing.sm },
  companionEggSub: { fontSize: 16, color: colors.text.hint, textAlign: 'center', marginBottom: spacing.xl },
  companionEggBtn: {
    height: 52,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.spiritPurple,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companionEggBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
})
