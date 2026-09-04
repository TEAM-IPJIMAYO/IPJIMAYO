import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { s } from '@/utils/scale';
import { IconX, IconGear, IconHelp } from '@/components/icons';
import { useAppState } from '@/store/AppStateContext';

/**
 * Ported from the `#sideMenu` <aside> markup (app.html lines 5742-5750)
 * and `.side-menu` / `.menu-dim` / `.side-head` / `.menu-item` CSS (lines
 * 1264-1271). Source slides in from the left via `transform: translateX`;
 * Modal's slide animationType approximates this well enough for a
 * left-edge drawer without pulling in a gesture-driven Reanimated drawer.
 */
export function SideMenu() {
  const { state, closeMenu, openSheet } = useAppState();
  const insets = useSafeAreaInsets();

  if (!state.menuOpen) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={closeMenu}>
      <Pressable style={styles.dim} onPress={closeMenu} accessibilityLabel="메뉴 닫기 배경" />
      <View style={[styles.menu, { paddingTop: insets.top + s(28), paddingBottom: insets.bottom + s(28) }]}>
        <View style={styles.head}>
          <Text style={styles.headTitle}>메뉴</Text>
          <Pressable onPress={closeMenu} accessibilityLabel="메뉴 닫기" hitSlop={8}>
            <IconX size={s(34)} strokeWidth={2.4} />
          </Pressable>
        </View>

        <Pressable style={styles.item} onPress={() => openSheet('settings')}>
          <IconGear size={s(30)} color="#6B7280" />
          <Text style={styles.itemText}>설정</Text>
        </Pressable>
        <Pressable style={styles.item} onPress={() => openSheet('help')}>
          <IconHelp size={s(30)} color="#6B7280" />
          <Text style={styles.itemText}>도움말</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16,23,34,0.42)',
  },
  // .side-menu (line 1266): 74% width, max 310px
  menu: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '74%',
    maxWidth: 310,
    backgroundColor: colors.card,
    paddingHorizontal: s(26),
    shadowColor: 'rgba(16,23,34,1)',
    shadowOpacity: 0.14,
    shadowRadius: 60,
    shadowOffset: { width: 20, height: 0 },
    elevation: 10,
  },
  // .side-head (line 1268)
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s(54),
  },
  headTitle: {
    fontSize: s(26),
    fontWeight: '800',
    color: colors.text,
  },
  // .menu-item (line 1270)
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(18),
    width: '100%',
    paddingVertical: s(18),
    paddingHorizontal: s(8),
  },
  itemText: {
    fontSize: s(24),
    fontWeight: '700',
    color: colors.text,
  },
});
