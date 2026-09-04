import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { s } from '@/utils/scale';
import { IconX } from '@/components/icons';
import { useAppState } from '@/store/AppStateContext';

/**
 * Ported from renderTimeline(), app.html lines 8056-8078.
 *
 * `state.monitorTimeline` is only ever populated by the 자동 확인
 * (monitoring) flow (logMonitorEvent(), app.html ~6509), which is not
 * ported yet — see README. Since the array is currently always empty,
 * this always renders the source's "아직 기록된 진행 상황이 없어요"
 * empty state, which is the correct/accurate behavior for the current
 * scope rather than a simplification.
 */
export function TimelineSheet() {
  const { state, closeSheet } = useAppState();
  const items = state.monitorTimeline;

  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.headTitle}>진행 상황</Text>
        <Pressable onPress={closeSheet} accessibilityLabel="진행 상황 닫기" hitSlop={8}>
          <IconX size={s(24)} strokeWidth={2.4} />
        </Pressable>
      </View>
      {items.length === 0 ? (
        <Text style={styles.empty}>아직 기록된 진행 상황이 없어요.</Text>
      ) : (
        <View>{/* TODO: timeline-row rendering once monitoring flow is ported */}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s(26) },
  headTitle: { fontSize: s(28), fontWeight: '800', color: colors.text },
  empty: { fontSize: s(15), color: colors.muted, textAlign: 'center', paddingVertical: s(40) },
});
