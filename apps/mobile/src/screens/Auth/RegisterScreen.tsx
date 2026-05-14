import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AuthStackParamList } from '../../navigation/RootNavigator'
import { colors, spacing, radius } from '../../theme'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>

export function RegisterScreen({ navigation }: Props) {
  const [childName, setChildName] = useState('')
  const [ageGrade, setAgeGrade] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [parentPin, setParentPin] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleRegister = async () => {
    if (!childName || !ageGrade || !parentPhone || !parentPin) {
      Alert.alert('提示', '请填写所有信息')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.register({
        childName,
        ageGrade: parseInt(ageGrade, 10),
        parentPhone,
        parentPin,
      })
      setAuth({
        token: res.token,
        userId: res.user.id,
        childName: res.user.childName,
        ageGrade: res.user.ageGrade,
        subscriptionTier: res.user.subscriptionTier,
      })
    } catch (err: any) {
      Alert.alert('注册失败', err.response?.data?.message ?? '请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>创建账号</Text>

      <Text style={styles.label}>孩子的名字</Text>
      <TextInput style={styles.input} value={childName} onChangeText={setChildName} placeholder="小明" />

      <Text style={styles.label}>年级（1-6年级）</Text>
      <TextInput style={styles.input} value={ageGrade} onChangeText={setAgeGrade}
        keyboardType="number-pad" placeholder="3" maxLength={1} />

      <Text style={styles.label}>家长手机号</Text>
      <TextInput style={styles.input} value={parentPhone} onChangeText={setParentPhone}
        keyboardType="phone-pad" placeholder="13800138000" maxLength={11} />

      <Text style={styles.label}>家长PIN码（4-6位数字）</Text>
      <TextInput style={styles.input} value={parentPin} onChangeText={setParentPin}
        keyboardType="number-pad" secureTextEntry placeholder="••••" maxLength={6} />

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>注册</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>已有账号？去登录</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.landBeige, padding: spacing.xl, paddingTop: 60 },
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
