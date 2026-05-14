import { apiClient } from './client'

export interface DailyReport {
  newWords: number
  reviews: number
  durationSeconds: number
  avgScore: number
  streakDays: number
}

export interface WeeklyDay {
  date: string
  newWords: number
  reviewWords: number
  avgScore: number
  durationMinutes: number
}

export interface WeakWord {
  spiritId: number
  consecutiveLow: number
  spirit: {
    id: number
    word: string
    phonetic: string
    meaningZh: string
    islandId: number
  }
}

export const reportApi = {
  getDaily: () =>
    apiClient.get<DailyReport>('/api/report/daily').then((r) => r.data),

  getWeekly: () =>
    apiClient.get<WeeklyDay[]>('/api/report/weekly').then((r) => r.data),

  getWeakWords: () =>
    apiClient.get<WeakWord[]>('/api/report/weak-words').then((r) => r.data),
}
