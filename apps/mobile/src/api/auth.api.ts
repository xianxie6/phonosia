import { apiClient } from './client'

export interface RegisterPayload {
  childName: string
  ageGrade: number
  parentPhone: string
  parentPin: string
}

export interface LoginPayload {
  parentPhone: string
  parentPin: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    childName: string
    ageGrade: number
    subscriptionTier: string
  }
}

export const authApi = {
  register: (data: RegisterPayload) =>
    apiClient.post<AuthResponse>('/api/auth/register', data).then((r) => r.data),

  login: (data: LoginPayload) =>
    apiClient.post<AuthResponse>('/api/auth/login', data).then((r) => r.data),

  verifyPin: (parentPin: string) =>
    apiClient
      .post<{ success: boolean; locked: boolean; remainingAttempts?: number; remainingMinutes?: number }>(
        '/api/auth/verify-pin',
        { parentPin },
      )
      .then((r) => r.data),
}
