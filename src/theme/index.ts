/**
 * Central theme tokens. Kept intentionally small for the MVP; screens and
 * components should read from here rather than hard-coding values.
 */
export const colors = {
  background: '#0E0F13',
  surface: '#1A1C22',
  primary: '#4C8DFF',
  accent: '#FF6B6B',
  text: '#F5F7FA',
  textMuted: '#9AA0AC',
  border: '#2A2D36',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const theme = { colors, spacing, radius } as const;

export type Theme = typeof theme;
