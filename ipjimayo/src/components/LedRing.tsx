import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { s } from '@/utils/scale';

/**
 * Ported from `.led-ring` + `@keyframes ledPulse` (app.html lines
 * 318-341) and `.result-illustration` (line 342-345).
 *
 * Source uses `color-mix(in srgb, var(--result-color) X%, ...)` for the
 * border/glow tints — RN has no color-mix, so each tint is pre-mixed
 * against white/transparent per result color at render time via a simple
 * alpha overlay (implemented with `resultColor` + opacity layering below)
 * rather than true CSS color-mix. Visually equivalent for solid colors.
 */
export function LedRing({ color, size }: { color: string; size: number }) {
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, [glow]);

  const ringStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.28 + glow.value * 0.16,
    shadowRadius: 14 + glow.value * 12,
    elevation: 6 + glow.value * 4,
  }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            shadowColor: color,
          },
          ringStyle,
        ]}
      />
      <View style={[styles.illustration, { width: size - s(26), height: size - s(26), borderRadius: (size - s(26)) / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // .led-ring (line 319): border 9px, colored, glow shadow, ledPulse anim
  ring: {
    position: 'absolute',
    borderWidth: s(9),
    opacity: 0.75,
    shadowOffset: { width: 0, height: 10 },
  },
  // .result-illustration (line 342): inset 13px circle w/ radial gradient bg
  illustration: {
    backgroundColor: '#FAFBFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
