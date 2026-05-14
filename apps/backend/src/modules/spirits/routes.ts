import type { FastifyInstance } from 'fastify'
import { prisma } from '../../db/prisma'

export async function spiritsRoutes(app: FastifyInstance) {
  app.get('/', async (_request, reply) => {
    const spirits = await prisma.spirit.findMany({
      orderBy: [{ islandId: 'asc' }, { id: 'asc' }],
    })
    return reply.send(spirits)
  })
}
