import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AuthStackParamList } from '../../navigation/RootNavigator'
import { colors, spacing, radius } from '../../theme'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

export function LoginScreen({ navigation }: Props) {
  const [parentPhone, setParentPhone] = useState('')
  const [parentPin, setParentPin] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleLogin = async () => {
    if (!parentPhone || !parentPin) {
      Alert.alert('提示', '请填写手机号和PIN')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.login({ parentPhone, parentPin })
      setAuth({
        token: res.token,
        userId: res.user.id,
        childName: res.user.childName,
        ageGrade: res.user.ageGrade,
        subscriptionTier: res.user.subscriptionTier,
      })
    } catch (err: any) {
      Alert.alert('登录失败', err.response?.data?.message ?? '手机号或PIN不正确')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>欢迎回来</Text>

      <Text style={styles.label}>家长手机号</Text>
      <TextInput style={styles.input} value={parentPhone} onChangeText={setParentPhone}
        keyboardType="phone-pad" placeholder="13800138000" maxLength={11} />

      <Text style={styles.label}>PIN码</Text>
      <TextInput style={styles.input} value={parentPin} onChangeText={setParentPin}
        keyboardType="number-pad" secureTextEntry placeholder="••••" maxLength={6} />

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>登录</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>还没账号？去注册</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.landBeige, padding: spacing.xl, paddingTop: 80 },
  title: { fontSize: 28, fontWeight: '700', color: colors.spiritPurple, marginBottom: spacing.xl },
  label: { fontSize: 14, color: colors.text.secondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: '#fff', borderRadius: radius.md, padding: spacing.md,
    fontSize: 16, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border.light,
  },
  btn: {
    height: 52, backgroundColor: colors.spiritPurple, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.md,
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  link: { alignItems: 'center', marginTop: spacing.lg },
  linkText: { color: colors.spiritPurple, fontSize: 15 },
})
