import React, { useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native'
import AudioRecorderPlayer from 'react-native-audio-recorder-player'
import type { Spirit } from '../utils/types'
import { useGameStore } from '../store/gameStore'
import { colors, spacing, radius } from '../theme'

interface Props {
  visible: boolean
  spirit: Spirit
  onRetry: () => void
  onDismiss: () => void
}

export function PronunciationGuide({ visible, spirit, onRetry, onDismiss }: Props) {
  const advance = useGameStore((s) => s.advance)

  const handlePlay = useCallback(async () => {
    // Placeholder URL pattern – Phase 8 will wire real CDN URLs
    const url = `https://dict.youdao.com/dictvoice?audio=${spirit.word}&type=2`
    try {
      await AudioRecorderPlayer.startPlayer(url)
    } catch {
      // Ignore playback errors in dev/mock
    }
  }, [spirit.word])

  const handleRetry = useCallback(() => {
    onDismiss()
    onRetry()
  }, [onDismiss, onRetry])

  const handleSkip = useCallback(() => {
    onDismiss()
    advance()
  }, [onDismiss, advance])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          {/* Spirit avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>✨</Text>
          </View>

          <Text style={styles.label}>听我说一次：</Text>

          {/* Word + phonetic + play */}
          <View style={styles.wordRow}>
            <TouchableOpacity style={styles.playBtn} onPress={handlePlay} activeOpacity={0.75}>
              <Text style={styles.playIcon}>▶</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.word}>{spirit.word}</Text>
              <Text style={styles.phonetic}>{spirit.phonetic}</Text>
            </View>
          </View>

          {/* Mouth shape placeholder */}
          <View style={styles.mouthPlaceholder}>
            <Text style={styles.mouthEmoji}>👄</Text>
            <Text style={styles.mouthHint}>嘴型示范</Text>
          </View>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
              <Text style={styles.retryText}>再试一次</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.85}>
              <Text style={styles.skipText}>跳过这个词</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.spiritPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarEmoji: { fontSize: 36 },
  label: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.spiritPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: '#fff', fontSize: 18 },
  word: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  phonetic: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  mouthPlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  mouthEmoji: { fontSize: 32 },
  mouthHint: { fontSize: 14, color: colors.text.secondary },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  retryBtn: {
    flex: 1,
    height: 50,
    backgroundColor: colors.spiritPurple,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: {
    flex: 1,
    height: 50,
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { color: colors.text.secondary, fontSize: 16 },
})
