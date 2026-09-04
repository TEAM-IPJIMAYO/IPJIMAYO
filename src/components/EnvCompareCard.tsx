import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { s } from '@/utils/scale';

/** Ported from envTipInfo(), app.html lines 7691-7699. */
export function envTipInfo(temp: number, humidity: number): { icon: string; text: string } {
  const tempLow = Number.isFinite(temp) && temp < 18;
  const humidityHigh = Number.isFinite(humidity) && humidity >= 60;
  if (tempLow && humidityHigh) {
    return { icon: '🥶💦', text: '실내가 건조되기 어려운 환경입니다. 난방과 제습기를 함께 사용하면 건조 시간을 줄일 수 있어요.' };
  }
  if (!tempLow && humidityHigh) {
    return { icon: '💦', text: '습도가 높아 건조가 평소보다 느립니다. 제습기나 환기를 활용해 보세요.' };
  }
  if (tempLow && !humidityHigh) {
    return { icon: '🥶', text: '실내 온도가 낮아 건조 속도가 다소 느릴 수 있습니다. 조금 더 따뜻한 환경에서 건조하면 도움이 됩니다.' };
  }
  return { icon: '🌤️', text: '건조하기 딱 좋은 환경입니다! 지금처럼 유지하면 곧 착용할 수 있어요.' };
}

/**
 * Ported from renderEnvCompareCard(), app.html lines 7723-7752, and its
 * CSS (.env-card / .env-compare-cols etc., lines 429-451).
 */
export function EnvCompareCard({
  temp,
  humidity,
  showTip,
  tip,
}: {
  temp: number;
  humidity: number;
  showTip: boolean;
  tip: { icon: string; text: string };
}) {
  // Source: temp flag ▲ if >26 (red), ▼ if <18 (blue); humidity flag ▲ if >50 (red), ▼ if <40 (blue)
  const tempOver = Number.isFinite(temp) && temp > 26;
  const tempUnder = Number.isFinite(temp) && temp < 18;
  const humidityOver = Number.isFinite(humidity) && humidity > 50;
  const humidityUnder = Number.isFinite(humidity) && humidity < 40;

  return (
    <View style={styles.card}>
      <View style={styles.cols}>
        <View style={styles.col}>
          <Text style={styles.colTitle}>현재 건조 환경</Text>
          <View style={styles.item}>
            <Text style={styles.label}>🌡️ 온도</Text>
            <Text style={styles.value}>
              {temp ?? '-'}℃
              {tempOver && <Text style={styles.flagOver}> ▲</Text>}
              {tempUnder && <Text style={styles.flagUnder}> ▼</Text>}
            </Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.label}>💦 습도</Text>
            <Text style={styles.value}>
              {humidity ?? '-'}%
              {humidityOver && <Text style={styles.flagOver}> ▲</Text>}
              {humidityUnder && <Text style={styles.flagUnder}> ▼</Text>}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.col}>
          <Text style={[styles.colTitle, styles.recommendTitle]}>💡 권장 건조 환경</Text>
          <View style={styles.item}>
            <Text style={styles.label}>🌡️ 온도</Text>
            <Text style={styles.valueSmall}>
              18~22°C(겨울){'\n'}24~26°C(여름)
            </Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.label}>💦 습도</Text>
            <Text style={styles.valueSmall}>40-50%</Text>
          </View>
        </View>
      </View>
      {showTip && (
        <View style={styles.tip}>
          <Text style={styles.tipIcon}>{tip.icon}</Text>
          <Text style={styles.tipText}>{tip.text}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // .env-card.env-compare-merged (lines 429, 446): radius 22, bg #F4F7FA, padding 18 16
  card: {
    marginTop: s(18),
    borderRadius: s(22),
    backgroundColor: '#F4F7FA',
    padding: s(18),
  },
  // .env-compare-cols (line 441)
  cols: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  col: {
    flex: 1,
    gap: s(12),
  },
  divider: {
    width: 1,
    backgroundColor: colors.line,
    marginHorizontal: s(16),
  },
  colTitle: {
    fontSize: s(14),
    fontWeight: '800',
    color: colors.muted,
    marginBottom: s(2),
  },
  recommendTitle: {
    color: '#0A66C2',
  },
  item: {
    gap: s(6),
  },
  label: {
    fontSize: s(13),
    fontWeight: '700',
    color: colors.muted,
  },
  value: {
    fontSize: s(20),
    fontWeight: '900',
    color: colors.text,
  },
  valueSmall: {
    fontSize: s(13),
    fontWeight: '800',
    color: colors.text,
    lineHeight: s(17),
  },
  flagOver: {
    color: colors.red,
    fontWeight: '900',
    fontSize: s(13),
  },
  flagUnder: {
    color: colors.blue,
    fontWeight: '900',
    fontSize: s(13),
  },
  // .env-tip (line 439)
  tip: {
    marginTop: s(14),
    paddingTop: s(14),
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderStyle: 'dashed',
    flexDirection: 'row',
    gap: s(8),
  },
  tipIcon: {
    fontSize: s(16),
  },
  tipText: {
    flex: 1,
    fontSize: s(13.5),
    lineHeight: s(20),
    color: '#4B5563',
  },
});
