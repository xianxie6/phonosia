import axios from 'axios'
import { config } from '../../config'
import type { AssessmentResult, WordDetail } from '../../utils/failureTypes'

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function mockAssess(referenceText: string): Promise<AssessmentResult> {
  await new Promise((r) => setTimeout(r, 800))
  const overall = randomBetween(75, 98)
  const accuracy = randomBetween(70, 100)
  const fluency = randomBetween(70, 100)
  return {
    overallScore: overall,
    accuracyScore: accuracy,
    fluencyScore: fluency,
    recognizedText: referenceText,
    isRecognized: true,
    wordDetails: [{ word: referenceText, accuracyScore: accuracy }],
  }
}

export async function assessPronunciation(
  audioBuffer: Buffer,
  referenceText: string,
): Promise<AssessmentResult> {
  const assessmentParams = Buffer.from(
    JSON.stringify({
      ReferenceText: referenceText,
      GradingSystem: 'HundredMark',
      Granularity: 'Word',
      Dimension: 'Comprehensive',
      EnableProsodyAssessment: 'False',
    }),
  ).toString('base64')

  const url = `${config.azure.speechEndpoint}/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`

  try {
    const response = await axios.post(url, audioBuffer, {
      headers: {
        'Ocp-Apim-Subscription-Key': config.azure.speechKey,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Pronunciation-Assessment': assessmentParams,
        'Accept': 'application/json',
      },
      timeout: 8000,
    })

    const data = response.data
    const status: string = data.RecognitionStatus ?? ''

    if (status !== 'Success') {
      const failureReason = status === 'InitialSilenceTimeout' ? 'SILENCE' : 'RECOGNITION_FAILED'
      return {
        overallScore: 0,
        accuracyScore: 0,
        fluencyScore: 0,
        recognizedText: '',
        isRecognized: false,
        failureReason,
        wordDetails: [],
      }
    }

    const pron = data.NBest?.[0]?.PronunciationAssessment ?? {}
    const overallScore: number = pron.PronScore ?? 0
    const accuracyScore: number = pron.AccuracyScore ?? 0
    const fluencyScore: number = pron.FluencyScore ?? 0
    const recognizedText: string = data.DisplayText ?? ''

    const wordDetails: WordDetail[] = (data.NBest?.[0]?.Words ?? []).map((w: any) => ({
      word: w.Word,
      accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? 0,
      errorType: w.PronunciationAssessment?.ErrorType,
    }))

    const failureReason = overallScore < 70 ? 'PRONUNCIATION_LOW' : undefined

    return {
      overallScore,
      accuracyScore,
      fluencyScore,
      recognizedText,
      isRecognized: true,
      failureReason,
      wordDetails,
    }
  } catch (err: any) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
      return {
        overallScore: 0,
        accuracyScore: 0,
        fluencyScore: 0,
        recognizedText: '',
        isRecognized: false,
        failureReason: 'TIMEOUT',
        wordDetails: [],
      }
    }
    throw err
  }
}

export function isMockMode(): boolean {
  return config.azure.speechKey === 'mock'
}
