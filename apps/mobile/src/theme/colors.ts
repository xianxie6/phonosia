export const colors = {
  spiritPurple: '#5B4BE8',
  naturalGold:  '#F0A832',
  landBeige:    '#F5EFE0',
  confused:     '#F5A623',
  dark:         '#1A1A2E',

  island: {
    1:  '#6C9EE8',
    2:  '#E8836C',
    3:  '#6CE8A0',
    4:  '#E8D66C',
    5:  '#C46CE8',
    6:  '#6CE8D6',
    7:  '#E86CA0',
    8:  '#A0E86C',
    9:  '#E8A06C',
    10: '#6C78E8',
  } as Record<number, string>,

  text: {
    primary:   '#1A1A2E',
    secondary: '#6B6B8A',
    inverse:   '#FFFFFF',
    hint:      '#9B9BB8',
  },

  surface: {
    primary:   '#FFFFFF',
    secondary: '#F5F5FF',
    card:      '#FFFFFF',
    overlay:   'rgba(0,0,0,0.5)',
  },

  border: {
    light:  '#E8E8F0',
    medium: '#CFCFE8',
  },
} as const
