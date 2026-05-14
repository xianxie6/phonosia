import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native'
import { FlashList } from '@shopify/flash-list'
import BottomSheet from '@gorhom/bottom-sheet'
import AudioRecorderPlayer from 'react-native-audio-recorder-player'
import { useNavigation } from '@react-navigation/native'

import { progressApi } from '../../api/progress.api'
import type { Spirit, UserSpiritDetail } from '../../utils/types'
import { SpiritGridCell, type CellStatus } from '../../components/SpiritGridCell'
import { FogCard } from '../../components/FogCard'
import { SpiritDetailSheet } from '../../components/SpiritDetailSheet'
import { colors, spacing, radius } from '../../theme'

const { width: SCREEN_W } = Dimensions.get('window')
const COLS = 5
const CELL_SIZE = Math.floor((SCREEN_W - spacing.md * 2) / COLS)

// Islands available in seed data
const ALL_ISLANDS = [1, 2]

interface GrimoireData {
  userSpirits: UserSpiritDetail[]
  unlockedIslands: number[]
  allSpirits: Spirit[]
}

type ListItem =
  | { type: 'spirit'; spirit: Spirit; userSpirit: UserSpiritDetail | null }
  | { type: 'fog' }

export function GrimoireScreen() {
  const navigation = useNavigation()
  const bottomSheetRef = useRef<BottomSheet>(null)

  const [data, setData] = useState<GrimoireData>({
    userSpirits: [],
    unlockedIslands: [1],
    allSpirits: [],
  })
  const [dailyProgress, setDailyProgress] = useState<{
    newDone: number; newTotal: number; reviewDone: number; reviewTotal: number
  } | null>(null)
  const [selectedIsland, setSelectedIsland] = useState(1)
  const [selectedSpirit, setSelectedSpirit] = useState<Spirit | null>(null)
  const [selectedUserSpirit, setSelectedUserSpirit] = useState<UserSpiritDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    Promise.all([
      progressApi.getGrimoire(),
      progressApi.getDailyTask(),
      progressApi.getStats(),
    ]).then(([grimoire, daily, stats]) => {
      if (!mounted) return

      // Build allSpirits from userSpirits (captured) + daily new queue
      const capturedSpirits = grimoire.userSpirits.map((us) => us.spirit)
      const newSpirits = daily.new

      // Merge, deduplicate
      const spiritMap = new Map<number, Spirit>()
      for (const s of capturedSpirits) spiritMap.set(s.id, s)
      for (const s of newSpirits) spiritMap.set(s.id, s)
      const allSpirits = Array.from(spiritMap.values()).sort((a, b) => a.id - b.id)

      // Unlock logic: island 1 always, next island unlocks at 80 captured on current
      const islandCaptures: Record<number, number> = {}
      for (const us of grimoire.userSpirits) {
        const iid = us.spirit.islandId
        islandCaptures[iid] = (islandCaptures[iid] ?? 0) + 1
      }
      const unlockedIslands = ALL_ISLANDS.filter((id) => {
        if (id === 1) return true
        return (islandCaptures[id - 1] ?? 0) >= 80 || grimoire.unlockedIslands.includes(id)
      })

      setData({ userSpirits: grimoire.userSpirits, unlockedIslands, allSpirits })

      // Daily progress: count session completions from daily task queue
      setDailyProgress({
        newDone: Math.min(daily.new.length === 0 ? 5 : 5 - daily.new.length, 5),
        newTotal: 5,
        reviewDone: Math.min(daily.review.length === 0 ? 10 : 10 - daily.review.length, 10),
        reviewTotal: 10,
      })
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  // ── Build list items for selected island ───────────────────────────────────
  const listItems: ListItem[] = (() => {
    const islandSpirits = data.allSpirits.filter((s) => s.islandId === selectedIsland)
    const userSpiritMap = new Map(data.userSpirits.map((us) => [us.spiritId, us]))
    const items: ListItem[] = islandSpirits.map((spirit) => ({
      type: 'spirit',
      spirit,
      userSpirit: userSpiritMap.get(spirit.id) ?? null,
    }))
    // Show fog card if next island exists and is not yet unlocked
    const nextIsland = selectedIsland + 1
    if (ALL_ISLANDS.includes(nextIsland) && !data.unlockedIslands.includes(nextIsland)) {
      items.push({ type: 'fog' })
    }
    return items
  })()

  // ── Cell press ─────────────────────────────────────────────────────────────
  const handleCellPress = useCallback(
    async (spirit: Spirit, userSpirit: UserSpiritDetail | null) => {
      if (!userSpirit) {
        // Locked: play pronunciation only
        const url = `https://dict.youdao.com/dictvoice?audio=${spirit.word}&type=2`
        try { await AudioRecorderPlayer.startPlayer(url) } catch { /* ignore */ }
      }
      setSelectedSpirit(spirit)
      setSelectedUserSpirit(userSpirit)
      bottomSheetRef.current?.snapToIndex(0)
    },
    [],
  )

  // ── Render cell ────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'fog') {
        return <FogCard />
      }
      const { spirit, userSpirit } = item
      const status: CellStatus = !userSpirit
        ? 'locked'
        : userSpirit.captureVersion === 'shiny'
          ? 'shiny'
          : 'standard'

      return (
        <SpiritGridCell
          word={spirit.word}
          islandId={spirit.islandId}
          status={status}
          size={CELL_SIZE}
          onPress={() => handleCellPress(spirit, userSpirit)}
        />
      )
    },
    [handleCellPress],
  )

  const keyExtractor = useCallback(
    (item: ListItem, index: number) =>
      item.type === 'fog' ? 'fog' : `${item.spirit.id}`,
    [],
  )

  // ── Total captured ─────────────────────────────────────────────────────────
  const totalCaptured = data.userSpirits.length
  const isAllDone =
    dailyProgress &&
    dailyProgress.newDone >= dailyProgress.newTotal &&
    dailyProgress.reviewDone >= dailyProgress.reviewTotal

  return (
    <SafeAreaView style={styles.container}>
      {/* Today progress banner */}
      <View style={styles.banner}>
        {isAllDone ? (
          <Text style={styles.bannerText}>✅ 今日已完成</Text>
        ) : dailyProgress ? (
          <Text style={styles.bannerText}>
            今日新词 {dailyProgress.newDone}/{dailyProgress.newTotal} · 复习 {dailyProgress.reviewDone}/{dailyProgress.reviewTotal}
          </Text>
        ) : null}
      </View>

      {/* Captured count */}
      <Text style={styles.capturedCount}>
        已收服 {totalCaptured} 只 · 声语大陆还有更多秘密等你发现
      </Text>

      {/* Island tabs */}
      <View style={styles.tabBar}>
        {data.unlockedIslands.map((id) => (
          <TouchableOpacity
            key={id}
            style={[styles.tab, selectedIsland === id && styles.tabActive]}
            onPress={() => setSelectedIsland(id)}
          >
            <View style={[styles.tabDot, { backgroundColor: colors.island[id] ?? colors.spiritPurple }]} />
            <Text style={[styles.tabText, selectedIsland === id && styles.tabTextActive]}>
              岛 {String(id).padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid */}
      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : (
        <FlashList
          data={listItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={COLS}

          contentContainerStyle={{ padding: spacing.md }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Detail bottom sheet */}
      <SpiritDetailSheet
        spirit={selectedSpirit}
        userSpirit={selectedUserSpirit}
        bottomSheetRef={bottomSheetRef}
        onGoToBattle={() => (navigation as any).navigate('Battle')}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.landBeige },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.text.secondary, fontSize: 15 },

  banner: {
    backgroundColor: colors.surface.secondary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  bannerText: { fontSize: 13, color: colors.text.secondary },

  capturedCount: {
    fontSize: 13,
    color: colors.text.hint,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tabActive: {
    backgroundColor: colors.spiritPurple,
    borderColor: colors.spiritPurple,
  },
  tabDot: { width: 8, height: 8, borderRadius: 4 },
  tabText: { fontSize: 13, color: colors.text.secondary, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
})
