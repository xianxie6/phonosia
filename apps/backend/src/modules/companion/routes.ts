import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../../middleware/auth'
import {
  getCompanionStatus,
  checkDailyLimit,
  addUsageSeconds,
  chat,
  Message,
} from './service'
import { prisma } from '../../db/prisma'
import { config } from '../../config'

const ChatBodySchema = z.object({
  message: z.string().min(1).max(200),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .max(12)
    .default([]),
})

export async function companionRoutes(app: FastifyInstance) {
  app.get('/status', { preHandler: authenticate }, async (request, reply) => {
    const status = await getCompanionStatus(request.userId)
    return reply.send(status)
  })

  app.post('/chat', { preHandler: authenticate }, async (request, reply) => {
    const capturedCount = await prisma.userSpirit.count({ where: { userId: request.userId } })
    if (capturedCount < config.app.companionUnlockThreshold) {
      return reply
        .code(403)
        .send({ code: 'NOT_UNLOCKED', message: `收服${config.app.companionUnlockThreshold}只语灵后解锁AI伙伴` })
    }

    const limit = await checkDailyLimit(request.userId)
    if (!limit.allowed) {
      return reply.code(403).send({ code: 'DAILY_LIMIT', message: '今日对话时间已用完，明天再来！' })
    }

    const parsed = ChatBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ code: 'INVALID_BODY', message: parsed.error.message })
    }

    const { message, history } = parsed.data

    const start = Date.now()
    const result = await chat(request.userId, message, history as Message[])
    const elapsedSeconds = Math.ceil((Date.now() - start) / 1000)

    await addUsageSeconds(request.userId, elapsedSeconds)

    return reply.send({
      text: result.text,
      audioBase64: result.audioBuffer ? result.audioBuffer.toString('base64') : null,
    })
  })
}
