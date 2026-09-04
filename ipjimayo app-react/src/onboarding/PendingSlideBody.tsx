import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { s } from '@/utils/scale';
import type { SlideType } from '@/onboarding/slides';

/**
 * Placeholder for the six onboarding slide illustrations not yet ported
 * (deviceOverview, environment, diagnosisPrepFull, diagnosisResultFull,
 * monitoringSetup, monitoringResult). The real title/mode-tag/description
 * text IS already shown (see OnboardingModal.tsx, pulled from
 * onboarding/slides.ts) — only the custom SVG/photo illustration body is
 * outstanding. Each source render function this maps to is named below so
 * it can be ported 1:1 next:
 *
 *   deviceOverview      -> renderDeviceOverviewBody()        app.html ~6904
 *   environment          -> renderEnvironmentBody()           app.html ~6958
 *   diagnosisPrepFull    -> renderOnboardingDiagnosisPrepFullBody() ~7337
 *   diagnosisResultFull  -> renderDiagnosisResultFullBody()   app.html ~6973
 *   monitoringSetup      -> renderMonitoringSetupBody()       app.html ~7353
 *   monitoringResult     -> renderMonitoringResultBody()      app.html ~7372
 *
 * This is a deliberate, disclosed placeholder — NOT a silent
 * simplification of the source design (task rule #35/#37).
 */
export function PendingSlideBody({ type }: { type: SlideType }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.badge}>포팅 예정</Text>
      <Text style={styles.note}>
        `{type}` 슬라이드의 일러스트/애니메이션은 아직 이식되지 않았습니다.{'\n'}
        원본 함수를 기준으로 다음 단계에서 구현합니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: s(22),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    padding: s(20),
    alignItems: 'center',
    gap: s(8),
  },
  badge: {
    fontSize: s(12),
    fontWeight: '800',
    color: colors.muted,
    backgroundColor: colors.background,
    paddingHorizontal: s(10),
    paddingVertical: s(4),
    borderRadius: 999,
  },
  note: {
    fontSize: s(13),
    color: colors.muted2,
    textAlign: 'center',
    lineHeight: s(19),
  },
});
