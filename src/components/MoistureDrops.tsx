import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { s } from '@/utils/scale';

/**
 * Ported from the moisture-drops block inside renderResult(), app.html
 * ~lines 7783-7788, and `.drop-icon` CSS (line 425): filled drops use
 * `filter: none`, unfilled use `grayscale(1) opacity(.3)` — approximated
 * in RN with opacity since grayscale isn't available without a shader.
 */
export function MoistureDrops({ filledDrops }: { filledDrops: number }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>잔여 수분 상태</Text>
      <View style={styles.row}>
        {Array.from({ length: 5 }, (_, i) => (
          <Text key={i} style={[styles.drop, i >= filledDrops && styles.dropEmpty]}>
            💧
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // .moisture-drops (line 422)
  wrap: {
    marginTop: s(20),
    alignItems: 'center',
  },
  // .drops-title (line 423)
  title: {
    fontSize: s(16),
    fontWeight: '800',
    color: colors.text,
    marginBottom: s(10),
    alignSelf: 'flex-start',
  },
  // .drop-row (line 424)
  row: {
    flexDirection: 'row',
    gap: s(9),
    justifyContent: 'center',
  },
  // .drop-icon (line 425)
  drop: {
    fontSize: s(26),
  },
  // .drop-icon:not(.filled) — grayscale(1) opacity(.3) approximated
  dropEmpty: {
    opacity: 0.3,
  },
});
