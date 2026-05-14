function require_env(key: string): string {
  const val = process.env[key]
  if (!val) {
    console.error(`[config] Missing required env var: ${key}`)
    process.exit(1)
  }
  return val
}

function optional_env(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const config = {
  db: {
    url: require_env('DATABASE_URL'),
  },
  redis: {
    url: require_env('REDIS_URL'),
  },
  jwt: {
    secret: require_env('JWT_SECRET'),
    expiresIn: optional_env('JWT_EXPIRES_IN', '30d'),
  },
  azure: {
    speechKey: require_env('AZURE_SPEECH_KEY'),
    speechRegion: require_env('AZURE_SPEECH_REGION'),
    speechEndpoint: require_env('AZURE_SPEECH_ENDPOINT'),
    ttsKey: require_env('AZURE_TTS_KEY'),
  },
  anthropic: {
    apiKey: optional_env('ANTHROPIC_API_KEY', ''),
  },
  app: {
    env: optional_env('APP_ENV', 'development'),
    port: parseInt(optional_env('PORT', '3000'), 10),
    dailyNewWordsLimit: parseInt(optional_env('DAILY_NEW_WORDS_LIMIT', '5'), 10),
    dailyReviewWordsLimit: parseInt(optional_env('DAILY_REVIEW_WORDS_LIMIT', '10'), 10),
    companionUnlockThreshold: parseInt(optional_env('COMPANION_UNLOCK_THRESHOLD', '100'), 10),
    companionDailyMinutes: parseInt(optional_env('COMPANION_DAILY_MINUTES', '5'), 10),
    parentPinSalt: optional_env('PARENT_PIN_SALT', 'phonosia_pin_salt_dev'),
  },
}
