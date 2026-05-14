import { apiClient } from './client'
import type { DailyTask, CaptureResult, UserSpiritDetail, Spirit } from '../utils/types'

export interface CapturePayload {
  spiritId: number
  score: number
  failureReason?: string
  audioDurationMs?: number
}

export interface GrimoireResponse {
  userSpirits: UserSpiritDetail[]
  unlockedIslands: number[]
}

export interface StatsResponse {
  totalCaptured: number
  streakDays: number
  islandProgress: { islandId: number; total: number; captured: number }[]
}

export const progressApi = {
  getDailyTask: () =>
    apiClient.get<DailyTask>('/api/progress/daily-task').then((r) => r.data),

  capture: (data: CapturePayload) =>
    apiClient.post<CaptureResult>('/api/progress/capture', data).then((r) => r.data),

  getGrimoire: () =>
    apiClient.get<GrimoireResponse>('/api/progress/grimoire').then((r) => r.data),

  getStats: () =>
    apiClient.get<StatsResponse>('/api/progress/stats').then((r) => r.data),
}
