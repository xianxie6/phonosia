import { FastifyRequest, FastifyReply } from 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    userId: string
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{ userId: string }>()
    request.userId = payload.userId
  } catch {
    reply.code(401).send({ code: 'UNAUTHORIZED', message: '请先登录' })
  }
}
