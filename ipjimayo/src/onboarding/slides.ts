/**
 * Ported verbatim from the `onboardingSlides` array, app.html lines
 * 5838-5875. Order, titles, mode labels, and descriptions are preserved
 * exactly — do not reword.
 */
export type SlideType =
  | 'modesOverview'
  | 'deviceOverview'
  | 'environment'
  | 'diagnosisPrepFull'
  | 'diagnosisResultFull'
  | 'monitoringSetup'
  | 'monitoringResult';

export interface OnboardingSlide {
  type: SlideType;
  title: string;
  modeLabel?: string;
  desc?: string;
  noScroll?: boolean;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    type: 'modesOverview',
    title: '입지마요는 3가지 모드를 지원해요',
    noScroll: true,
  },
  {
    type: 'deviceOverview',
    title: '기기 구성 및 버튼 안내',
    noScroll: true,
  },
  {
    type: 'environment',
    title: '지금 빨래하면 잘 마를까?',
    modeLabel: '건조 환경 확인',
    desc: '크래들에 장착되어 있으면 LED 색상으로 건조 적합 여부를 바로 확인할 수 있어요.',
    noScroll: true,
  },
  {
    type: 'diagnosisPrepFull',
    title: '지금 이 옷, 입어도 될까?',
    modeLabel: '바로 진단',
    desc: '예열 후 기기를 옷감에 밀착하면 냄새와 수분을 바로 진단해요.',
    noScroll: true,
  },
  {
    type: 'diagnosisResultFull',
    title: '지금 이 옷, 입어도 될까?',
    modeLabel: '바로 진단',
    noScroll: true,
  },
  {
    type: 'monitoringSetup',
    title: '냄새 걱정 없이 잘 마르고 있을까?',
    modeLabel: '자동 확인',
    desc: '건조 상태와 냄새 변화를 자동으로 확인하고 알려드려요',
    noScroll: true,
  },
  {
    type: 'monitoringResult',
    title: '냄새 걱정 없이 잘 마르고 있을까?',
    modeLabel: '자동 확인',
    noScroll: true,
  },
];

/** Ported from the `modes` array inside renderModesOverviewBody(), app.html ~6943-6947. */
export const modesOverviewCards: Array<{ emoji: string; title: string; desc: string }> = [
  { emoji: '🌤', title: '건조 환경 확인', desc: '빨래 전 → 지금 빨래하면 잘 마를까?' },
  { emoji: '👕', title: '바로 진단', desc: '착용 전 → 지금 이 옷, 입어도 될까?' },
  { emoji: '🧥', title: '자동 확인', desc: '건조 중 → 냄새 걱정 없이 잘 마르고 있을까?' },
];
