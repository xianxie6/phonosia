import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native'

import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'

import { colors, spacing, radius } from '../../theme'

interface Props {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 5

export function ParentPinModal({ visible, onClose, onSuccess }: Props) {
  const childName = useAuthStore((s) => s.childName)
  const [digits, setDigits] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS)
  const [locked, setLocked] = useState(false)
  const [lockMinutes, setLockMinutes] = useState(LOCK_MINUTES)
  const shakeAnim = useRef(new Animated.Value(0)).current

  // reset on open
  useEffect(() => {
    if (visible) {
      setDigits([])
      setError(null)
    }
  }, [visible])

  const shake = useCallback(() => {
    shakeAnim.setValue(0)
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start()
  }, [shakeAnim])

  const submitPin = useCallback(async (pin: string) => {
    try {
      const result = await authApi.verifyPin(pin)
      if (result.locked) {
        setLocked(true)
        setLockMinutes(result.remainingMinutes ?? LOCK_MINUTES)
        setDigits([])
        return
      }
      if (result.success) {
        onSuccess()
        setDigits([])
        setAttemptsLeft(MAX_ATTEMPTS)
        return
      }
      // failed
      shake()
      const remaining = result.remainingAttempts ?? attemptsLeft - 1
      setAttemptsLeft(remaining)
      setError(`还可以尝试 ${remaining} 次`)
      setDigits([])
    } catch {
      shake()
      const remaining = attemptsLeft - 1
      setAttemptsLeft(remaining)
      setError(`还可以尝试 ${remaining} 次`)
      setDigits([])
    }
  }, [attemptsLeft, onSuccess, shake])

  const pressDigit = useCallback(async (d: string) => {
    if (locked) return
    if (digits.length >= 4) return
    const next = [...digits, d]
    setDigits(next)
    setError(null)
    if (next.length === 4) {
      await submitPin(next.join(''))
    }
  }, [digits, locked, submitPin])

  const pressDelete = useCallback(() => {
    setDigits((prev) => prev.slice(0, -1))
    setError(null)
  }, [])

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
          {/* Title */}
          <Text style={styles.title}>{childName ?? '孩子'}的学习报告</Text>
          <Text style={styles.subtitle}>请输入家长 PIN 码</Text>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[styles.dot, digits.length > i && styles.dotFilled]}
              />
            ))}
          </View>

          {/* Error / locked */}
          {locked ? (
            <Text style={styles.errorText}>已锁定，{lockMinutes} 分钟后再试</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.errorPlaceholder} />
          )}

          {/* Numpad */}
          <View style={styles.numpad}>
            {KEYS.map((key, idx) => {
              if (key === '') return <View key={idx} style={styles.keyEmpty} />
              const isDelete = key === '⌫'
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.key, locked && styles.keyDisabled]}
                  onPress={() => (isDelete ? pressDelete() : pressDigit(key))}
                  activeOpacity={0.7}
                  disabled={locked}
                >
                  <Text style={[styles.keyText, isDelete && styles.deleteText]}>{key}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.text.secondary, marginBottom: spacing.lg },

  dotsRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border.medium,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: colors.spiritPurple, borderColor: colors.spiritPurple },

  errorPlaceholder: { height: 20, marginBottom: spacing.md },
  errorText: { fontSize: 13, color: colors.confused, marginBottom: spacing.md },

  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 264,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  key: {
    width: 80,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: { width: 80, height: 56 },
  keyDisabled: { opacity: 0.4 },
  keyText: { fontSize: 22, fontWeight: '600', color: colors.text.primary },
  deleteText: { fontSize: 18 },

  cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
  cancelText: { fontSize: 15, color: colors.text.secondary },
})
