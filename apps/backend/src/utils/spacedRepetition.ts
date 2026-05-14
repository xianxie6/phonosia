export function getNextReviewDate(score: number, reviewCount: number, lastIntervalDays: number): Date {
  const quality = score >= 90 ? 5 : score >= 70 ? 4 : score >= 50 ? 3 : 1

  let interval: number
  if (quality < 3) {
    interval = 1
  } else if (reviewCount === 0) {
    interval = 1
  } else if (reviewCount === 1) {
    interval = 3
  } else {
    interval = Math.min(Math.round(lastIntervalDays * (1.3 + (quality - 3) * 0.1)), 30)
  }

  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + interval)
  return date
}
