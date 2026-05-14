import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors } from '../theme'

export type CellStatus = 'locked' | 'standard' | 'shiny'

interface Props {
  word: string
  islandId: number
  status: CellStatus
  size: number
  onPress: () => void
}

export function SpiritGridCell({ word, islandId, status, size, onPress }: Props) {
  const islandColor = colors.island[islandId] ?? colors.spiritPurple

  if (status === 'locked') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ width: size, padding: 2 }}>
        <View style={[styles.cell, { backgroundColor: islandColor + '4D', height: size - 4 }]}>
          <Text style={styles.lockIcon}>？</Text>
        </View>
      </TouchableOpacity>
    )
  }

  if (status === 'shiny') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ width: size, padding: 2 }}>
        {/* Gold gradient border via nested views */}
        <View style={[styles.shinyBorder, { height: size - 4 }]}>
          <View style={[styles.cell, styles.shinyCell, { backgroundColor: islandColor }]}>
            <Text style={styles.spiritEmoji}>✨</Text>
            <Text style={[styles.wordLabel, { fontSize: size < 72 ? 8 : 10 }]} numberOfLines={1}>
              {word}
            </Text>
          </View>
          {/* Star badge */}
          <View style={styles.starBadge}>
            <Text style={styles.starText}>★</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // standard
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ width: size, padding: 2 }}>
      <View style={[styles.cell, { backgroundColor: islandColor, height: size - 4 }]}>
        <Text style={styles.spiritEmoji}>✨</Text>
        <Text style={[styles.wordLabel, { fontSize: size < 72 ? 8 : 10 }]} numberOfLines={1}>
          {word}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  cell: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lockIcon: {
    fontSize: 22,
    color: 'rgba(0,0,0,0.35)',
    fontWeight: '700',
  },
  shinyBorder: {
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.naturalGold,
    overflow: 'visible',
  },
  shinyCell: {
    flex: 1,
    borderRadius: 9,
  },
  spiritEmoji: { fontSize: 26 },
  wordLabel: {
    color: '#fff',
    fontWeight: '600',
    marginTop: 2,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  starBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.naturalGold,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: { fontSize: 9, color: '#fff', fontWeight: '700' },
})
