import React from 'react';
import { View, Text, Pressable, TextInput, Platform, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { s } from '@/utils/scale';
import { IconX } from '@/components/icons';
import { useAppState } from '@/store/AppStateContext';

/**
 * Ported from renderSettings(), app.html lines 8079-8092, and its CSS
 * (.sheet-head / .option-grid / .option-card / .time-input / .small-help,
 * lines 1277-1284).
 *
 * Source uses a native `<input type="time">`; RN has no first-class time
 * picker, so this uses a plain masked TextInput for "HH:MM" as the
 * closest equivalent without pulling in a native date/time-picker module
 * — flagged in README as a candidate for @react-native-community/datetimepicker.
 */
export function SettingsSheet() {
  const { state, closeSheet, setWarmupTypeScheduled, setWarmupTypeAlways, setScheduledTime, simulateAlarm } = useAppState();
  const next = state.scheduledTimestamp ? new Date(state.scheduledTimestamp) : null;

  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.headTitle}>설정</Text>
        <Pressable onPress={closeSheet} accessibilityLabel="설정 닫기" hitSlop={8}>
          <IconX size={s(24)} strokeWidth={2.4} />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>예열 방식</Text>
      <View style={styles.optionGrid}>
        <Pressable
          style={[styles.optionCard, state.warmupType === 'scheduled' && styles.optionCardActive]}
          onPress={setWarmupTypeScheduled}
        >
          <Text style={styles.optionTitle}>필요 시 예열</Text>
          <Text style={styles.optionDesc}>측정 전 설정한 시간 또는 버튼으로 예열</Text>
        </Pressable>
        <Pressable
          style={[styles.optionCard, state.warmupType === 'always' && styles.optionCardActive]}
          onPress={setWarmupTypeAlways}
        >
          <Text style={styles.optionTitle}>상시 예열</Text>
          <Text style={styles.optionDesc}>예열 단계를 생략하고 바로 측정 안내</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>예열 예약 시각</Text>
      <TextInput
        style={styles.timeInput}
        value={state.scheduledTime}
        editable={state.warmupType !== 'always'}
        placeholder="07:30"
        keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
        onChangeText={setScheduledTime}
      />
      <Text style={styles.smallHelp}>
        예약 시각은 선택한 시각이 되는 즉시 시작돼요. 앱이 백그라운드에 있을 때도 동작하려면 로컬 알림 스케줄링이
        추가로 필요합니다.
      </Text>
      {next && (
        <Text style={styles.smallHelp}>
          <Text style={{ fontWeight: '800' }}>다음 예약: </Text>
          {next.toLocaleString('ko-KR')}
        </Text>
      )}

      <Pressable style={styles.accentBtn} onPress={simulateAlarm}>
        <Text style={styles.accentBtnText}>알람 울림 시뮬레이션</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s(26),
  },
  headTitle: { fontSize: s(28), fontWeight: '800', color: colors.text },
  sectionTitle: { fontSize: s(19), fontWeight: '900', color: colors.text, marginTop: s(24), marginBottom: s(12) },
  optionGrid: { flexDirection: 'row', gap: s(12) },
  optionCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E3E8EF',
    borderRadius: s(24),
    padding: s(16),
    minHeight: s(112),
    backgroundColor: colors.card,
  },
  optionCardActive: {
    borderColor: colors.accent2,
    backgroundColor: '#E2FAD4',
  },
  optionTitle: { fontSize: s(20), fontWeight: '900', color: colors.text, marginBottom: s(9) },
  optionDesc: { fontSize: s(14), color: colors.muted },
  timeInput: {
    borderWidth: 0,
    backgroundColor: '#EFF3F8',
    borderRadius: s(23),
    padding: s(18),
    fontSize: s(24),
    fontWeight: '900',
    color: colors.text,
  },
  smallHelp: { fontSize: s(13), color: colors.muted, lineHeight: s(19), marginTop: s(10) },
  accentBtn: {
    marginTop: s(14),
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: s(14),
    alignItems: 'center',
  },
  accentBtnText: { color: '#fff', fontWeight: '800' },
});
