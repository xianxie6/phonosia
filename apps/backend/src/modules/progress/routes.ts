import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../../middleware/auth'
import { getDailyTask, captureSpirit, getGrimoire, getStats } from './service'

const CaptureInput = z.object({
  spiritId: z.number().int().positive(),
  score: z.number().min(0).max(100),
  failureReason: z.string().optional(),
  audioDurationMs: z.number().int().optional(),
})

export async function progressRoutes(app: FastifyInstance) {
  app.get('/daily-task', { preHandler: authenticate }, async (request, reply) => {
    try {
      const data = await getDailyTask(request.userId)
      return reply.send(data)
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ code: err.code, message: err.message })
    }
  })

  app.post('/capture', { preHandler: authenticate }, async (request, reply) => {
    const result = CaptureInput.safeParse(request.body)
    if (!result.success) {
      return reply.code(400).send({ code: 'VALIDATION_ERROR', message: result.error.issues[0].message })
    }
    try {
      const { spiritId, score, failureReason, audioDurationMs } = result.data
      const data = await captureSpirit(request.userId, spiritId, score, failureReason, audioDurationMs)
      return reply.send(data)
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ code: err.code, message: err.message })
    }
  })

  app.get('/grimoire', { preHandler: authenticate }, async (request, reply) => {
    try {
      const data = await getGrimoire(request.userId)
      return reply.send(data)
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ code: err.code, message: err.message })
    }
  })

  app.get('/stats', { preHandler: authenticate }, async (request, reply) => {
    try {
      const data = await getStats(request.userId)
      return reply.send(data)
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ code: err.code, message: err.message })
    }
  })
}
