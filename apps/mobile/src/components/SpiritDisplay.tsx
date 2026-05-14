import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { AnimView } from '../utils/animated.tsx'
import type { Spirit } from '../utils/types'
import type { BattlePhase } from '../store/gameStore'
import { colors, spacing } from '../theme'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

interface Props {
  spirit: Spirit
  phase: BattlePhase
  failureCount: number
  captureVersion?: 'standard' | 'shiny' | null
  onCaptureAnimDone?: () => void
  showGuide?: boolean
}

export function SpiritDisplay({
  spirit,
  phase,
  failureCount,
  captureVersion,
  onCaptureAnimDone,
  showGuide,
}: Props) {
  const translateY = useSharedValue(-200)
  const scale = useSharedValue(0.3)
  const opacity = useSharedValue(0)
  const wordOpacity = useSharedValue(0)
  const rotate = useSharedValue(0)
  const flashOpacity = useSharedValue(0)
  const goldOverlay = useSharedValue(0)
  const prevPhase = useRef<BattlePhase | null>(null)
  const prevFailures = useRef(0)

  // ── Entering animation ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'entering') {
      translateY.value = -200
      scale.value = 0.3
      opacity.value = 0
      wordOpacity.value = 0

      translateY.value = withSpring(0, { mass: 0.8, stiffness: 120, damping: 14 })
      scale.value = withSpring(1, { mass: 0.8, stiffness: 120, damping: 14 })
      opacity.value = withTiming(1, { duration: 400 })
      wordOpacity.value = withDelay(200, withTiming(1, { duration: 300 }))

      rotate.value = 0
      goldOverlay.value = 0
      flashOpacity.value = 0
    }
  }, [phase])

  // ── Failure animations (PRONUNCIATION_LOW only) ─────────────────────────────
  useEffect(() => {
    if (failureCount === prevFailures.current) return
    prevFailures.current = failureCount

    if (failureCount === 1) {
      rotate.value = withSequence(
        withTiming(15, { duration: 200 }),
        withDelay(600, withTiming(0, { duration: 200 })),
      )
    } else if (failureCount === 2) {
      scale.value = withTiming(1.15, { duration: 300 })
    }
    // failureCount >= 3 handled by parent (showGuide)
  }, [failureCount])

  // ── Capture / celebrating animation ────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'celebrating') return

    const done = () => { onCaptureAnimDone?.() }

    if (captureVersion === 'shiny') {
      // Flash white → gold → fly out
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 350 }),
      )
      goldOverlay.value = withTiming(1, { duration: 300 })
      scale.value = withDelay(
        600,
        withTiming(0.3, { duration: 500 }, (finished) => {
          if (finished) runOnJS(done)()
        }),
      )
      translateY.value = withDelay(600, withTiming(-SCREEN_H * 0.4, { duration: 500 }))
    } else {
      // Standard: glow then fly out
      scale.value = withSequence(
        withTiming(1.1, { duration: 200 }),
        withDelay(
          600,
          withTiming(0.3, { duration: 500 }, (finished) => {
            if (finished) runOnJS(done)()
          }),
        ),
      )
      translateY.value = withDelay(800, withTiming(-SCREEN_H * 0.4, { duration: 500 }))
    }
  }, [phase])

  const spiritStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }))

  const wordStyle = useAnimatedStyle(() => ({ opacity: wordOpacity.value }))

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    position: 'absolute',
    top: -SCREEN_H,
    left: -SCREEN_W,
    width: SCREEN_W * 3,
    height: SCREEN_H * 3,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    pointerEvents: 'none',
  }))

  const isLongWord = spirit.word.length > 8
  const wordFontSize = isLongWord ? 24 : 32

  // Bubble text based on failure
  const bubble = failureCount === 1 ? 'Hmm？' : failureCount === 2 ? '👂' : null

  const isShiny = captureVersion === 'shiny' || goldOverlay.value > 0
  const spiritColor = isShiny ? colors.naturalGold : colors.spiritPurple

  return (
    <View style={styles.container}>
      {/* White flash overlay for shiny */}
      <AnimView style={flashStyle} pointerEvents="none" />

      <AnimView style={spiritStyle}>
        {/* Spirit avatar placeholder */}
        <View style={[styles.spiritAvatar, { backgroundColor: spiritColor }]}>
          <Text style={styles.spiritEmoji}>✨</Text>
        </View>

        {/* Failure bubble */}
        {bubble && failureCount < 3 && (
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{bubble}</Text>
          </View>
        )}
      </AnimView>

      {/* Word label */}
      <AnimView style={[styles.wordContainer, wordStyle]}>
        <Text
          style={[
            styles.wordText,
            { fontSize: wordFontSize },
            isShiny && { color: colors.naturalGold },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {spirit.word}
        </Text>
      </AnimView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spiritAvatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.spiritPurple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  spiritEmoji: { fontSize: 72 },
  bubble: {
    position: 'absolute',
    top: -12,
    right: -16,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  bubbleText: { fontSize: 18, fontWeight: '700', color: colors.confused },
  wordContainer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    paddingVertical: spacing.xs,
  },
  wordText: {
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
})
