import React, { useEffect } from 'react';
import { StyleSheet, ScrollView, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { s } from '@/utils/scale';

/**
 * Ported from `.screen` (app.html lines 64-70) — padding 24px 24px
 * calc(82px + safe-area-bottom), and the `screenIn` keyframe:
 *   from { opacity: 0; transform: translateY(8px) }
 *   to   { opacity: 1; transform: translateY(0) }
 * animation: screenIn .28s ease both
 */
export function Screen({ children, style, scroll = false }: { children: React.ReactNode; style?: ViewStyle; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 280 });
    translateY.value = withTiming(0, { duration: 280 });
  }, [opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const content = (
    <Animated.View
      style={[
        styles.screen,
        { paddingBottom: s(82) + insets.bottom, paddingTop: insets.top },
        animStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (scroll) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {content}
      </ScrollView>
    );
  }
  return <>{content}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: s(24),
    backgroundColor: colors.background,
  },
});
