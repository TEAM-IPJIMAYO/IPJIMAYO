import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { s } from '@/utils/scale';
import { IconMenu, IconHome } from '@/components/icons';
import { ModeToggle } from '@/components/ModeToggle';
import { useAppState } from '@/store/AppStateContext';

/**
 * Ported from buildHeader(), app.html lines 6227-6235.
 *
 * Source logic:
 *   left = homeLike(!forceHome) ? menu-icon(openMenu) : home-icon(goHome)
 *   homeLike = screen is 'diagnosisHome' or 'monitorAttach'
 *   analysisLike (screen === 'analysis') disables the home icon
 */
export function AppHeader({ showToggle = true, forceHome = false }: { showToggle?: boolean; forceHome?: boolean }) {
  const { state, openMenu, goHome } = useAppState();
  const homeLike = state.screen === 'diagnosisHome' || state.screen === 'monitorAttach';
  const analysisLike = state.screen === 'analysis';
  const showMenu = homeLike && !forceHome;

  return (
    <View style={styles.topbar}>
      <View style={styles.side}>
        {showMenu ? (
          <Pressable
            accessibilityLabel="메뉴 열기"
            onPress={openMenu}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <IconMenu />
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel="홈으로"
            onPress={goHome}
            disabled={analysisLike}
            style={[styles.iconBtn, styles.iconBtnCircle, analysisLike && styles.iconBtnDisabled]}
            hitSlop={8}
          >
            <IconHome />
          </Pressable>
        )}
      </View>
      <View style={styles.center}>{showToggle ? <ModeToggle /> : null}</View>
      <View style={styles.side} />
    </View>
  );
}

// .topbar (app.html line 74): height 76px, grid-template-columns 54px 1fr 54px
const styles = StyleSheet.create({
  topbar: {
    height: s(76),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    zIndex: 30,
  },
  side: {
    width: s(54),
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  // .icon-btn (app.html line 83): 46x46, border-radius 999
  iconBtn: {
    width: s(46),
    height: s(46),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // .icon-btn.circle (line 90): white bg, border, shadow
  iconBtnCircle: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: 'rgba(16,23,34,1)',
    shadowOpacity: 0.06,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  // .icon-btn.disabled (line 92): opacity .28
  iconBtnDisabled: {
    opacity: 0.28,
  },
});
