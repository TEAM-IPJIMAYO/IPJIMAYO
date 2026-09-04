import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { textStyles } from '@/constants/typography';
import { s } from '@/utils/scale';
import { AppHeader } from '@/components/AppHeader';
import { Screen } from '@/components/Screen';
import { WarmupRing } from '@/components/WarmupRing';
import { useAppState, isWarmupRunning, isReadyActive, remainingWarmupSeconds } from '@/store/AppStateContext';
import { formatHMS } from '@/utils/format';

/**
 * Ported from renderDiagnosisHome(), app.html lines 7448-7485.
 *
 * Preserved 1:1: the copy ("지금 이 옷, 입어도 될까요?" / "버튼을 눌러
 * 예열을 시작해요" / "예열이 끝나면 옷감에 기기를 대고 측정할 수
 * 있어요."), the conditional status cards for warmup-running / ready
 * states, and the flame ring button.
 */
export function DiagnosisHomeScreen() {
  const { state, now, startWarmup, setScreen } = useAppState();
  const warmupRunning = isWarmupRunning(state, now);
  const ready = isReadyActive(state, now);
  const remain = remainingWarmupSeconds(state, now);
  const progress = warmupRunning ? (1 - remain / state.warmupDurationSeconds) * 100 : 0;

  return (
    <Screen scroll>
      <AppHeader />

      {warmupRunning && (
        <LinearGradient colors={['#DFF9D3', '#CFF5BE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <Text style={{ fontSize: s(27) }}>🟠</Text>
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>예열 중</Text>
              <Text style={styles.statusSubtitle}>남은 시간 {formatHMS(remain)}</Text>
            </View>
            <Pressable style={styles.chipBtn} onPress={() => setScreen('warmup')}>
              <Text style={styles.chipBtnText}>진행 상황 보기</Text>
            </Pressable>
          </View>
          <View style={styles.miniProgress}>
            <View style={[styles.miniProgressFill, { width: `${progress}%` }]} />
          </View>
        </LinearGradient>
      )}

      {ready && (
        <LinearGradient colors={['#DFF9D3', '#CFF5BE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <Text style={{ fontSize: s(27) }}>✅</Text>
            </View>
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>기기 준비 완료</Text>
              <Text style={styles.statusSubtitle}>
                {state.warmupType === 'scheduled'
                  ? `측정 대기 ${formatHMS(Math.ceil((state.idleTimeoutAt - now) / 1000))}`
                  : '상시 예열 상태'}
              </Text>
            </View>
            <Pressable style={styles.chipBtn} onPress={() => setScreen('ready')}>
              <Text style={styles.chipBtnText}>측정 안내 보기</Text>
            </Pressable>
          </View>
        </LinearGradient>
      )}

      <View style={styles.center}>
        <Text style={styles.eyebrow}>지금 이 옷, 입어도 될까요?</Text>
        <Text style={styles.title}>
          버튼을 눌러{'\n'}예열을 시작해요
        </Text>
      </View>

      <WarmupRing progress={progress} onPress={startWarmup} label="예열 시작" />

      <Text style={styles.bottomNote}>예열이 끝나면 옷감에 기기를 대고 측정할 수 있어요.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  // .eyebrow (line 131)
  eyebrow: {
    ...textStyles.eyebrow,
    color: colors.muted,
    marginTop: s(46),
    marginBottom: s(10),
    textAlign: 'center',
  },
  // .title (line 132)
  title: {
    ...textStyles.title,
    color: colors.text,
    textAlign: 'center',
  },
  // .bottom-note (line 152)
  bottomNote: {
    ...textStyles.bottomNote,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 'auto',
    paddingTop: s(24),
  },
  // .status-card (line 154) — gradient now applied via LinearGradient wrapper;
  // this rule only supplies layout/border, not backgroundColor.
  statusCard: {
    marginTop: s(20),
    marginBottom: s(22),
    width: '100%',
    borderRadius: s(28),
    padding: s(18),
    borderWidth: 1,
    borderColor: 'rgba(143,209,79,0.42)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
  },
  statusIcon: {
    width: s(54),
    height: s(54),
    borderRadius: s(27),
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCopy: {
    flex: 1,
  },
  statusTitle: {
    fontSize: s(20),
    fontWeight: '700',
    color: colors.text,
  },
  statusSubtitle: {
    fontSize: s(16),
    color: '#5B6573',
  },
  chipBtn: {
    borderRadius: 999,
    paddingVertical: s(12),
    paddingHorizontal: s(16),
    backgroundColor: colors.accent2,
  },
  chipBtnText: {
    color: '#0E161F',
    fontWeight: '700',
  },
  miniProgress: {
    height: s(8),
    marginTop: s(15),
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.72)',
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: colors.accent2,
    borderRadius: 999,
  },
});
