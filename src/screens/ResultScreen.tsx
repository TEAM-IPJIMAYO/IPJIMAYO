import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, shadows } from '@/constants/colors';
import { s } from '@/utils/scale';
import { Screen } from '@/components/Screen';
import { IconHome } from '@/components/icons';
import { LedRing } from '@/components/LedRing';
import { SmellStageMeter } from '@/components/SmellStageMeter';
import { MoistureDrops } from '@/components/MoistureDrops';
import { EnvCompareCard, envTipInfo } from '@/components/EnvCompareCard';
import { useAppState } from '@/store/AppStateContext';
import { classifyResult, buildCautionMoistContent, buildDiagnosisSummary } from '@/utils/resultLogic';
import { clamp } from '@/utils/format';

/**
 * Ported from renderResult(), app.html lines 7753-7818.
 *
 * NOTE ON SCOPE: this ports the non-Firebase branch only (i.e. `state.
 * firebaseLastData` is falsy — the path this demo actually runs in, since
 * BLE/Firebase are both stubbed per UI_EDIT_WITHOUT_BLUETOOTH). The
 * Firebase-driven `getAppDiagnosis()` branch, and the seven per-result-code
 * center illustrations from resultSceneHTML() (shine sweep + sparkles for
 * "clean", falling drops for "drying", odor clouds for "caution", the
 * shirt-into-basket animation for "basket"/"rewash", etc. — app.html
 * ~7637-7690) are NOT yet ported; the center visual here is a placeholder
 * shirt emoji inside the LED ring. See README "What's not done".
 */
export function ResultScreen() {
  const { state, goHome } = useAppState();

  const moistureExists = state.moistureRemaining;
  const meterValue = clamp(state.odorLevel, 0, 100);
  const temp = state.temp;
  const humidity = state.humidity;

  const result = classifyResult(meterValue, moistureExists);
  const tip = envTipInfo(temp, humidity);

  let title = result.title;
  let message = result.message;
  if (result.code === 'cautionMoist') {
    const c = buildCautionMoistContent(temp, humidity);
    title = c.title;
    message = c.message;
  }
  const showTip = moistureExists && result.code !== 'rewash' && result.code !== 'cautionMoist';

  const moistureRaw = moistureExists ? state.moistureValue : 0;
  const filledDrops = moistureExists ? clamp(Math.round((Number(moistureRaw) || 0) / 20), 1, 5) : 0;
  const summaryLines = buildDiagnosisSummary(meterValue, filledDrops);

  const ringSize = s(210);

  return (
    <Screen scroll>
      <View style={[styles.card, { borderColor: 'rgba(230,234,240,0.8)' }]}>
        <Pressable style={styles.homeBtn} onPress={goHome} accessibilityLabel="홈으로">
          <IconHome size={s(18)} strokeWidth={2.6} />
        </Pressable>

        <View style={styles.summaryWrap}>
          {summaryLines.map((line, i) => (
            <Text key={i} style={styles.summaryLine}>
              {line}
            </Text>
          ))}
        </View>

        <View style={styles.visualWrap}>
          <LedRing color={result.color} size={ringSize} />
          <Text style={styles.centerShirt}>👕</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{message}</Text>

        <SmellStageMeter value={meterValue} />
        <MoistureDrops filledDrops={filledDrops} />
        <EnvCompareCard temp={temp} humidity={humidity} showTip={showTip} tip={tip} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // .result-card (line 206)
  card: {
    marginTop: s(14),
    borderRadius: s(34),
    backgroundColor: colors.card,
    paddingTop: s(28),
    paddingHorizontal: s(22),
    paddingBottom: s(24),
    alignItems: 'center',
    borderWidth: 1,
    ...shadows.card,
  },
  // .result-home-btn (line 218)
  homeBtn: {
    position: 'absolute',
    top: s(14),
    left: s(14),
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  // .result-diagnosis-summary (line 225)
  summaryWrap: {
    marginTop: s(2),
    maxWidth: s(370),
    paddingHorizontal: s(18),
  },
  summaryLine: {
    fontSize: s(20),
    lineHeight: s(27),
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  // .result-visual-wrap (line 318)
  visualWrap: {
    width: s(210),
    height: s(210),
    marginTop: s(16),
    marginBottom: s(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerShirt: {
    position: 'absolute',
    fontSize: s(78),
  },
  // .result-title.only (line 250)
  title: {
    fontSize: s(21),
    fontWeight: '900',
    color: colors.text,
    marginTop: s(20),
    marginBottom: s(6),
    textAlign: 'center',
  },
  // .result-subtitle (line 248)
  subtitle: {
    fontSize: s(17),
    lineHeight: s(25),
    color: colors.muted,
    textAlign: 'center',
    maxWidth: s(330),
  },
});
