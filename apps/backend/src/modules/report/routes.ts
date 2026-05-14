import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/auth'
import { getDailyReport, getWeeklyReport, getWeakWords } from './service'

export async function reportRoutes(app: FastifyInstance) {
  app.get('/daily', { preHandler: authenticate }, async (request, reply) => {
    const data = await getDailyReport(request.userId)
    return reply.send(data)
  })

  app.get('/weekly', { preHandler: authenticate }, async (request, reply) => {
    const data = await getWeeklyReport(request.userId)
    return reply.send(data)
  })

  app.get('/weak-words', { preHandler: authenticate }, async (request, reply) => {
    const data = await getWeakWords(request.userId)
    return reply.send(data)
  })
}
