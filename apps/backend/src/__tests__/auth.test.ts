import type { FastifyInstance } from 'fastify'
import { createTestApp } from './helpers/app'
import { prisma } from '../db/prisma'

const PHONE = `1${Date.now().toString().slice(-10)}`

let app: FastifyInstance
let token: string

beforeAll(async () => {
  app = await createTestApp()
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { parentPhone: { startsWith: PHONE.slice(0, 8) } } })
  await app.close()
  await prisma.$disconnect()
})

describe('POST /api/auth/register', () => {
  it('registers successfully and returns token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        childName: '测试小朋友',
        ageGrade: 3,
        parentPhone: PHONE,
        parentPin: '1234',
      },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.token).toBeTruthy()
    expect(body.user.childName).toBe('测试小朋友')
    token = body.token
  })

  it('returns 409 when phone already registered', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        childName: '另一个小朋友',
        ageGrade: 2,
        parentPhone: PHONE,
        parentPin: '5678',
      },
    })
    expect(res.statusCode).toBe(409)
  })

  it('returns 400 on invalid format (short childName)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        childName: '',
        ageGrade: 1,
        parentPhone: '13800138001',
        parentPin: '1234',
      },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('returns token with correct credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { parentPhone: PHONE, parentPin: '1234' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.token).toBeTruthy()
  })

  it('returns 401 with wrong PIN', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { parentPhone: PHONE, parentPin: '9999' },
    })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/auth/verify-pin', () => {
  it('returns success:true with correct PIN', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-pin',
      headers: { authorization: `Bearer ${token}` },
      payload: { parentPin: '1234' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.success).toBe(true)
  })

  it('returns locked:true after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/auth/verify-pin',
        headers: { authorization: `Bearer ${token}` },
        payload: { parentPin: '0000' },
      })
    }
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-pin',
      headers: { authorization: `Bearer ${token}` },
      payload: { parentPin: '1234' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.locked).toBe(true)
  })
})
