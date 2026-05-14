import { prisma } from '../../db/prisma'
import { redis } from '../../db/redis'
import { config } from '../../config'
import { getNextReviewDate } from '../../utils/spacedRepetition'

type FailureReason = 'RECOGNITION_FAILED' | 'SILENCE' | 'TIMEOUT' | 'PRONUNCIATION_LOW'

const NON_COUNTED_REASONS: FailureReason[] = ['RECOGNITION_FAILED', 'SILENCE', 'TIMEOUT']

function dailyTaskKey(userId: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `daily_task:${userId}:${date}`
}

function secondsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date()
  midnight.setHours(23, 59, 59, 999)
  return Math.floor((midnight.getTime() - now.getTime()) / 1000)
}

export async function getDailyTask(userId: string) {
  const key = dailyTaskKey(userId)
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const reviewSpirits = await prisma.userSpirit.findMany({
    where: {
      userId,
      nextReviewAt: { lte: new Date() },
    },
    take: config.app.dailyReviewWordsLimit,
    include: { spirit: true },
  })

  const capturedSpiritIds = await prisma.userSpirit.findMany({
    where: { userId },
    select: { spiritId: true },
  })
  const capturedIds = capturedSpiritIds.map((us) => us.spiritId)

  const newSpirits = await prisma.spirit.findMany({
    where: { id: { notIn: capturedIds } },
    orderBy: [{ islandId: 'asc' }, { difficulty: 'asc' }],
    take: config.app.dailyNewWordsLimit,
  })

  const result = {
    review: reviewSpirits.map((us) => ({ ...us.spirit, userSpirit: { bestScore: us.bestScore, reviewCount: us.reviewCount } })),
    new: newSpirits,
  }

  await redis.set(key, JSON.stringify(result), 'EX', secondsUntilMidnight())
  return result
}

export async function captureSpirit(
  userId: string,
  spiritId: number,
  score: number,
  failureReason?: string,
  audioDurationMs?: number,
) {
  const spirit = await prisma.spirit.findUnique({ where: { id: spiritId } })
  if (!spirit) throw { statusCode: 404, code: 'NOT_FOUND', message: '语灵不存在' }

  const attemptNumber = await prisma.pronunciationLog.count({ where: { userId, spiritId } }) + 1

  // v2.0: non-counted failure reasons
  if (failureReason && NON_COUNTED_REASONS.includes(failureReason as FailureReason)) {
    await prisma.pronunciationLog.create({
      data: {
        userId,
        spiritId,
        score,
        attemptNumber,
        audioDurationMs: audioDurationMs ?? 0,
        failureReason,
        attemptCounted: false,
      },
    })
    return { captured: false, counted: false, failureReason }
  }

  // score < 70: PRONUNCIATION_LOW
  if (score < 70) {
    await prisma.pronunciationLog.create({
      data: {
        userId,
        spiritId,
        score,
        attemptNumber,
        audioDurationMs: audioDurationMs ?? 0,
        failureReason: failureReason ?? 'PRONUNCIATION_LOW',
        attemptCounted: true,
      },
    })
    return { captured: false, counted: true, failureReason: failureReason ?? 'PRONUNCIATION_LOW' }
  }

  // score >= 70: capture
  const newVersion = score >= 90 ? 'shiny' : 'standard'
  const existing = await prisma.userSpirit.findUnique({ where: { userId_spiritId: { userId, spiritId } } })
  const isFirstCapture = !existing

  const currentBestScore = existing?.bestScore ?? 0
  const currentVersion = existing?.captureVersion ?? 'standard'
  const newBestScore = Math.max(currentBestScore, score)
  // shiny never downgrades
  const finalVersion = currentVersion === 'shiny' ? 'shiny' : newVersion

  const reviewCount = (existing?.reviewCount ?? 0) + (isFirstCapture ? 0 : 1)
  const lastIntervalDays = existing?.nextReviewAt
    ? Math.max(1, Math.round((existing.nextReviewAt.getTime() - Date.now()) / 86400000))
    : 1
  const nextReviewAt = getNextReviewDate(score, reviewCount, lastIntervalDays)

  await prisma.userSpirit.upsert({
    where: { userId_spiritId: { userId, spiritId } },
    create: {
      userId,
      spiritId,
      bestScore: newBestScore,
      captureVersion: finalVersion,
      reviewCount: 0,
      nextReviewAt,
    },
    update: {
      bestScore: newBestScore,
      captureVersion: finalVersion,
      reviewCount: { increment: isFirstCapture ? 0 : 1 },
      nextReviewAt,
    },
  })

  // update DailySession
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  await prisma.dailySession.upsert({
    where: { userId_sessionDate: { userId, sessionDate: today } },
    create: {
      userId,
      sessionDate: today,
      newWordsCount: isFirstCapture ? 1 : 0,
      reviewWordsCount: isFirstCapture ? 0 : 1,
      totalAttempts: attemptNumber,
      totalSuccess: 1,
    },
    update: {
      newWordsCount: { increment: isFirstCapture ? 1 : 0 },
      reviewWordsCount: { increment: isFirstCapture ? 0 : 1 },
      totalAttempts: { increment: 1 },
      totalSuccess: { increment: 1 },
    },
  })

  await prisma.pronunciationLog.create({
    data: {
      userId,
      spiritId,
      score,
      attemptNumber,
      audioDurationMs: audioDurationMs ?? 0,
      failureReason: null,
      attemptCounted: true,
    },
  })

  // check companion unlock
  const totalCaptured = await prisma.userSpirit.count({ where: { userId } })
  const companionUnlocked = totalCaptured === config.app.companionUnlockThreshold

  return {
    captured: true,
    version: finalVersion,
    isFirstCapture,
    counted: true,
    ...(companionUnlocked ? { companionUnlocked: true } : {}),
  }
}

