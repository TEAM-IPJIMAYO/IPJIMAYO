import React, { useCallback, useState } from 'react';
import { View, Image, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

const FLAME_IMG = require('../../assets/images/flame.png');

/**
 * Ported from flameSvgHTML() + its CSS (app.html lines 7441-7446,
 * 3954-3976, 4310).
 *
 * Source mechanic: two <img> of the SAME flame.png stacked absolutely.
 *   .warmup-flame-base-image { filter: grayscale(1) brightness(1.9); }
 *   .warmup-flame-fill-image {
 *     clip-path: inset(calc(100% - var(--flame-progress)) 0 0 0);
 *     transition: clip-path 1s linear;
 *   }
 * i.e. a faint grayscale/bright "unlit" outline sits underneath, and the
 * full-color image is revealed from the BOTTOM upward as --flame-progress
 * goes 0% -> 100%.
 *
 * React Native has no `filter` or `clip-path`. This ports the same visual
 * using two techniques:
 *  - "unlit" base: the same PNG rendered with reduced opacity. This is an
 *    approximation — true CSS grayscale+brightness(1.9) desaturates AND
 *    blows out the reds into a pale gray outline, which plain opacity
 *    doesn't fully replicate. A pixel-exact port needs a shader (e.g.
 *    react-native-skia's ColorFilter) — flagged as a follow-up in README.
 *  - "fill" reveal: an Animated.View with overflow:hidden whose height is
 *    animated as a percentage of the container, anchored to the bottom
 *    (an inner box the full height of the container, clipped by its
 *    shrinking/growing parent) so only the bottom `progress`% of the
 *    full-color image is visible — the RN equivalent of
 *    `clip-path: inset(calc(100% - p) 0 0 0)`.
 */
export function FlameProgress({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(100, progress));
  const [wrapHeight, setWrapHeight] = useState(0);

  const onWrapLayout = useCallback((e: LayoutChangeEvent) => {
    setWrapHeight(e.nativeEvent.layout.height);
  }, []);

  const fillStyle = useAnimatedStyle(() => ({
    // Source: transition: clip-path 1s linear
    height: withTiming(`${clamped}%`, { duration: 1000 }),
  }));

  return (
    <View style={styles.wrap} onLayout={onWrapLayout}>
      {/* .warmup-flame-base-image: grayscale(1) brightness(1.9) approximated via opacity */}
      <Image source={FLAME_IMG} style={[styles.image, styles.baseImage]} resizeMode="contain" />
      {/* .warmup-flame-fill-image: revealed bottom-up by --flame-progress */}
      <Animated.View style={[styles.fillClip, fillStyle]}>
        {/* Fixed to the measured wrap height so the image inside doesn't
            rescale as the clipping box shrinks/grows — matching clip-path
            behavior (the image stays full-size, only the visible window
            changes), instead of `height: 100%` which would rescale it. */}
        <View style={[styles.fillInner, { height: wrapHeight || undefined }]}>
          <Image source={FLAME_IMG} style={styles.image} resizeMode="contain" />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // .warmup-flame-progress (line 3954): relative, 100% x 100%,
  // filter: drop-shadow(0 17px 25px rgba(16,23,34,.12))
  wrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
    shadowColor: 'rgba(16,23,34,1)',
    shadowOpacity: 0.12,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 17 },
  },
  image: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  // Approximates filter: grayscale(1) brightness(1.9) — see file header note.
  baseImage: {
    opacity: 0.22,
  },
  fillClip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  fillInner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
