import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, shadows } from '@/constants/colors';
import { textStyles } from '@/constants/typography';
import { s } from '@/utils/scale';
import { AppHeader } from '@/components/AppHeader';
import { Screen } from '@/components/Screen';
import { useAppState } from '@/store/AppStateContext';

/**
 * Ported from renderTimeout(), app.html lines 7819-7830. Copy preserved
 * exactly: "측정 대기 시간이<br>종료되었습니다" / "10분 동안 기기 측정이
 * 진행되지 않아 센서를 보호하기 위해 대기 모드로 전환됩니다." / "홈으로
 * 가기".
 */
export function TimeoutScreen() {
  const { goHome } = useAppState();

  return (
    <Screen scroll>
      <AppHeader showToggle={false} />

      <View style={styles.timeoutCard}>
        <Text style={styles.emoji}>⏱</Text>
        <Text style={styles.title}>
          측정 대기 시간이{'\n'}종료되었습니다
        </Text>
        <Text style={styles.subtitle}>
          10분 동안 기기 측정이 진행되지 않아 센서를 보호하기 위해 대기 모드로 전환됩니다.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={goHome}>
          <Text style={styles.primaryBtnText}>홈으로 가기</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  timeoutCard: {
    alignItems: 'center',
    marginTop: s(96),
  },
  emoji: {
    fontSize: s(56),
    marginBottom: s(18),
  },
  title: {
    ...textStyles.title,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.subtitle,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: s(340),
    marginTop: s(16),
  },
  // .primary-btn (line ~458): radius 999, padding 16 24, accent-2 bg
  primaryBtn: {
    marginTop: s(28),
    borderRadius: 999,
    paddingVertical: s(16),
    paddingHorizontal: s(24),
    backgroundColor: colors.accent2,
    ...shadows.accentSoft,
  },
  primaryBtnText: {
    color: '#0E161F',
    fontWeight: '900',
    fontSize: s(17),
  },
});
