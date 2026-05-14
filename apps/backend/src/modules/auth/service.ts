import bcrypt from 'bcryptjs'
import { prisma } from '../../db/prisma'
import { redis } from '../../db/redis'
import type { RegisterInputType, LoginInputType } from './schema'

const PIN_FAIL_TTL = 5 * 60
const PIN_MAX_ATTEMPTS = 5

function pinFailKey(userId: string) {
  return `pin_fail:${userId}`
}

export async function register(app: import('fastify').FastifyInstance, input: RegisterInputType) {
  const existing = await prisma.user.findUnique({ where: { parentPhone: input.parentPhone } })
  if (existing) {
    throw { statusCode: 409, code: 'PHONE_EXISTS', message: '该手机号已注册' }
  }

  const parentPinHash = await bcrypt.hash(input.parentPin, 10)
  const user = await prisma.user.create({
    data: {
      childName: input.childName,
      ageGrade: input.ageGrade,
      parentPhone: input.parentPhone,
      parentPinHash,
    },
  })

  const token = app.jwt.sign({ userId: user.id })
  return {
    token,
    user: { id: user.id, childName: user.childName, ageGrade: user.ageGrade, subscriptionTier: user.subscriptionTier },
  }
}

export async function login(app: import('fastify').FastifyInstance, input: LoginInputType) {
  const user = await prisma.user.findUnique({ where: { parentPhone: input.parentPhone } })
  if (!user) {
    throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: '手机号或PIN不正确' }
  }

  const valid = await bcrypt.compare(input.parentPin, user.parentPinHash)
  if (!valid) {
    throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: '手机号或PIN不正确' }
  }

  const token = app.jwt.sign({ userId: user.id })
  return {
    token,
    user: { id: user.id, childName: user.childName, ageGrade: user.ageGrade, subscriptionTier: user.subscriptionTier },
  }
}

export async function verifyParentPin(userId: string, pin: string) {
  const key = pinFailKey(userId)
  const failCount = parseInt((await redis.get(key)) ?? '0', 10)

  if (failCount >= PIN_MAX_ATTEMPTS) {
    const ttl = await redis.ttl(key)
    return { success: false, locked: true, remainingMinutes: Math.ceil(ttl / 60) }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw { statusCode: 404, code: 'NOT_FOUND', message: '用户不存在' }
  }

  const valid = await bcrypt.compare(pin, user.parentPinHash)
  if (!valid) {
    const newCount = failCount + 1
    await redis.set(key, newCount, 'EX', PIN_FAIL_TTL)
    const remaining = PIN_MAX_ATTEMPTS - newCount
    return { success: false, locked: false, remainingAttempts: remaining }
  }

  await redis.del(key)
  return { success: true, locked: false }
}
