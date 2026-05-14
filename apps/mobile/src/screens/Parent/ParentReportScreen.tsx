import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native'
import Svg, { Polyline, Line, Text as SvgText, Circle } from 'react-native-svg'
import { useNavigation } from '@react-navigation/native'

import { reportApi, DailyReport, WeeklyDay, WeakWord } from '../../api/report.api'
import { progressApi } from '../../api/progress.api'
import { colors, spacing, radius } from '../../theme'

export function ParentReportScreen() {
  const navigation = useNavigation()
  const [daily, setDaily] = useState<DailyReport | null>(null)
  const [weekly, setWeekly] = useState<WeeklyDay[]>([])
  const [weakWords, setWeakWords] = useState<WeakWord[]>([])
  const [islandProgress, setIslandProgress] = useState<{ islandId: number; total: number; captured: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      reportApi.getDaily(),
      reportApi.getWeekly(),
      reportApi.getWeakWords(),
      progressApi.getStats(),
    ]).then(([d, w, wk, stats]) => {
      if (!mounted) return
      setDaily(d)
      setWeekly(w)
      setWeakWords(wk)
      setIslandProgress(stats.islandProgress)
      setLoading(false)
    }).catch(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>学习报告</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ① Today 4-card grid */}
        <Text style={styles.sectionTitle}>今日数据</Text>
        <View style={styles.cardGrid}>
          <StatCard label="新词" value={String(daily?.newWords ?? 0)} unit="只" />
          <StatCard label="复习" value={String(daily?.reviews ?? 0)} unit="次" />
          <StatCard
            label="学习时长"
            value={String(Math.round((daily?.durationSeconds ?? 0) / 60))}
            unit="分钟"
          />
          <StatCard label="平均发音分" value={String(daily?.avgScore ?? 0)} unit="分" />
        </View>

        {/* ② 7-day line chart */}
        <Text style={styles.sectionTitle}>本周新词趋势</Text>
        <WeeklyChart data={weekly} />

        {/* ③ Weak words */}
        {weakWords.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>需加强词汇</Text>
            <View style={styles.weakList}>
              {weakWords.map((w) => (
                <View key={w.spiritId} style={styles.weakItem}>
                  <View style={styles.redDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.weakWord}>{w.spirit.word}</Text>
                    <Text style={styles.weakPhonetic}>{w.spirit.phonetic}</Text>
                  </View>
                  <Text style={styles.weakCount}>连续{w.consecutiveLow}次</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ④ Island progress bars */}
        <Text style={styles.sectionTitle}>岛屿进度</Text>
        <View style={styles.islandList}>
          {islandProgress.map((ip) => {
            const pct = ip.total > 0 ? Math.min(ip.captured / ip.total, 1) : 0
            const islandColor = colors.island[ip.islandId] ?? colors.spiritPurple
            return (
              <View key={ip.islandId} style={styles.islandRow}>
                <Text style={styles.islandLabel}>岛 {String(ip.islandId).padStart(2, '0')}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: islandColor }]} />
                </View>
                <Text style={styles.islandCount}>{ip.captured}/{ip.total}</Text>
              </View>
            )
          })}
        </View>

        {/* ⑤ Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>⭐ 发音≥90分 = 闪光版收服</Text>
          <Text style={styles.noteText}>✨ 70-89分 = 普通版收服</Text>
          <Text style={styles.noteText}>📚 连续打卡 {daily?.streakDays ?? 0} 天</Text>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function WeeklyChart({ data }: { data: WeeklyDay[] }) {
  const W = 320
  const H = 140
  const PAD = { top: 16, right: 16, bottom: 32, left: 32 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  if (data.length === 0) return null

  const maxVal = Math.max(...data.map((d) => d.newWords), 1)

  const points = data.map((d, i) => {
    const x = PAD.left + (i / (data.length - 1)) * chartW
    const y = PAD.top + chartH - (d.newWords / maxVal) * chartH
    return { x, y, d }
  })

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <View style={styles.chartContainer}>
      <Svg width={W} height={H}>
        {/* Grid line */}
        <Line
          x1={PAD.left} y1={PAD.top + chartH}
          x2={PAD.left + chartW} y2={PAD.top + chartH}
          stroke={colors.border.light} strokeWidth={1}
        />

        {/* Line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={colors.spiritPurple}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots + labels */}
        {points.map((p, i) => (
          <React.Fragment key={i}>
            <Circle cx={p.x} cy={p.y} r={4} fill={colors.spiritPurple} />
            <SvgText
              x={p.x}
              y={H - 6}
              fontSize={9}
              fill={colors.text.hint}
              textAnchor="middle"
            >
              {p.d.date.slice(5)}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.text.secondary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: { width: 60, paddingVertical: spacing.xs },
  backText: { fontSize: 16, color: colors.spiritPurple },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary },

  scroll: { padding: spacing.lg },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },

  // ① Stat cards
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 28, fontWeight: '700', color: colors.spiritPurple },
  statUnit: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  statLabel: { fontSize: 13, color: colors.text.hint, marginTop: spacing.xs },

  // ② Chart
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // ③ Weak words
  weakList: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.sm,
  },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E85858' },
  weakWord: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  weakPhonetic: { fontSize: 12, color: colors.text.hint, marginTop: 2 },
  weakCount: { fontSize: 12, color: '#E85858' },

  // ④ Island progress
  islandList: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  islandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  islandLabel: { width: 40, fontSize: 12, color: colors.text.secondary, fontWeight: '600' },
  barTrack: { flex: 1, height: 8, backgroundColor: colors.border.light, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  islandCount: { width: 42, fontSize: 11, color: colors.text.hint, textAlign: 'right' },

  // ⑤ Note
  noteCard: {
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  noteText: { fontSize: 13, color: colors.text.secondary, lineHeight: 22 },
})