export async function getGrimoire(userId: string) {
  const userSpirits = await prisma.userSpirit.findMany({
    where: { userId },
    include: { spirit: true },
    orderBy: [{ spirit: { islandId: 'asc' } }, { spirit: { id: 'asc' } }],
  })

  const unlockedIslandIds = [...new Set(userSpirits.map((us) => us.spirit.islandId))]
  // unlock next island when current has 80 captured
  const islandCounts: Record<number, number> = {}
  for (const us of userSpirits) {
    islandCounts[us.spirit.islandId] = (islandCounts[us.spirit.islandId] ?? 0) + 1
  }
  const unlockedIslands = [1, 2].filter((id) => {
    if (id === 1) return true
    return (islandCounts[id - 1] ?? 0) >= 80 || unlockedIslandIds.includes(id)
  })

  return { userSpirits, unlockedIslands }
}

export async function getStats(userId: string) {
  const totalCaptured = await prisma.userSpirit.count({ where: { userId } })

  // streak days
  const sessions = await prisma.dailySession.findMany({
    where: { userId },
    orderBy: { sessionDate: 'desc' },
    select: { sessionDate: true },
  })
  let streakDays = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < sessions.length; i++) {
    const d = new Date(sessions[i].sessionDate)
    d.setHours(0, 0, 0, 0)
    const expected = new Date(today)
    expected.setDate(today.getDate() - i)
    if (d.getTime() === expected.getTime()) {
      streakDays++
    } else {
      break
    }
  }

  // island progress
  const allSpirits = await prisma.spirit.groupBy({
    by: ['islandId'],
    _count: { id: true },
  })
  const capturedByIsland = await prisma.userSpirit.findMany({
    where: { userId },
    include: { spirit: { select: { islandId: true } } },
  })
  const capturedMap: Record<number, number> = {}
  for (const us of capturedByIsland) {
    capturedMap[us.spirit.islandId] = (capturedMap[us.spirit.islandId] ?? 0) + 1
  }
  const islandProgress = allSpirits.map((g) => ({
    islandId: g.islandId,
    total: g._count.id,
    captured: capturedMap[g.islandId] ?? 0,
  }))

  return { totalCaptured, streakDays, islandProgress }
}
