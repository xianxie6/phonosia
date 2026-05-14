import { apiClient } from './client'
import type { AssessResult } from '../utils/types'

export interface AssessPayload {
  audioPath: string
  referenceText: string
  spiritId: number
}

export const voiceApi = {
  assessVoice: async (payload: AssessPayload): Promise<AssessResult> => {
    const formData = new FormData()
    formData.append('audio', {
      uri: payload.audioPath,
      type: 'audio/wav',
      name: 'recording.wav',
    } as any)
    formData.append('referenceText', payload.referenceText)
    formData.append('spiritId', String(payload.spiritId))

    const response = await apiClient.post<AssessResult>('/api/voice/assess', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}
