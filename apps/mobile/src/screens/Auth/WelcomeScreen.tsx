import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AuthStackParamList } from '../../navigation/RootNavigator'
import { colors, spacing, radius } from '../../theme'

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>声语大陆</Text>
      <Text style={styles.subtitle}>Phonosia</Text>
      <Text style={styles.desc}>大声说出英语单词，收服你的专属语灵！</Text>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.primaryBtnText}>开始冒险</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.secondaryBtnText}>已有账号，去登录</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.landBeige,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.spiritPurple,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 20,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    letterSpacing: 4,
  },
  desc: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    backgroundColor: colors.spiritPurple,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryBtn: {
    padding: spacing.sm,
  },
  secondaryBtnText: {
    color: colors.spiritPurple,
    fontSize: 15,
  },
})
