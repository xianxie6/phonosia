import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated'
import {
  Canvas,
  Circle,
  BlurMask,
} from '@shopify/react-native-skia'
import { AnimView } from '../utils/animated.tsx'
import { colors, spacing } from '../theme'

export type CrystalState =
  | 'idle'
  | 'listening'
  | 'assessing'
  | 'success'
  | 'confused'
  | 'network_retry'

interface Props {
  state: CrystalState
  volume: number
  consecutiveFailures?: number
  networkHintText?: string
  onPress: () => void
}

// ─── Idle pulse ───────────────────────────────────────────────────────────────
function IdleState({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1)

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    )
    return () => cancelAnimation(scale)
  }, [scale])

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <AnimView style={[styles.crystalBase, animStyle, { backgroundColor: colors.spiritPurple }]} />
      <Text style={styles.hint}>大声说出它的名字！</Text>
    </TouchableOpacity>
  )
}

// ─── Listening (Skia) ─────────────────────────────────────────────────────────
function ListeningState({ volume }: { volume: number }) {
  const SIZE = 200
  const cx = SIZE / 2
  const cy = SIZE / 2
  const crystalRadius = 36 + volume * 20
  const blurAmount = 8 + volume * 12

  const particleCount = Math.floor(volume * 12)
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / Math.max(particleCount, 1)) * Math.PI * 2
    const dist = 50 + volume * 30
    return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist }
  })

  return (
    <View style={{ alignItems: 'center' }}>
      <Canvas style={{ width: SIZE, height: SIZE }}>
        <Circle cx={cx} cy={cy} r={36 + volume * 40 + 60} color="rgba(91,75,232,0.15)" />
        <Circle cx={cx} cy={cy} r={36 + volume * 40 + 40} color="rgba(91,75,232,0.25)" />
        <Circle cx={cx} cy={cy} r={36 + volume * 40 + 20} color="rgba(91,75,232,0.40)" />
        {particles.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} color={colors.spiritPurple} />
        ))}
        <Circle cx={cx} cy={cy} r={crystalRadius} color={colors.spiritPurple}>
          <BlurMask blur={blurAmount} style="normal" />
        </Circle>
        <Circle cx={cx} cy={cy} r={crystalRadius * 0.6} color="rgba(255,255,255,0.4)" />
      </Canvas>
      <Text style={[styles.hint, { color: colors.spiritPurple, fontWeight: '700' }]}>说吧！</Text>
    </View>
  )
}

// ─── Assessing spinner ────────────────────────────────────────────────────────
function AssessingState() {
  const rotation = useSharedValue(0)

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
    )
    return () => cancelAnimation(rotation)
  }, [rotation])

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  return (
    <View style={styles.centerCol}>
      <AnimView style={[styles.spinner, spinStyle]} />
      <Text style={styles.hint}>语灵在聆听...</Text>
    </View>
  )
}

// ─── Success ──────────────────────────────────────────────────────────────────
function SuccessState() {
  const scale = useSharedValue(0.3)

  useEffect(() => {
    scale.value = withSpring(1, { mass: 0.6, stiffness: 180, damping: 12 })
  }, [scale])

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <View style={styles.centerCol}>
      <AnimView style={[styles.successRing, animStyle]}>
        <Text style={styles.successIcon}>✓</Text>
      </AnimView>
      <Text style={[styles.hint, { color: colors.naturalGold, fontWeight: '700' }]}>
        它听懂啦！
      </Text>
    </View>
  )
}

// ─── Confused ─────────────────────────────────────────────────────────────────
function ConfusedState({
  consecutiveFailures,
  onPress,
}: {
  consecutiveFailures: number
  onPress: () => void
}) {
  const shake = useSharedValue(0)

  useEffect(() => {
    shake.value = withSequence(
      withRepeat(withTiming(8, { duration: 60 }), 6, true),
      withTiming(0, { duration: 60 }),
    )
  }, [consecutiveFailures, shake])

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }))

  const configs = [
    { icon: '？', hint: '再说一次？' },
    { icon: '👂', hint: '大声一点！' },
    { icon: '🤲', hint: '看我怎么说～' },
  ]
  const { icon, hint } = configs[Math.min(consecutiveFailures - 1, 2)]

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.centerCol}>
        <AnimView style={[styles.confusedRing, shakeStyle]}>
          <Text style={styles.confusedIcon}>{icon}</Text>
        </AnimView>
        <Text style={[styles.hint, { color: colors.confused }]}>{hint}</Text>
      </View>
    </TouchableOpacity>
  )
}

// ─── Network retry ────────────────────────────────────────────────────────────
function NetworkRetryState({ hintText, onPress }: { hintText?: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.centerCol}>
        <View style={[styles.crystalBase, { backgroundColor: '#6BAED6' }]}>
          <Text style={{ fontSize: 36 }}>👂</Text>
        </View>
        <Text style={[styles.hint, { color: '#6BAED6' }]}>
          {hintText ?? '网络有点慢，再试一次？'}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function SoundCrystal({
  state,
  volume,
  consecutiveFailures = 0,
  networkHintText,
  onPress,
}: Props) {
  return (
    <View style={styles.wrapper}>
      {state === 'idle' && <IdleState onPress={onPress} />}
      {state === 'listening' && <ListeningState volume={volume} />}
      {state === 'assessing' && <AssessingState />}
      {state === 'success' && <SuccessState />}
      {state === 'confused' && (
        <ConfusedState consecutiveFailures={consecutiveFailures} onPress={onPress} />
      )}
      {state === 'network_retry' && (
        <NetworkRetryState hintText={networkHintText} onPress={onPress} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', minHeight: 220 },
  centerCol: { alignItems: 'center' },
  crystalBase: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  hint: { fontSize: 16, color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center' },
  spinner: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: 'transparent',
    borderTopColor: colors.spiritPurple, borderRightColor: colors.spiritPurple,
    marginBottom: spacing.sm,
  },
  successRing: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.naturalGold,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  successIcon: { fontSize: 48, color: '#fff', fontWeight: '700' },
  confusedRing: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.confused,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  confusedIcon: { fontSize: 44 },
})
