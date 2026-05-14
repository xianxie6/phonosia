export interface Spirit {
  id: number
  word: string
  islandId: number
  theme: string
  difficulty: number
  phonetic: string
  meaningZh: string
  exampleSentence: string
  isBoss: boolean
}

export interface UserSpiritDetail {
  userId: string
  spiritId: number
  capturedAt: string
  bestScore: number
  captureVersion: 'standard' | 'shiny'
  reviewCount: number
  nextReviewAt: string | null
  nickname: string | null
  spirit: Spirit
}

export interface DailyTask {
  review: Array<Spirit & { userSpirit: { bestScore: number; reviewCount: number } }>
  new: Spirit[]
}

export interface CaptureResult {
  captured: boolean
  version?: 'shiny' | 'standard'
  isFirstCapture?: boolean
  counted: boolean
  failureReason?: string
  companionUnlocked?: boolean
}

export interface AssessResult {
  score: number
  accuracyScore: number
  fluencyScore: number
  isRecognized: boolean
  failureReason: string | null
  wordDetails: { word: string; accuracyScore: number }[]
  captured: boolean
  captureVersion: 'shiny' | 'standard' | null
  counted: boolean
}
