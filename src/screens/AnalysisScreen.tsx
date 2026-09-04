import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { textStyles } from '@/constants/typography';
import { s } from '@/utils/scale';
import { AppHeader } from '@/components/AppHeader';
import { Screen } from '@/components/Screen';
import { useAppState, remainingAnalysisSeconds } from '@/store/AppStateContext';
import { clamp } from '@/utils/format';

/**
 * Ported from renderAnalysis(), app.html lines 7521-7536, and the
 * `scanSquare` keyframe (line 198) that moves the magnifier icon in a
 * rectangle around the cloth-stage box:
 *   0%   translate(-72px, -62px)
 *   25%  translate(66px, -62px)
 *   50%  translate(66px, 56px)
 *   75%  translate(-72px, 56px)
 *   100% translate(-72px, -62px)
 * over 3.1s ease-in-out infinite.
 *
 * Copy preserved exactly: "분석 중" (+ typing-dots) / "잠시만
 * 기다려주세요."
 */
export function AnalysisScreen() {
  const { state, now } = useAppState();
  const remain = remainingAnalysisSeconds(state, now);
  const total = state.analysisDurationSeconds;
  const progress = clamp((1 - remain / total) * 100, 0, 100);

  const tx = useSharedValue(s(-72));
  const ty = useSharedValue(s(-62));

  useEffect(() => {
    const dur = 3100 / 4;
    const ease = Easing.inOut(Easing.ease);
    tx.value = withRepeat(
      withSequence(
        withTiming(s(66), { duration: dur, easing: ease }),
        withTiming(s(66), { duration: dur, easing: ease }),
        withTiming(s(-72), { duration: dur, easing: ease }),
        withTiming(s(-72), { duration: dur, easing: ease })
      ),
      -1
    );
    ty.value = withRepeat(
      withSequence(
        withTiming(s(-62), { duration: dur, easing: ease }),
        withTiming(s(56), { duration: dur, easing: ease }),
        withTiming(s(56), { duration: dur, easing: ease }),
        withTiming(s(-62), { duration: dur, easing: ease })
      ),
      -1
    );
  }, [tx, ty]);

  const magnifierStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <Screen scroll>
      <AppHeader showToggle={false} />

      <View style={styles.analysisCard}>
        <View style={styles.clothStage}>
          <Text style={styles.shirt}>👕</Text>
          <Animated.Text style={[styles.magnifier, magnifierStyle]}>🔍</Animated.Text>
        </View>
        <Text style={styles.typing}>
          분석 중<TypingDots />
        </Text>
        <View style={styles.progressLine}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.subtitle}>잠시만 기다려주세요.</Text>
      </View>
    </Screen>
  );
}

/**
 * Ported from the `dots` keyframe + `.typing .typing-dots::after` rule
 * (app.html lines 200-201): `animation: dots 1.2s steps(4,end) infinite`,
 * cycling '' -> '.' -> '..' -> '...' every 300ms.
 */
function TypingDots() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => (c + 1) % 4), 300);
    return () => clearInterval(id);
  }, []);
  return <Text>{'.'.repeat(count)}</Text>;
}

const styles = StyleSheet.create({
  // .analysis-card (line 192)
  analysisCard: {
    marginTop: s(100),
    alignItems: 'center',
  },
  // .cloth-stage (line 193-194)
  clothStage: {
    width: s(280),
    height: s(280),
    borderRadius: s(34),
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  shirt: {
    fontSize: s(84),
  },
  // .magnifier (line 195): 92x92, animated via scanSquare
  magnifier: {
    position: 'absolute',
    fontSize: s(70),
    width: s(92),
    height: s(92),
  },
  // .typing (line 199)
  typing: {
    fontSize: s(33),
    fontWeight: '900',
    color: colors.text,
    marginTop: s(34),
    marginBottom: s(22),
  },
  // .progress-line (line 202)
  progressLine: {
    width: s(300),
    height: s(9),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#ECEFF5',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent2,
    borderRadius: 999,
  },
  subtitle: {
    ...textStyles.subtitle,
    fontSize: s(16),
    color: colors.muted,
    marginTop: s(16),
    textAlign: 'center',
  },
});
