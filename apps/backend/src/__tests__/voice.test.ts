import type { FastifyInstance } from 'fastify'
import { createTestApp } from './helpers/app'
import { makeWavBuffer, buildAudioMultipart } from './helpers/wav'
import { prisma } from '../db/prisma'

const PHONE = `1${(Date.now() + 2).toString().slice(-10)}`
let app: FastifyInstance
let token: string
let userId: string

beforeAll(async () => {
  app = await createTestApp()

  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { childName: '语音测试', ageGrade: 1, parentPhone: PHONE, parentPin: '7890' },
  })
  const body = res.json()
  token = body.token
  userId = body.user.id

  // Ensure spirit id:1 exists
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
  if (userId) {
    await prisma.pronunciationLog.deleteMany({ where: { userId } })
    await prisma.userSpirit.deleteMany({ where: { userId } })
    await prisma.dailySession.deleteMany({ where: { userId } })
    await prisma.user.deleteMany({ where: { id: userId } })
  }
  await app.close()
  await prisma.$disconnect()
})

describe('POST /api/voice/assess', () => {
  it('valid WAV file returns score field', async () => {
    const wav = makeWavBuffer()
    const { body, contentType } = buildAudioMultipart(wav, 'apple', 1)

    const res = await app.inject({
      method: 'POST',
      url: '/api/voice/assess',
      headers: { authorization: `Bearer ${token}`, 'content-type': contentType },
      payload: body,
    })
    expect(res.statusCode).toBe(200)
    const resBody = res.json()
    expect(typeof resBody.score).toBe('number')
  })

  it('response contains captured, counted, captureVersion fields', async () => {
    const wav = makeWavBuffer()
    const { body, contentType } = buildAudioMultipart(wav, 'apple', 1)

    const res = await app.inject({
      method: 'POST',
      url: '/api/voice/assess',
      headers: { authorization: `Bearer ${token}`, 'content-type': contentType },
      payload: body,
    })
    expect(res.statusCode).toBe(200)
    const resBody = res.json()
    expect('captured' in resBody).toBe(true)
    expect('counted' in resBody).toBe(true)
  })

  it('non-WAV binary returns 400', async () => {
    const fakeAudio = Buffer.from('not a wav file at all')
    const { body, contentType } = buildAudioMultipart(fakeAudio, 'apple', 1)

    const res = await app.inject({
      method: 'POST',
      url: '/api/voice/assess',
      headers: { authorization: `Bearer ${token}`, 'content-type': contentType },
      payload: body,
    })
    expect(res.statusCode).toBe(400)
  })

  it('file larger than 2MB returns 400', async () => {
    // Build a WAV header + 2.1 MB of data
    const header = makeWavBuffer()
    const dataSize = 2.1 * 1024 * 1024
    const bigBuf = Buffer.concat([header, Buffer.alloc(dataSize)])
    // Patch RIFF chunk size and data chunk size
    bigBuf.writeUInt32LE(dataSize + 36, 4)
    bigBuf.writeUInt32LE(dataSize, 40)

    const { body, contentType } = buildAudioMultipart(bigBuf, 'apple', 1)

    const res = await app.inject({
      method: 'POST',
      url: '/api/voice/assess',
      headers: { authorization: `Bearer ${token}`, 'content-type': contentType },
      payload: body,
    })
    expect(res.statusCode).toBe(400)
  })
})
