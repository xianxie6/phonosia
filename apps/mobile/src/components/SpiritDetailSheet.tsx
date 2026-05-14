import React, { useCallback, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import AudioRecorderPlayer from 'react-native-audio-recorder-player'
import type { Spirit, UserSpiritDetail } from '../utils/types'
import { colors, spacing, radius } from '../theme'

interface Props {
  spirit: Spirit | null
  userSpirit: UserSpiritDetail | null   // null = not captured
  bottomSheetRef: React.RefObject<BottomSheet>
  onGoToBattle: () => void
}

export function SpiritDetailSheet({
  spirit,
  userSpirit,
  bottomSheetRef,
  onGoToBattle,
}: Props) {
  const [editingNickname, setEditingNickname] = useState(false)
  const [nickname, setNickname] = useState(userSpirit?.nickname ?? '')
  const snapPoints = ['45%']

  const handlePlay = useCallback(async () => {
    if (!spirit) return
    const url = `https://dict.youdao.com/dictvoice?audio=${spirit.word}&type=2`
    try {
      await AudioRecorderPlayer.startPlayer(url)
    } catch { /* ignore */ }
  }, [spirit])

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close()
  }, [bottomSheetRef])

  if (!spirit) return null

  const isCaptured = !!userSpirit
  const isShiny = userSpirit?.captureVersion === 'shiny'
  const capturedDate = userSpirit
    ? new Date(userSpirit.capturedAt).toLocaleDateString('zh-CN')
    : null

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {/* Spirit avatar */}
        <View style={[
          styles.avatar,
          { backgroundColor: isCaptured ? colors.spiritPurple : '#CCC' },
          isShiny && styles.shinyAvatar,
        ]}>
          <Text style={styles.avatarEmoji}>{isCaptured ? '✨' : '❓'}</Text>
        </View>

        {/* Play button + word */}
        <View style={styles.wordRow}>
          <TouchableOpacity style={styles.playBtn} onPress={handlePlay} activeOpacity={0.75}>
            <Text style={styles.playIcon}>▶</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.word}>{spirit.word}</Text>
            <Text style={styles.phonetic}>{spirit.phonetic}</Text>
          </View>
          {isShiny && (
            <View style={styles.shinyTag}>
              <Text style={styles.shinyTagText}>⭐ 闪光版</Text>
            </View>
          )}
        </View>

        {isCaptured ? (
          <>
            {/* Meaning + example */}
            <View style={styles.infoCard}>
              <Text style={styles.meaning}>{spirit.meaningZh}</Text>
              <Text style={styles.example}>{spirit.exampleSentence}</Text>
            </View>

            {/* Captured date */}
            <View style={styles.row}>
              <Text style={styles.metaLabel}>收服日期</Text>
              <Text style={styles.metaValue}>{capturedDate}</Text>
            </View>

            {/* Nickname */}
            <View style={styles.row}>
              <Text style={styles.metaLabel}>昵称</Text>
              {editingNickname ? (
                <TextInput
                  style={styles.nicknameInput}
                  value={nickname}
                  onChangeText={setNickname}
                  onBlur={() => setEditingNickname(false)}
                  autoFocus
                  maxLength={12}
                  returnKeyType="done"
                  onSubmitEditing={() => setEditingNickname(false)}
                />
              ) : (
                <TouchableOpacity onPress={() => setEditingNickname(true)}>
                  <Text style={styles.metaValue}>
                    {nickname || '点击起昵称'} ✏️
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Best score */}
            <View style={styles.row}>
              <Text style={styles.metaLabel}>最高得分</Text>
              <Text style={[styles.metaValue, { color: colors.spiritPurple, fontWeight: '700' }]}>
                {userSpirit!.bestScore} 分
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* Not captured */}
            <Text style={styles.notCapturedHint}>这只语灵还没被收服...</Text>
            <TouchableOpacity
              style={styles.goBattleBtn}
              onPress={() => { handleClose(); onGoToBattle() }}
              activeOpacity={0.85}
            >
              <Text style={styles.goBattleText}>去遇见它 ⚔️</Text>
            </TouchableOpacity>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: '#fff', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  handle: { backgroundColor: colors.border.medium },
  content: { padding: spacing.xl, alignItems: 'center', paddingBottom: 40 },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  shinyAvatar: {
    borderWidth: 3,
    borderColor: colors.naturalGold,
    shadowColor: colors.naturalGold,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarEmoji: { fontSize: 44 },

  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    marginBottom: spacing.md,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.spiritPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: '#fff', fontSize: 16 },
  word: { fontSize: 28, fontWeight: '700', color: colors.text.primary, letterSpacing: 1 },
  phonetic: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },

  shinyTag: {
    backgroundColor: '#FFF3CC',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  shinyTagText: { fontSize: 12, color: '#7A5C00', fontWeight: '600' },

  infoCard: {
    width: '100%',
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  meaning: { fontSize: 18, fontWeight: '600', color: colors.text.primary, marginBottom: 6 },
  example: { fontSize: 13, color: colors.text.secondary, lineHeight: 20, fontStyle: 'italic' },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  metaLabel: { fontSize: 14, color: colors.text.secondary },
  metaValue: { fontSize: 14, color: colors.text.primary },
  nicknameInput: {
    fontSize: 14,
    color: colors.spiritPurple,
    borderBottomWidth: 1,
    borderBottomColor: colors.spiritPurple,
    minWidth: 80,
    padding: 0,
  },

  notCapturedHint: {
    fontSize: 15,
    color: colors.text.hint,
    marginVertical: spacing.lg,
    textAlign: 'center',
  },
  goBattleBtn: {
    height: 50,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.spiritPurple,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  goBattleText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
