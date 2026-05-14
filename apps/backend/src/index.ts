import 'dotenv/config'
import Fastify from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import { config } from './config'
import { authRoutes } from './modules/auth/routes'
import { progressRoutes } from './modules/progress/routes'
import { voiceRoutes } from './modules/voice/voice.routes'
import { reportRoutes } from './modules/report/routes'
import { spiritsRoutes } from './modules/spirits/routes'
import { companionRoutes } from './modules/companion/routes'

const app = Fastify({ logger: { transport: { target: 'pino-pretty' } } })

async function start() {
  await app.register(helmet)
  await app.register(cors, { origin: true })
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
  await app.register(jwt, { secret: config.jwt.secret })
  await app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } })

  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(progressRoutes, { prefix: '/api/progress' })
  await app.register(voiceRoutes, { prefix: '/api/voice' })
  await app.register(reportRoutes, { prefix: '/api/report' })
  await app.register(spiritsRoutes, { prefix: '/api/spirits' })
  await app.register(companionRoutes, { prefix: '/api/companion' })

  await app.listen({ port: config.app.port, host: '0.0.0.0' })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
