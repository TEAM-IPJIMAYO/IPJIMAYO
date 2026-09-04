/**
 * Ported verbatim from app.html lines 5773-5778 (`const THRESHOLDS = {...}`).
 * DO NOT change these numbers — they define the app's odor classification.
 *
 * 냄새 판단 임계값: 25% 미만=안전, 25~74%=주의, 75% 이상=위험
 * (Odor judgement thresholds: <25% = safe, 25-74% = caution, >=75% = danger)
 */
export const THRESHOLDS = {
  cleanMax: 25,
  unclearMax: 75,
  odorDetectedMin: 55,
} as const;

export type SmellTier = 'low' | 'mid' | 'high';

/**
 * Ported from classifyResult()'s smellTier derivation (app.html ~line 7538):
 *   meterValue < cleanMax        -> 'low'
 *   meterValue < unclearMax      -> 'mid'
 *   otherwise                    -> 'high'
 */
export function smellTierFromValue(meterValue: number): SmellTier {
  if (meterValue < THRESHOLDS.cleanMax) return 'low';
  if (meterValue < THRESHOLDS.unclearMax) return 'mid';
  return 'high';
}
