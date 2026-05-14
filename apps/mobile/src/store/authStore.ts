import { create } from 'zustand'
import { createMMKV } from 'react-native-mmkv'

const storage = createMMKV({ id: 'auth-storage' })

interface AuthState {
  token: string | null
  userId: string | null
  childName: string | null
  ageGrade: number | null
  subscriptionTier: string | null

  setAuth: (params: {
    token: string
    userId: string
    childName: string
    ageGrade: number
    subscriptionTier: string
  }) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: storage.getString('token') ?? null,
  userId: storage.getString('userId') ?? null,
  childName: null,
  ageGrade: null,
  subscriptionTier: null,

  setAuth: ({ token, userId, childName, ageGrade, subscriptionTier }) => {
    storage.set('token', token)
    storage.set('userId', userId)
    set({ token, userId, childName, ageGrade, subscriptionTier })
  },

  clearAuth: () => {
    storage.remove('token')
    storage.remove('userId')
    set({ token: null, userId: null, childName: null, ageGrade: null, subscriptionTier: null })
  },
}))
