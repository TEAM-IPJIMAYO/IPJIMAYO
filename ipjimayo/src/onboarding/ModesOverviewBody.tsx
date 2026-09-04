import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { s } from '@/utils/scale';
import { modesOverviewCards } from '@/onboarding/slides';

/**
 * Ported from renderModesOverviewBody(), app.html lines 6942-6953, and the
 * associated `.modes-overview-grid` / `.mode-overview-card` CSS.
 */
export function ModesOverviewBody() {
  return (
    <View style={styles.grid}>
      {modesOverviewCards.map((card) => (
        <View key={card.title} style={styles.card}>
          <Text style={styles.emoji}>{card.emoji}</Text>
          <View style={styles.copy}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDesc}>{card.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: s(12),
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
    borderRadius: s(22),
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line,
    padding: s(16),
  },
  emoji: {
    fontSize: s(30),
  },
  copy: {
    flex: 1,
  },
  cardTitle: {
    fontSize: s(17),
    fontWeight: '800',
    color: colors.text,
  },
  cardDesc: {
    fontSize: s(13.5),
    color: colors.muted,
    marginTop: s(2),
  },
});
