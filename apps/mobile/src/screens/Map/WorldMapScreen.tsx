import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'

import { progressApi } from '../../api/progress.api'
import { companionApi } from '../../api/companion.api'
import { colors, spacing, radius } from '../../theme'
import { ParentPinModal } from './ParentPinModal'

const ISLAND_NAMES: Record<number, string> = {
  1:  '绿野岛',
  2:  '美食岛',
  3:  '动物岛',
  4:  '海洋岛',
  5:  '魔法岛',
  6:  '星光岛',
  7:  '冰雪岛',
  8:  '火焰岛',
  9:  '彩虹岛',
  10: '传说岛',
}

// 3-4-3 row layout
const ISLAND_ROWS = [
  [1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10],
]

interface IslandProgress {
  islandId: number
  total: number
  captured: number
}

export function WorldMapScreen() {
  const navigation = useNavigation()
  const [islandProgress, setIslandProgress] = useState<IslandProgress[]>([])
  const [unlockedIslands, setUnlockedIslands] = useState<number[]>([1])
  const [dailyStats, setDailyStats] = useState<{
    remaining: number
    totalCapturedToday: number
    allDone: boolean
  }>({ remaining: 0, totalCapturedToday: 0, allDone: false })
  const [pinVisible, setPinVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [companionUnlocked, setCompanionUnlocked] = useState(false)
  const companionBounce = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let mounted = true
    Promise.all([progressApi.getStats(), progressApi.getDailyTask()]).then(
      ([stats, daily]) => {
        if (!mounted) return

        // Build unlocked islands from progress (same logic as grimoire)
        const capturedMap: Record<number, number> = {}
        for (const ip of stats.islandProgress) {
          capturedMap[ip.islandId] = ip.captured
        }
        const unlocked: number[] = []
        for (let id = 1; id <= 10; id++) {
          if (id === 1) { unlocked.push(id); continue }
          const prevCaptured = capturedMap[id - 1] ?? 0
          if (prevCaptured >= 80) unlocked.push(id)
          else break
        }
        setUnlockedIslands(unlocked)
        setIslandProgress(stats.islandProgress)

        const remaining = daily.new.length + daily.review.length
        const totalToday = (5 - daily.new.length) + (10 - daily.review.length)
        setDailyStats({
          remaining,
          totalCapturedToday: Math.max(0, totalToday),
          allDone: remaining === 0,
        })
        setLoading(false)
      },
    ).catch(() => setLoading(false))

    companionApi.getStatus().then((s) => {
      if (mounted && s.unlocked) {
        setCompanionUnlocked(true)
        Animated.loop(
          Animated.sequence([
            Animated.timing(companionBounce, { toValue: -10, duration: 500, useNativeDriver: true }),
            Animated.timing(companionBounce, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]),
        ).start()
      }
    }).catch(() => {})

    return () => { mounted = false }
  }, [companionBounce])

  const getProgress = (islandId: number): IslandProgress =>
    islandProgress.find((p) => p.islandId === islandId) ?? { islandId, total: 100, captured: 0 }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>声语大陆</Text>
        <TouchableOpacity style={styles.gearBtn} onPress={() => setPinVisible(true)}>
          <Text style={styles.gearIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Today task card */}
        <View style={styles.taskCard}>
          {dailyStats.allDone ? (
            <>
              <Text style={styles.taskTitle}>✅ 今日冒险完成！</Text>
              <Text style={styles.taskSub}>
                共收服了 {dailyStats.totalCapturedToday} 只新语灵
              </Text>
              <Text style={styles.taskMeta}>明天见！</Text>
            </>
          ) : (
            <>
              <Text style={styles.taskTitle}>🎮 今日冒险</Text>
              <Text style={styles.taskSub}>
                剩余 {dailyStats.remaining} 只语灵等待你！
              </Text>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => (navigation as any).navigate('Battle')}
                activeOpacity={0.85}
              >
                <Text style={styles.startBtnText}>开始冒险</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Island grid */}
        {ISLAND_ROWS.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((islandId) => {
              const unlocked = unlockedIslands.includes(islandId)
              const prog = getProgress(islandId)
              const islandColor = colors.island[islandId] ?? colors.spiritPurple

              return (
                <View key={islandId} style={styles.islandWrapper}>
                  <View
                    style={[
                      styles.islandCircle,
                      { backgroundColor: unlocked ? islandColor : '#C8C8D8' },
                    ]}
                  >
                    {unlocked ? (
                      <Text style={styles.islandEmoji}>🏝️</Text>
                    ) : (
                      <Text style={styles.islandEmoji}>🔒</Text>
                    )}
                  </View>
                  <Text style={[styles.islandName, !unlocked && styles.islandNameLocked]}>
                    {ISLAND_NAMES[islandId]}
                  </Text>
                  {unlocked && (
                    <Text style={styles.islandCount}>
                      {prog.captured}/{prog.total}
                    </Text>
                  )}
                </View>
              )
            })}
          </View>
        ))}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      <ParentPinModal
        visible={pinVisible}
        onClose={() => setPinVisible(false)}
        onSuccess={() => {
          setPinVisible(false)
          ;(navigation as any).navigate('ParentReport')
        }}
      />

      {companionUnlocked && (
        <Animated.View style={[styles.companionFloat, { transform: [{ translateY: companionBounce }] }]}>
          <TouchableOpacity
            style={styles.companionBtn}
            onPress={() => (navigation as any).navigate('Companion')}
            activeOpacity={0.85}
          >
            <Text style={styles.companionEmoji}>✨</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.landBeige },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text.primary },
  gearBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  gearIcon: { fontSize: 24 },

  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },

  taskCard: {
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  taskTitle: { fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.sm },
  taskSub: { fontSize: 15, color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.md },
  taskMeta: { fontSize: 14, color: colors.text.hint },
  startBtn: {
    width: '100%',
    height: 52,
    backgroundColor: colors.spiritPurple,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  islandWrapper: { alignItems: 'center', width: 72 },
  islandCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  islandEmoji: { fontSize: 28 },
  islandName: { fontSize: 11, fontWeight: '600', color: colors.text.secondary, textAlign: 'center' },
  islandNameLocked: { color: colors.text.hint },
  islandCount: { fontSize: 10, color: colors.text.hint, marginTop: 2 },
  companionFloat: {
    position: 'absolute',
    bottom: 100,
    right: 24,
  },
  companionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.spiritPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  companionEmoji: { fontSize: 28 },
})
