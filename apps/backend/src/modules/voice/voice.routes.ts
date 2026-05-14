import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/auth'
import { validateWavBuffer } from '../../utils/audioValidator'
import { mockAssess, assessPronunciation, isMockMode } from './voice.service'
import { captureSpirit } from '../progress/service'

export async function voiceRoutes(app: FastifyInstance) {
  app.setErrorHandler((error: any, _request, reply) => {
    if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.code(400).send({ code: 'INVALID_AUDIO', message: '文件大小不能超过2MB' })
    }
    reply.send(error)
  })

  app.post('/assess', { preHandler: authenticate }, async (request, reply) => {
    let audioBuffer: Buffer | null = null
    let referenceText = ''
    let spiritId = 0

    const parts = request.parts()
    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'audio') {
        const chunks: Buffer[] = []
        for await (const chunk of part.file) {
          chunks.push(chunk)
        }
        audioBuffer = Buffer.concat(chunks)
      } else if (part.type === 'field') {
        if (part.fieldname === 'referenceText') {
          referenceText = part.value as string
        } else if (part.fieldname === 'spiritId') {
          spiritId = parseInt(part.value as string, 10)
        }
      }
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return reply.code(400).send({ code: 'MISSING_AUDIO', message: '请上传音频文件' })
    }
    if (!referenceText) {
      return reply.code(400).send({ code: 'MISSING_TEXT', message: '请提供参考文本' })
    }
    if (!spiritId) {
      return reply.code(400).send({ code: 'MISSING_SPIRIT', message: '请提供语灵ID' })
    }

    const validation = validateWavBuffer(audioBuffer)
    if (!validation.valid) {
      return reply.code(400).send({ code: 'INVALID_AUDIO', message: validation.error })
    }

    try {
      const assessment = isMockMode()
        ? await mockAssess(referenceText)
        : await assessPronunciation(audioBuffer, referenceText)

      const captureResult = await captureSpirit(
        request.userId,
        spiritId,
        assessment.overallScore,
        assessment.failureReason,
        audioBuffer.length,
      )

      return reply.send({
        score: assessment.overallScore,
        accuracyScore: assessment.accuracyScore,
        fluencyScore: assessment.fluencyScore,
        isRecognized: assessment.isRecognized,
        failureReason: assessment.failureReason ?? null,
        wordDetails: assessment.wordDetails,
        captured: captureResult.captured,
        captureVersion: (captureResult as any).version ?? null,
        counted: captureResult.counted,
      })
    } catch (err: any) {
      return reply
        .code(err.statusCode ?? 500)
        .send({ code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? '处理失败' })
    }
  })
}
