export type FailureReason =
  | 'RECOGNITION_FAILED'
  | 'PRONUNCIATION_LOW'
  | 'TIMEOUT'
  | 'SILENCE'

export interface WordDetail {
  word: string
  accuracyScore: number
  errorType?: string
}

export interface AssessmentResult {
  overallScore: number
  accuracyScore: number
  fluencyScore: number
  recognizedText: string
  isRecognized: boolean
  failureReason?: FailureReason
  wordDetails: WordDetail[]
}
