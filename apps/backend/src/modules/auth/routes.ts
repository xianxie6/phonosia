import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/auth'
import { RegisterInput, LoginInput, VerifyPinInput } from './schema'
import { register, login, verifyParentPin } from './service'

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const result = RegisterInput.safeParse(request.body)
    if (!result.success) {
      return reply.code(400).send({ code: 'VALIDATION_ERROR', message: result.error.issues[0].message })
    }
    try {
      const data = await register(app, result.data)
      return reply.code(201).send(data)
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ code: err.code, message: err.message })
    }
  })

  app.post('/login', async (request, reply) => {
    const result = LoginInput.safeParse(request.body)
    if (!result.success) {
      return reply.code(400).send({ code: 'VALIDATION_ERROR', message: result.error.issues[0].message })
    }
    try {
      const data = await login(app, result.data)
      return reply.send(data)
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ code: err.code, message: err.message })
    }
  })

  app.post('/verify-pin', { preHandler: authenticate }, async (request, reply) => {
    const result = VerifyPinInput.safeParse(request.body)
    if (!result.success) {
      return reply.code(400).send({ code: 'VALIDATION_ERROR', message: result.error.issues[0].message })
    }
    try {
      const data = await verifyParentPin(request.userId, result.data.parentPin)
      return reply.send(data)
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ code: err.code, message: err.message })
    }
  })
}
