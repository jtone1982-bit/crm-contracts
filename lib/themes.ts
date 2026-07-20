export const THEMES: Record<string, {
  accent: string
  accentHover: string
  accentLight: string
  bg: string
  surface: string
  sidebarBg: string
  text: string
  textSecondary: string
  textMuted: string
}> = {
  terracotta: {
    accent: '#c2410c',
    accentHover: '#9a3412',
    accentLight: '#fef3ed',
    bg: '#f5f1ea',
    surface: '#fefdfb',
    sidebarBg: '#faf7f2',
    text: '#2d2520',
    textSecondary: '#6b5d50',
    textMuted: '#a89a8c',
  },
  sage: {
    accent: '#4a7c59',
    accentHover: '#3a6347',
    accentLight: '#edf5ef',
    bg: '#f0f4f0',
    surface: '#fefefe',
    sidebarBg: '#f5f8f5',
    text: '#2a3530',
    textSecondary: '#5a6b60',
    textMuted: '#9aaa9c',
  },
  lavender: {
    accent: '#7c5d8c',
    accentHover: '#634a73',
    accentLight: '#f5f0f7',
    bg: '#f5f0f7',
    surface: '#fefdfd',
    sidebarBg: '#faf7fb',
    text: '#2d2530',
    textSecondary: '#5d506b',
    textMuted: '#a08ca8',
  },
  ocean: {
    accent: '#2c5f7c',
    accentHover: '#1e4a63',
    accentLight: '#eef4f7',
    bg: '#eef4f7',
    surface: '#fefefe',
    sidebarBg: '#f4f8fa',
    text: '#1f2d35',
    textSecondary: '#4a6068',
    textMuted: '#8aa0a8',
  },
  graphite: {
    accent: '#3a3a3a',
    accentHover: '#2a2a2a',
    accentLight: '#f0f0f0',
    bg: '#f0f0f0',
    surface: '#fefefe',
    sidebarBg: '#f5f5f5',
    text: '#1a1a1a',
    textSecondary: '#555555',
    textMuted: '#999999',
  },
}

export const DEFAULT_THEME = 'terracotta'

export function getTheme(name: string | undefined | null) {
  return THEMES[name || DEFAULT_THEME] || THEMES[DEFAULT_THEME]
}