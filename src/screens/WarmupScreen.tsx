import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { textStyles } from '@/constants/typography';
import { s } from '@/utils/scale';
import { AppHeader } from '@/components/AppHeader';
import { Screen } from '@/components/Screen';
import { WarmupRing } from '@/components/WarmupRing';
import { useAppState, remainingWarmupSeconds } from '@/store/AppStateContext';
import { formatHMS, clamp } from '@/utils/format';

/**
 * Ported from renderWarmup(), app.html lines 7486-7506. Copy preserved
 * exactly: "예열 중이에요" / "잠시만 기다려주세요" /
 * "앱을 닫아도 예열은 계속 진행돼요." / "예열 취소".
 */
export function WarmupScreen() {
  const { state, now, cancelWarmup } = useAppState();
  const remain = remainingWarmupSeconds(state, now);
  const ratio = clamp(remain / state.warmupDurationSeconds, 0, 1);
  const heat = clamp(1 - ratio, 0, 1);

  return (
    <Screen scroll>
      <AppHeader showToggle={false} />

      <View style={styles.center}>
        <Text style={[styles.eyebrow, { marginTop: s(34) }]}>예열 중이에요</Text>
        <Text style={styles.title}>잠시만 기다려주세요</Text>
        <Text style={styles.subtitle}>앱을 닫아도 예열은 계속 진행돼요.</Text>
      </View>

      <WarmupRing progress={Math.round(heat * 100)} />

      <Text style={styles.timerText}>{formatHMS(remain)}</Text>

      <View style={[styles.center, { marginTop: s(24) }]}>
        <Pressable onPress={cancelWarmup}>
          <Text style={styles.textBtn}>예열 취소</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  eyebrow: { ...textStyles.eyebrow, color: colors.muted, textAlign: 'center' },
  title: { ...textStyles.title, color: colors.text, textAlign: 'center', marginTop: s(10) },
  subtitle: { ...textStyles.subtitle, color: colors.muted, textAlign: 'center', maxWidth: s(340) },
  // .timer-text (line 182)
  timerText: {
    ...textStyles.timerText,
    color: colors.text,
    textAlign: 'center',
    marginTop: s(6),
  },
  // .text-btn (line 183): transparent bg, muted color, underline, 16px, weight 650
  textBtn: {
    color: colors.muted,
    fontSize: s(16),
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
