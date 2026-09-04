import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { textStyles } from '@/constants/typography';
import { s } from '@/utils/scale';
import { FlameProgress } from '@/components/FlameProgress';

/**
 * Ported from the `.warmup-ring-visual` / `.warmup-ring-btn` /
 * `.main-circle-wrap.warmup-ring-wrap` CSS (app.html lines 135-140,
 * 4288-4311) and its two use sites:
 *   - Home screen: a Pressable button that starts warmup (renderDiagnosisHome)
 *   - Warmup screen: a static (non-pressable) display of progress (renderWarmup)
 */
interface WarmupRingProps {
  /** 0-100 */
  progress: number;
  /** When provided, the ring becomes pressable (home screen "예열 시작" button). */
  onPress?: () => void;
  /** Label under the ring — "예열 시작" on home, hidden on the warmup screen. */
  label?: string;
}

export function WarmupRing({ progress, onPress, label }: WarmupRingProps) {
  const content = (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        <View style={styles.flameBox}>
          <FlameProgress progress={progress} />
        </View>
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityLabel="예열 시작" style={({ pressed }) => [pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }
  return content;
}

// .main-circle-wrap (line 135): width min(312px, 78vw), aspect-ratio 1
const RING_WRAP_SIZE = s(312);
// .warmup-ring-visual (line 4296): width 78% of wrap
const RING_SIZE = RING_WRAP_SIZE * 0.78;
// .warmup-ring-visual .warmup-flame-progress (line 4310): 52% of ring
const FLAME_SIZE = RING_SIZE * 0.52;

const styles = StyleSheet.create({
  wrap: {
    width: RING_WRAP_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: s(70),
  },
  pressed: {
    // .warmup-ring-btn:active .warmup-ring-visual { transform: scale(.97) }
    transform: [{ scale: 0.97 }],
  },
  // .warmup-ring-visual (line 4296-4308): white circle, border, shadow
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(16,23,34,1)',
    shadowOpacity: 0.08,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  flameBox: {
    width: FLAME_SIZE,
    height: FLAME_SIZE,
  },
  // .warmup-flame-button-copy (line 4311)
  label: {
    ...textStyles.flameButtonCopy,
    color: '#111827',
    marginTop: s(10),
  },
});
