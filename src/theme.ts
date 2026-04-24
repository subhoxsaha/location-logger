/**
 * Theme — Centralized design tokens for the Location Tracker app.
 *
 * All color, spacing, and shape values should be sourced from here
 * to ensure visual consistency across every screen and component.
 */
export const Theme = {
  colors: {
    // Surfaces
    background: '#000000',
    surface: '#141416',
    card: '#1c1c1e',
    border: '#222222',

    // Brand
    primary: '#007AFF',
    primaryMuted: 'rgba(0,122,255,0.15)',

    // Semantic
    success: '#34c759',
    warning: '#ff9f0a',
    danger: '#ff453a',

    // Text
    text: '#ffffff',
    textSecondary: '#aaaaaa',
    textMuted: '#555555',
    textDimmed: '#333333',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  roundness: {
    sm: 6,
    md: 12,
    lg: 20,
    full: 9999,
  },
};
