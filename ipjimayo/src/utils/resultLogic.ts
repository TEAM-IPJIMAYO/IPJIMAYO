import { THRESHOLDS } from '@/constants/thresholds';
import { colors } from '@/constants/colors';

export type ResultCode = 'rewash' | 'basket' | 'cautionMoist' | 'caution' | 'drying' | 'clean';

export interface ResultClassification {
  code: ResultCode;
  color: string;
  badge: string;
  title: string;
  message: string;
}

/** Ported verbatim from classifyResult(), app.html lines 7537-7556. */
export function classifyResult(meterValue: number, moistureExists: boolean): ResultClassification {
  const smellTier =
    meterValue < THRESHOLDS.cleanMax ? 'low' : meterValue < THRESHOLDS.unclearMax ? 'mid' : 'high';

  if (smellTier === 'high') {
    return moistureExists
      ? {
          code: 'rewash',
          color: colors.red,
          badge: '다시 세탁 필요',
          title: '다시 세탁해주세요!',
          message: '충분히 말려도 냄새가 남을 가능성이 높아 다시 세탁하는 것을 추천드려요.',
        }
      : {
          code: 'basket',
          color: colors.red,
          badge: '세탁 후 착용',
          title: '세탁 후 착용을 추천해요',
          message: '측정된 냄새 강도가 높아 세탁 후 착용을 추천해드려요.',
        };
  }
  if (smellTier === 'mid') {
    return moistureExists
      ? {
          code: 'cautionMoist',
          color: colors.yellow,
          badge: '건조 환경 개선',
          title: '건조 환경을 개선해보세요',
          message: '냄새와 잔여 수분이 함께 감지되었어요. 건조 환경을 개선하면 냄새 발생을 줄이는 데 도움이 돼요.',
        }
      : {
          code: 'caution',
          color: colors.yellow,
          badge: '환기 추천',
          title: '냄새가 일부 감지됐어요',
          message: '환기 후 착용하거나 탈취제를 사용해 보세요!',
        };
  }
  // smellTier === 'low'
  return moistureExists
    ? {
        code: 'drying',
        color: colors.yellow,
        badge: '조금만 더',
        title: '조금만 더 말리면 완벽해요!',
        message: '아직 수분이 조금 남아 있습니다 💧',
      }
    : {
        code: 'clean',
        color: colors.blue,
        badge: '착용 가능',
        title: '지금 바로 착용해도 좋아요!',
        message: '오늘도 산뜻한 하루 보내세요 🌞',
      };
}

/** Ported verbatim from buildCautionMoistContent(), app.html lines 7704-7722. */
export function buildCautionMoistContent(temp: number, humidity: number): { title: string; message: string } {
  const tempLow = Number.isFinite(temp) && temp < 18;
  const humidityHigh = Number.isFinite(humidity) && humidity > 50;
  if (tempLow && humidityHigh) {
    return { title: '건조 환경을 개선해보세요!', message: '실내를 조금 더 따뜻하게 하고, 제습기를 사용해보세요.' };
  }
  if (tempLow) {
    return { title: '실내 온도를 높여주세요!', message: '건조가 평소보다 느립니다.\n조금 더 따뜻한 환경에서 건조해보세요.' };
  }
  if (humidityHigh) {
    return { title: '습도를 낮춰주세요!', message: '건조가 평소보다 느립니다.\n제습기를 활용해보세요.' };
  }
  return { title: '건조 환경을 개선해보세요!', message: '실내를 조금 더 따뜻하게 하고, 제습기를 사용해보세요.' };
}

type SmellTier = 'low' | 'mid' | 'high';
type MoistureTier = 'none' | 'little' | 'medium' | 'much';

const SUMMARIES: Record<SmellTier, Record<MoistureTier, { single?: string; first?: string; second?: string }>> = {
  low: {
    none: { single: '냄새와 수분이 감지되지 않았어요' },
    little: { first: '냄새는 감지되지 않았지만', second: '수분이 조금 남아 있어요' },
    medium: { first: '냄새는 감지되지 않았지만', second: '수분이 남아 있어요' },
    much: { first: '냄새는 감지되지 않았지만', second: '수분이 많이 남아 있어요' },
  },
  mid: {
    none: { first: '냄새가 일부 감지됐지만', second: '수분은 남아 있지 않아요' },
    little: { first: '냄새가 일부 감지됐고', second: '수분이 조금 남아 있어요' },
    medium: { first: '냄새가 일부 감지됐고', second: '수분이 남아 있어요' },
    much: { first: '냄새가 일부 감지됐고', second: '수분이 많이 남아 있어요' },
  },
  high: {
    none: { first: '강한 냄새가 감지됐지만', second: '수분은 남아 있지 않아요' },
    little: { first: '강한 냄새가 감지됐고', second: '수분이 조금 남아 있어요' },
    medium: { first: '강한 냄새가 감지됐고', second: '수분이 남아 있어요' },
    much: { first: '강한 냄새가 감지됐고', second: '수분이 많이 남아 있어요' },
  },
};

/**
 * Ported verbatim from buildDiagnosisSummary(), app.html lines 7559-7636.
 * Returns either a single line or a [first, second] pair, instead of the
 * source's HTML string, so the screen can render it as separate <Text>
 * lines (matching `.diagnosis-line` being `display: block`).
 */
export function buildDiagnosisSummary(meterValue: number, filledDrops: number): string[] {
  const smellTier: SmellTier =
    meterValue < THRESHOLDS.cleanMax ? 'low' : meterValue < THRESHOLDS.unclearMax ? 'mid' : 'high';
  const moistureTier: MoistureTier =
    filledDrops === 0 ? 'none' : filledDrops <= 2 ? 'little' : filledDrops === 3 ? 'medium' : 'much';

  const summary = SUMMARIES[smellTier][moistureTier];
  if (summary.single) return [summary.single];
  return [summary.first!, summary.second!];
}
