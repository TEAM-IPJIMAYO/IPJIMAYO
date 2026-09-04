import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { s } from '@/utils/scale';
import { clamp } from '@/utils/format';

/**
 * Ported from smellStageFromValue() + renderSmellStageMeter(), app.html
 * lines 6031-6050, and its CSS (.smell-stage-meter etc., lines 4039+).
 */
function smellStageFromValue(value: number): number {
  return clamp(Math.floor(clamp(Number(value) || 0, 0, 100) / 20) + 1, 1, 5);
}

const STAGE_COLORS = ['#0A84FF', '#30D158', '#FFD60A', '#FF9F0A', '#FF453A'];

export function SmellStageMeter({ value }: { value: number }) {
  const activeStage = smellStageFromValue(value);

  return (
    <View style={styles.wrap} accessibilityLabel={`냄새 정도 ${activeStage}단계`}>
      <Text style={styles.title}>냄새 정도</Text>
      <View style={styles.grid}>
        {STAGE_COLORS.map((color, index) => {
          const stage = index + 1;
          const active = stage === activeStage;
          return (
            <View key={stage} style={[styles.cell, active && { borderColor: color, backgroundColor: `${color}1A` }]}>
              <View style={[styles.lamp, { backgroundColor: active ? color : colors.line }]} />
              <Text style={[styles.number, active && { color }]}>{stage}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // .smell-stage-meter (line 4039)
  wrap: {
    marginTop: s(22),
    width: '100%',
  },
  title: {
    fontSize: s(16),
    fontWeight: '800',
    color: colors.text,
    marginBottom: s(12),
    textAlign: 'left',
  },
  // .smell-stage-grid (line 4049)
  grid: {
    flexDirection: 'row',
    gap: s(6),
  },
  // .smell-stage-cell (line 4054)
  cell: {
    flex: 1,
    borderRadius: s(14),
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingVertical: s(10),
    alignItems: 'center',
    gap: s(6),
  },
  lamp: {
    width: s(10),
    height: s(10),
    borderRadius: s(5),
  },
  number: {
    fontSize: s(13),
    fontWeight: '800',
    color: colors.muted,
  },
});
