import axios from 'axios'
import Config from 'react-native-config'

export const apiClient = axios.create({
  baseURL: Config.API_BASE_URL ?? 'http://localhost:3000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Token injected lazily to avoid circular import with authStore
let getToken: (() => string | null) | null = null
let clearAuth: (() => void) | null = null

export function setupApiInterceptors(
  tokenGetter: () => string | null,
  authClearer: () => void,
) {
  getToken = tokenGetter
  clearAuth = authClearer
}

apiClient.interceptors.request.use((config) => {
  const token = getToken?.()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth?.()
    }
    return Promise.reject(error)
  },
)
