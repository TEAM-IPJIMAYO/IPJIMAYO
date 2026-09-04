import React, { useEffect } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { textStyles } from '@/constants/typography';
import { s } from '@/utils/scale';
import { useAppState } from '@/store/AppStateContext';

/**
 * Ported from modeToggle(), app.html lines 6237-6244, and the associated
 * CSS (.mode-toggle / .mode-pill / .mode-tab, lines 96-125).
 *
 * The sliding pill uses `transition: transform .32s cubic-bezier(.2,.8,.2,1)`
 * in source; approximated here with Reanimated's withTiming + a matching
 * bezier easing.
 */
export function ModeToggle() {
  const { state, switchMode } = useAppState();
  const isMonitoring = state.mode === 'monitoring';
  const translate = useSharedValue(isMonitoring ? 1 : 0);

  useEffect(() => {
    translate.value = withTiming(isMonitoring ? 1 : 0, {
      duration: 320,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
    });
  }, [isMonitoring, translate]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translate.value * PILL_TRAVEL }],
  }));

  return (
    <View style={styles.toggle}>
      <Animated.View style={[styles.pill, pillStyle]} />
      <Pressable style={styles.tab} onPress={() => switchMode('diagnosis')}>
        <Text style={[styles.tabText, !isMonitoring && styles.tabTextActive]}>바로 진단</Text>
      </Pressable>
      <Pressable style={styles.tab} onPress={() => switchMode('monitoring')}>
        <Text style={[styles.tabText, isMonitoring && styles.tabTextActive]}>자동 확인</Text>
      </Pressable>
    </View>
  );
}

// .mode-toggle (line 96): width 236, height 56, padding 6, radius 999
const WIDTH = s(236);
const PADDING = s(6);
const PILL_WIDTH = (WIDTH - PADDING * 2) / 2;
const PILL_TRAVEL = PILL_WIDTH; // pill translateX(100%) of its own width

const styles = StyleSheet.create({
  toggle: {
    width: WIDTH,
    height: s(56),
    borderRadius: 999,
    padding: PADDING,
    backgroundColor: '#ECEFF5',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(210,216,225,0.7)',
  },
  // .mode-pill (line 106): accent-2 bg, radius 999, shadow
  pill: {
    position: 'absolute',
    width: PILL_WIDTH,
    height: s(44),
    top: PADDING,
    left: PADDING,
    backgroundColor: colors.accent2,
    borderRadius: 999,
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    ...textStyles.modeTab,
    color: '#5D6675',
  },
  tabTextActive: {
    color: '#111827',
  },
});
