import { prisma } from '../../db/prisma'

export async function getDailyReport(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const session = await prisma.dailySession.findUnique({
    where: { userId_sessionDate: { userId, sessionDate: today } },
  })

  // streak days
  const sessions = await prisma.dailySession.findMany({
    where: { userId },
    orderBy: { sessionDate: 'desc' },
    select: { sessionDate: true },
  })
  let streakDays = 0
  const todayMs = today.getTime()
  for (let i = 0; i < sessions.length; i++) {
    const d = new Date(sessions[i].sessionDate)
    d.setHours(0, 0, 0, 0)
    const expected = new Date(todayMs - i * 86400000)
    if (d.getTime() === expected.getTime()) streakDays++
    else break
  }

  // avg score from today's logs
  const todayLogs = await prisma.pronunciationLog.findMany({
    where: { userId, createdAt: { gte: today }, attemptCounted: true },
    select: { score: true },
  })
  const avgScore =
    todayLogs.length > 0
      ? Math.round(todayLogs.reduce((s, l) => s + l.score, 0) / todayLogs.length)
      : 0

  return {
    newWords: session?.newWordsCount ?? 0,
    reviews: session?.reviewWordsCount ?? 0,
    durationSeconds: session?.sessionDurationSeconds ?? 0,
    avgScore,
    streakDays,
  }
}

export async function getWeeklyReport(userId: string) {
  const days: { date: string; newWords: number; reviewWords: number; avgScore: number; durationMinutes: number }[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)

    const session = await prisma.dailySession.findUnique({
      where: { userId_sessionDate: { userId, sessionDate: d } },
    })

    const nextDay = new Date(d.getTime() + 86400000)
    const logs = await prisma.pronunciationLog.findMany({
      where: { userId, createdAt: { gte: d, lt: nextDay }, attemptCounted: true },
      select: { score: true },
    })
    const avgScore =
      logs.length > 0
        ? Math.round(logs.reduce((s, l) => s + l.score, 0) / logs.length)
        : 0

    days.push({
      date: d.toISOString().slice(0, 10),
      newWords: session?.newWordsCount ?? 0,
      reviewWords: session?.reviewWordsCount ?? 0,
      avgScore,
      durationMinutes: Math.round((session?.sessionDurationSeconds ?? 0) / 60),
    })
  }

  return days
}

export async function getWeakWords(userId: string) {
  // Find spiritIds where last 3 consecutive logs are PRONUNCIATION_LOW
  const userSpiritIds = await prisma.pronunciationLog.findMany({
    where: { userId, attemptCounted: true },
    select: { spiritId: true },
    distinct: ['spiritId'],
  })

  const weakSpirits: { spiritId: number; spirit: object; consecutiveLow: number }[] = []

  for (const { spiritId } of userSpiritIds) {
    const recentLogs = await prisma.pronunciationLog.findMany({
      where: { userId, spiritId, attemptCounted: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { failureReason: true, score: true },
    })

    if (
      recentLogs.length >= 3 &&
      recentLogs.every((l) => l.failureReason === 'PRONUNCIATION_LOW' || l.score < 70)
    ) {
      const spirit = await prisma.spirit.findUnique({ where: { id: spiritId } })
      if (spirit) {
        weakSpirits.push({ spiritId, spirit, consecutiveLow: recentLogs.length })
      }
    }
  }

  return weakSpirits
}
