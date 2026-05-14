import { TextStyle } from 'react-native'

export const typography: Record<string, TextStyle> = {
  wordDisplay: {
    fontFamily: 'Nunito-Bold',
    fontSize: 32,
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },
  wordMedium: {
    fontFamily: 'Nunito-Bold',
    fontSize: 24,
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  score: {
    fontFamily: 'Fredoka-One',
    fontSize: 48,
  },
  bodyZh: {
    fontSize: 14,
    lineHeight: 22,
  },
  bodyZhMedium: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
}
