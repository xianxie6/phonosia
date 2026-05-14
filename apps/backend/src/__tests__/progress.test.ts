import type { FastifyInstance } from 'fastify'
import { createTestApp } from './helpers/app'
import { prisma } from '../db/prisma'

const PHONE = `1${(Date.now() + 1).toString().slice(-10)}`
let app: FastifyInstance
let token: string
let userId: string

beforeAll(async () => {
  app = await createTestApp()

  // Register test user
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { childName: '进度测试', ageGrade: 2, parentPhone: PHONE, parentPin: '4321' },
  })
  const body = res.json()
  token = body.token
  userId = body.user.id

  // Ensure spirit id:1 exists (from seed)
  const spirit = await prisma.spirit.findUnique({ where: { id: 1 } })
  if (!spirit) {
    await prisma.spirit.create({
      data: {
        id: 1, word: 'apple', islandId: 1, theme: 'daily', difficulty: 1,
        phonetic: '/ˈæp.əl/', meaningZh: '苹果', exampleSentence: 'I eat an apple.',
        isBoss: false,
      },
    })
  }
})

afterAll(async () => {
  await prisma.pronunciationLog.deleteMany({ where: { userId } })
  await prisma.userSpirit.deleteMany({ where: { userId } })
  await prisma.dailySession.deleteMany({ where: { userId } })
  await prisma.user.delete({ where: { id: userId } })
  await app.close()
  await prisma.$disconnect()
})

describe('GET /api/progress/daily-task', () => {
  it('returns up to 5 new words', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/progress/daily-task',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body.new)).toBe(true)
    expect(body.new.length).toBeLessThanOrEqual(5)
  })
})

describe('POST /api/progress/capture', () => {
  beforeEach(async () => {
    // Clear previous captures for spirit 1 to keep tests independent
    await prisma.userSpirit.deleteMany({ where: { userId, spiritId: 1 } })
    await prisma.pronunciationLog.deleteMany({ where: { userId, spiritId: 1 } })
  })

  it('score 92 → captured:true, version:shiny', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/progress/capture',
      headers: { authorization: `Bearer ${token}` },
      payload: { spiritId: 1, score: 92 },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.captured).toBe(true)
    expect(body.version).toBe('shiny')
  })

  it('score 75 → captured:true, version:standard', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/progress/capture',
      headers: { authorization: `Bearer ${token}` },
      payload: { spiritId: 1, score: 75 },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.captured).toBe(true)
    expect(body.version).toBe('standard')
  })

  it('shiny never downgrades: score 92 then 75 → version stays shiny', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/progress/capture',
      headers: { authorization: `Bearer ${token}` },
      payload: { spiritId: 1, score: 92 },
    })
    const res = await app.inject({
      method: 'POST',
      url: '/api/progress/capture',
      headers: { authorization: `Bearer ${token}` },
      payload: { spiritId: 1, score: 75 },
    })
    const body = res.json()
    expect(body.captured).toBe(true)
    expect(body.version).toBe('shiny')
  })

  it('failureReason PRONUNCIATION_LOW → counted:true', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/progress/capture',
      headers: { authorization: `Bearer ${token}` },
      payload: { spiritId: 1, score: 50, failureReason: 'PRONUNCIATION_LOW' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.counted).toBe(true)
    expect(body.captured).toBe(false)
  })

  it('failureReason RECOGNITION_FAILED → counted:false', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/progress/capture',
      headers: { authorization: `Bearer ${token}` },
      payload: { spiritId: 1, score: 0, failureReason: 'RECOGNITION_FAILED' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.counted).toBe(false)
  })

  it('failureReason SILENCE → counted:false', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/progress/capture',
      headers: { authorization: `Bearer ${token}` },
      payload: { spiritId: 1, score: 0, failureReason: 'SILENCE' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.counted).toBe(false)
  })
})

describe('GET /api/progress/grimoire', () => {
  it('returns userSpirits array', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/progress/grimoire',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body.userSpirits)).toBe(true)
  })
})
