import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../theme'

export function FogCard() {
  return (
    <View style={styles.card}>
      {/* Fog layers */}
      <View style={styles.fogLayer1} />
      <View style={styles.fogLayer2} />
      <View style={styles.fogLayer3} />
      <Text style={styles.text}>完成当前岛屿 80 只后{'\n'}探索下一片大陆</Text>
      <Text style={styles.icon}>🌫️</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    height: 120,
    borderRadius: radius.xl,
    backgroundColor: '#D0C8F0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fogLayer1: {
    position: 'absolute',
    top: 0,
    left: -20,
    width: '130%',
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 60,
  },
  fogLayer2: {
    position: 'absolute',
    top: 20,
    left: -40,
    width: '140%',
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 50,
  },
  fogLayer3: {
    position: 'absolute',
    bottom: 0,
    left: -10,
    width: '120%',
    height: 55,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 55,
  },
  text: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    zIndex: 1,
  },
  icon: { fontSize: 28, marginTop: spacing.xs, zIndex: 1 },
})
