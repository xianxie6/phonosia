import { apiClient } from './client'

export interface CompanionStatus {
  unlocked: boolean
  capturedCount: number
  requiredCount: number
  remainingMinutes: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  text: string
  audioBase64: string | null
}

export const companionApi = {
  getStatus: () =>
    apiClient.get<CompanionStatus>('/api/companion/status').then((r) => r.data),

  chat: (message: string, history: ChatMessage[]) =>
    apiClient.post<ChatResponse>('/api/companion/chat', { message, history }).then((r) => r.data),
}
