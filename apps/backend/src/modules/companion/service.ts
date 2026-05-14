import Anthropic from '@anthropic-ai/sdk'
import axios from 'axios'
import { prisma } from '../../db/prisma'
import { redis } from '../../db/redis'
import { config } from '../../config'

const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey })

const VOCAB_CACHE_TTL = 3600 // 1 hour
const USAGE_KEY_PREFIX = 'companion_usage:'

function usageKey(userId: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${USAGE_KEY_PREFIX}${userId}:${date}`
}

export async function getVocabularyList(userId: string): Promise<string[]> {
  const cacheKey = `companion_vocab:${userId}`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const userSpirits = await prisma.userSpirit.findMany({
    where: { userId },
    include: { spirit: { select: { word: true } } },
  })
  const words = userSpirits.map((us) => us.spirit.word)
  await redis.setex(cacheKey, VOCAB_CACHE_TTL, JSON.stringify(words))
  return words
}

export async function getCompanionStatus(userId: string) {
  const capturedCount = await prisma.userSpirit.count({ where: { userId } })
  const unlocked = capturedCount >= config.app.companionUnlockThreshold

  const usedSeconds = parseInt((await redis.get(usageKey(userId))) ?? '0', 10)
  const dailyLimitSeconds = config.app.companionDailyMinutes * 60
  const remainingMinutes = Math.max(0, Math.floor((dailyLimitSeconds - usedSeconds) / 60))

  return {
    unlocked,
    capturedCount,
    requiredCount: config.app.companionUnlockThreshold,
    remainingMinutes,
  }
}

export async function checkDailyLimit(userId: string): Promise<{ allowed: boolean; remainingMinutes: number }> {
  const usedSeconds = parseInt((await redis.get(usageKey(userId))) ?? '0', 10)
  const dailyLimitSeconds = config.app.companionDailyMinutes * 60
  const remainingSeconds = Math.max(0, dailyLimitSeconds - usedSeconds)
  return {
    allowed: remainingSeconds > 0,
    remainingMinutes: Math.floor(remainingSeconds / 60),
  }
}

export async function addUsageSeconds(userId: string, seconds: number): Promise<void> {
  const key = usageKey(userId)
  await redis.incrby(key, seconds)
  // TTL: expire at end of day
  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const ttl = Math.floor((endOfDay.getTime() - now.getTime()) / 1000)
  await redis.expire(key, ttl)
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

function isMockMode(): boolean {
  return config.azure.ttsKey === 'mock'
}

export async function chat(
  userId: string,
  userMessage: string,
  history: Message[],
): Promise<{ text: string; audioBuffer: Buffer | null }> {
  const vocab = await getVocabularyList(userId)
  const vocabList = vocab.slice(0, 200).join(', ')

  const systemPrompt = `You are a friendly spirit companion in a children's English learning game called Phonosia (声语大陆).
The child has captured ${vocab.length} spirit creatures by pronouncing English words correctly.
The words the child knows: ${vocabList}

Rules:
- Only use words from the child's vocabulary list. Keep replies to 15 words or fewer.
- Be encouraging, playful, and childlike in tone.
- Use simple, short sentences that a young child can understand.
- Occasionally use fun sound effects like *waves* or *hops* in asterisks.
- Never use words outside the child's vocabulary list unless they are very common function words (I, you, is, a, the, and, to, it, in, my, we, can, do, see, go, yes, no, wow, oh).`

  const messages = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userMessage },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 60,
    system: systemPrompt,
    messages,
  })

  const text = (response.content[0] as { type: string; text: string }).text

  if (isMockMode()) {
    return { text, audioBuffer: null }
  }

  const audioBuffer = await synthesizeSpeech(text)
  return { text, audioBuffer }
}

async function synthesizeSpeech(text: string): Promise<Buffer> {
  const ssml = `<speak version='1.0' xml:lang='en-US'>
    <voice name='en-US-AriaNeural'>
      <prosody rate='slow' pitch='+5%'>${text}</prosody>
    </voice>
  </speak>`

  const endpoint = `https://${config.azure.speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`
  const res = await axios.post(endpoint, ssml, {
    headers: {
      'Ocp-Apim-Subscription-Key': config.azure.ttsKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
    },
    responseType: 'arraybuffer',
    timeout: 10000,
  })
  return Buffer.from(res.data)
}
