/**
 * Design tokens ported 1:1 from the `:root` CSS custom properties in
 * ipjimayo_app_no_demo_panel.html (lines 11-32).
 *
 * DO NOT change any hex value here without also checking the source HTML —
 * these are the single source of truth for the visual identity of the app.
 */

export const colors = {
  accent: '#8FD14F',
  accent2: '#9BE86C',
  accentSoft: '#DDF8CC',
  accentPale: '#EEFBE7',

  background: '#F5F6F8',
  card: '#FFFFFF',

  text: '#101722',
  muted: '#6B7280',
  muted2: '#9AA3AF',

  line: '#E6EAF0',

  blue: '#0A84FF',
  yellow: '#FFD60A',
  orange: '#FF9F0A',
  red: '#FF453A',

  dark: '#2C3440',

  // Used by btnBlinkOrange keyframe (line 2507) for the disconnected-state
  // button blink; kept here since it's a real color used in the UI.
  btnBlinkOff: '#F8EFE8',
} as const;

/**
 * Shadows ported from `--shadow` / `--soft-shadow` CSS vars (lines 27-28).
 * React Native has no direct CSS box-shadow equivalent; these are expressed
 * as RN shadow props (iOS) — Android needs `elevation` as a fallback,
 * included per shadow below.
 */
export const shadows = {
  // 0 18px 60px rgba(16,23,34,.09)
  card: {
    shadowColor: 'rgba(16,23,34,1)',
    shadowOpacity: 0.09,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  // 0 12px 36px rgba(143,209,79,.22)
  accentSoft: {
    shadowColor: colors.accent,
    shadowOpacity: 0.22,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  // 0 14px 34px rgba(16,23,34,.08) — used on warmup-ring-visual
  ring: {
    shadowColor: 'rgba(16,23,34,1)',
    shadowOpacity: 0.08,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  // 0 17px 25px rgba(16,23,34,.12) — filter: drop-shadow on flame progress
  flame: {
    shadowColor: 'rgba(16,23,34,1)',
    shadowOpacity: 0.12,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 17 },
    elevation: 5,
  },
} as const;

/**
 * Radii / base sizing ported from `--radius-xl`, `--radius-lg`, `--phone-w`.
 */
export const radii = {
  xl: 34,
  lg: 26,
} as const;

/** Reference design width the HTML was built at (`--phone-w: 430px`). */
export const BASE_WIDTH = 430;
