import React from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { s } from '@/utils/scale';

/**
 * Ported from `.bottom-sheet` / `.sheet-dim` / `.grabber` CSS (app.html
 * lines 1264, 1273-1274). Source slides up via `transform: translateY`;
 * approximated with Modal's native slide animation.
 */
export function BottomSheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="닫기 배경" />
      <View style={[styles.sheet, { paddingBottom: s(28) + insets.bottom }]}>
        <View style={styles.grabber} />
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16,23,34,0.42)',
  },
  // .bottom-sheet (line 1273): radius 34 34 0 0, max-height 84%
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '84%',
    backgroundColor: colors.card,
    borderTopLeftRadius: s(34),
    borderTopRightRadius: s(34),
    paddingHorizontal: s(24),
    paddingTop: s(18),
    shadowColor: 'rgba(16,23,34,1)',
    shadowOpacity: 0.18,
    shadowRadius: 70,
    shadowOffset: { width: 0, height: -20 },
    elevation: 12,
  },
  // .grabber (line 1276)
  grabber: {
    width: s(50),
    height: s(7),
    borderRadius: 999,
    backgroundColor: '#E1E5EC',
    alignSelf: 'center',
    marginBottom: s(26),
  },
});
