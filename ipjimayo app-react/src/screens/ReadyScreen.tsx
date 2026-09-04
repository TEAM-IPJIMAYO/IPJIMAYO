import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows } from '@/constants/colors';
import { textStyles } from '@/constants/typography';
import { s } from '@/utils/scale';
import { AppHeader } from '@/components/AppHeader';
import { Screen } from '@/components/Screen';
import { IconCheck } from '@/components/icons';

/**
 * Ported from renderReady(), app.html lines 7507-7520. Copy preserved
 * exactly: "기기 준비 완료!" / "이제 기기를 옷감에 가까이 대고,<br>기기의
 * 측정 버튼을 눌러주세요." + a 👕 shirt emoji (source keeps this as a
 * deliberate emoji per task rule #7, not a CSS illustration).
 */
export function ReadyScreen() {
  return (
    <Screen scroll>
      <AppHeader showToggle={false} />

      <View style={styles.readyVisual}>
        <View style={styles.checkBig}>
          <IconCheck size={s(48)} color="#0E161F" strokeWidth={3} />
        </View>
      </View>

      <View style={styles.center}>
        <Text style={styles.title}>기기 준비 완료!</Text>
        <Text style={styles.subtitle}>
          이제 기기를 옷감에 가까이 대고,{'\n'}기기의 측정 버튼을 눌러주세요.
        </Text>
        <Text style={styles.shirt}>👕</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  // .ready-visual (line 185)
  readyVisual: {
    marginTop: s(96),
    marginBottom: s(34),
    alignItems: 'center',
  },
  // .check-big (line 186)
  checkBig: {
    width: s(112),
    height: s(112),
    borderRadius: s(56),
    backgroundColor: colors.accent2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.accentSoft,
  },
  title: { ...textStyles.title, color: colors.text, textAlign: 'center' },
  subtitle: {
    ...textStyles.subtitle,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: s(340),
  },
  // .shirt (line 189)
  shirt: {
    fontSize: s(62),
    marginTop: s(22),
  },
});
