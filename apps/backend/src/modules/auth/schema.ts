import { z } from 'zod'

export const RegisterInput = z.object({
  childName: z.string().min(1).max(50),
  ageGrade: z.number().int().min(1).max(6),
  parentPhone: z.string().regex(/^1\d{10}$/, '请输入11位手机号'),
  parentPin: z.string().regex(/^\d{4,6}$/, '请输入4-6位数字PIN'),
})

export const LoginInput = z.object({
  parentPhone: z.string().regex(/^1\d{10}$/, '请输入11位手机号'),
  parentPin: z.string().min(1),
})

export const VerifyPinInput = z.object({
  parentPin: z.string().min(1),
})

export type RegisterInputType = z.infer<typeof RegisterInput>
export type LoginInputType = z.infer<typeof LoginInput>
export type VerifyPinInputType = z.infer<typeof VerifyPinInput>
