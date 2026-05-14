import { create } from 'zustand'
import { createMMKV } from 'react-native-mmkv'
import type { Spirit, AssessResult, DailyTask } from '../utils/types'

const gameStorage = createMMKV({ id: 'game-storage' })

export type BattlePhase =
  | 'entering'
  | 'waiting'
  | 'recording'
  | 'assessing'
  | 'result'
  | 'celebrating'
  | 'completed'

function todayKey(userId: string): string {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `daily_task_${userId}_${d}`
}

export function cacheDailyTask(userId: string, task: DailyTask): void {
  gameStorage.set(todayKey(userId), JSON.stringify(task))
}

export function getCachedDailyTask(userId: string): DailyTask | null {
  const raw = gameStorage.getString(todayKey(userId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as DailyTask
  } catch {
    return null
  }
}

interface GameState {
  todayQueue: Spirit[]
  currentIndex: number
  battlePhase: BattlePhase
  lastResult: AssessResult | null
  consecutiveFailures: number
  networkHint: boolean
  isOffline: boolean

  setQueue: (queue: Spirit[]) => void
  advance: () => void
  setPhase: (phase: BattlePhase) => void
  setResult: (result: AssessResult) => void
  incrementFailures: () => void
  resetFailures: () => void
  setNetworkHint: (hint: boolean) => void
  setOffline: (offline: boolean) => void
}

export const useGameStore = create<GameState>((set) => ({
  todayQueue: [],
  currentIndex: 0,
  battlePhase: 'entering',
  lastResult: null,
  consecutiveFailures: 0,
  networkHint: false,
  isOffline: false,

  setQueue: (queue) => set({ todayQueue: queue, currentIndex: 0, battlePhase: 'entering' }),
  advance: () =>
    set((s) => ({
      currentIndex: s.currentIndex + 1,
      battlePhase: s.currentIndex + 1 >= s.todayQueue.length ? 'completed' : 'entering',
      consecutiveFailures: 0,
      networkHint: false,
      lastResult: null,
    })),
  setPhase: (battlePhase) => set({ battlePhase }),
  setResult: (lastResult) => set({ lastResult }),
  incrementFailures: () => set((s) => ({ consecutiveFailures: s.consecutiveFailures + 1 })),
  resetFailures: () => set({ consecutiveFailures: 0 }),
  setNetworkHint: (networkHint) => set({ networkHint }),
  setOffline: (isOffline) => set({ isOffline }),
}))
