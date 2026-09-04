/**
 * Pretendard font family registration.
 *
 * The source HTML loads Pretendard from a CDN
 * (`cdn.jsdelivr.net/gh/orioncactus/pretendard`, app.html line 9) with the
 * variable-weight web font, and relies on numeric `font-weight` values
 * (600 / 900 / 850 / 950 ...) that map to specific static Pretendard cuts.
 *
 * React Native's Text `fontWeight` prop is NOT reliably respected together
 * with a custom `fontFamily` on Android — each weight must be its own
 * registered font family. Below is the mapping this app relies on; the
 * matching .otf files must be placed in assets/fonts (see README) and
 * registered via the `expo-font` config plugin in app.json.
 *
 * CSS numeric weight -> Pretendard static family used in this app.
 *   400 (Regular)  -> Pretendard-Regular
 *   500 (Medium)   -> Pretendard-Medium
 *   600 (SemiBold) -> Pretendard-SemiBold
 *   700 (Bold)     -> Pretendard-Bold
 *   800/850/900/950 (ExtraBold/Black) -> Pretendard-Black
 *
 * The HTML occasionally uses non-standard weights like 850/950 for extra
 * visual punch (e.g. `.mode-tab { font-weight: 850 }`,
 * `.timer-text { font-weight: 950 }`). Since RN can't interpolate weights,
 * we map anything >= 800 to the Black cut, which is the closest visual
 * match and preserves the "heavier than Bold" intent.
 */
export const fontFamily = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  black: 'Pretendard-Black',
} as const;

export function weightToFamily(weight: number): string {
  if (weight >= 800) return fontFamily.black;
  if (weight >= 700) return fontFamily.bold;
  if (weight >= 600) return fontFamily.semibold;
  if (weight >= 500) return fontFamily.medium;
  return fontFamily.regular;
}

/**
 * Text styles ported 1:1 from app.html CSS (selectors noted per style).
 * letterSpacing in the source is in `em` (relative to font-size); RN
 * letterSpacing is in absolute px, so each value below is pre-computed as
 * fontSize * emValue at the BASE_WIDTH scale. Screens should still run
 * these through `s()` for the fontSize itself on smaller devices.
 */
export const textStyles = {
  // .eyebrow (line 131): font-size 20px, weight 600, letter-spacing -.04em
  eyebrow: {
    fontSize: 20,
    letterSpacing: 20 * -0.04,
    fontFamily: fontFamily.semibold,
  },
  // .title (line 132): font-size 34px, weight 900, letter-spacing -.065em, line-height 1.18
  title: {
    fontSize: 34,
    lineHeight: 34 * 1.18,
    letterSpacing: 34 * -0.065,
    fontFamily: fontFamily.black,
  },
  // .subtitle (line 133): font-size 18px, letter-spacing -.04em, line-height 1.55
  subtitle: {
    fontSize: 18,
    lineHeight: 18 * 1.55,
    letterSpacing: 18 * -0.04,
    fontFamily: fontFamily.regular,
  },
  // .bottom-note (line 152)
  bottomNote: {
    fontSize: 16,
    letterSpacing: 16 * -0.04,
    fontFamily: fontFamily.regular,
  },
  // .timer-text (line 182): font-weight 950 -> black, letter-spacing -.06em
  timerText: {
    fontSize: 46,
    letterSpacing: 46 * -0.06,
    fontFamily: fontFamily.black,
  },
  // .mode-tab (line 119-125): font-weight 850 -> black, font-size 18px
  modeTab: {
    fontSize: 18,
    letterSpacing: 18 * -0.03,
    fontFamily: fontFamily.black,
  },
  // .warmup-flame-button-copy (line 4311): font-size 19px, weight 500
  flameButtonCopy: {
    fontSize: 19,
    letterSpacing: 19 * -0.02,
    fontFamily: fontFamily.medium,
  },
} as const;
