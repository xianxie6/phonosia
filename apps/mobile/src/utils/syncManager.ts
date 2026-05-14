import { apiClient } from '../api/client'
import type { Spirit, UserSpiritDetail } from './types'
import {
  createTablesIfNeeded,
  countSpirits,
  insertSpirits,
  upsertProgress,
  getPendingSync,
  markSynced,
  upsertProgressFromCloud,
} from './localDatabase'

async function downloadSpiritsIfNeeded(): Promise<void> {
  const count = await countSpirits()
  if (count > 0) return
  const response = await apiClient.get<Spirit[]>('/api/spirits')
  await insertSpirits(response.data)
}

async function syncPendingProgress(): Promise<void> {
  const pending = await getPendingSync()
  for (const item of pending) {
    try {
      await apiClient.post('/api/progress/capture', {
        spiritId: item.spiritId,
        score: item.bestScore,
      })
      await markSynced(item.spiritId)
    } catch {
      // keep synced=0, will retry on next network restore
    }
  }
}

async function fetchLatestProgress(): Promise<void> {
  try {
    const response = await apiClient.get<{ userSpirits: UserSpiritDetail[] }>('/api/progress/grimoire')
    const entries = response.data.userSpirits.map((us) => ({
      spiritId: us.spiritId,
      bestScore: us.bestScore,
      captureVersion: us.captureVersion,
      reviewCount: us.reviewCount,
      nextReviewAt: us.nextReviewAt ? new Date(us.nextReviewAt).getTime() : 0,
      synced: 1,
    }))
    await upsertProgressFromCloud(entries)
  } catch {
    // ignore — will retry on next sync
  }
}

const SyncManager = {
  async initialize(): Promise<void> {
    await createTablesIfNeeded()
    await Promise.allSettled([
      downloadSpiritsIfNeeded(),
      fetchLatestProgress(),
    ])
    await syncPendingProgress()
  },

  async onNetworkRestore(): Promise<void> {
    await syncPendingProgress()
    await fetchLatestProgress()
  },

  async captureSpirit(
    spiritId: number,
    score: number,
    version: string,
    nextReviewAt: number,
  ): Promise<void> {
    await upsertProgress(spiritId, score, version, nextReviewAt)
    try {
      await apiClient.post('/api/progress/capture', { spiritId, score })
      await markSynced(spiritId)
    } catch {
      // stays synced=0, will be picked up by syncPendingProgress
    }
  },
}

export { SyncManager }
