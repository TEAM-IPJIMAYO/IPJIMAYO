import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { colors } from '@/constants/colors';
import { s } from '@/utils/scale';
import { IconX } from '@/components/icons';
import { useAppState } from '@/store/AppStateContext';

/**
 * Ported from renderHelp(), app.html lines 8097-8117, and `.usage-grid` /
 * `.usage-card` / `.video-wrap` CSS (lines 1285-1290).
 *
 * Source references `assets/howto.mp4` (app.html: `<source
 * src="assets/howto.mp4">`). Per task rule #21: this file was NOT
 * provided alongside the HTML, so per the explicit instruction ("영상
 * 파일이 제공되지 않은 경우 임의 영상을 생성하거나 다른 영상을 넣지
 * 말고, `assets/howto.mp4가 필요함`이라고 명확하게 표시하세요"), the
 * player renders a clearly-labeled placeholder instead of a fake video.
 * Drop the real file at assets/videos/howto.mp4 and swap the placeholder
 * for `require('../../assets/videos/howto.mp4')` to complete this.
 */
const HOWTO_VIDEO_AVAILABLE = false;
// const HOWTO_VIDEO = require('../../assets/videos/howto.mp4');

export function HelpSheet() {
  const { closeSheet, onboardingRestart } = useAppState();

  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.headTitle}>도움말</Text>
        <Pressable onPress={closeSheet} accessibilityLabel="도움말 닫기" hitSlop={8}>
          <IconX size={s(24)} strokeWidth={2.4} />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>활용 안내 다시 보기</Text>
      <View style={styles.usageGrid}>
        <View style={styles.usageCard}>
          <Text style={styles.usageEmoji}>💨</Text>
          <Text style={styles.usageTitle}>세탁 전 환경 확인</Text>
          <Text style={styles.usageDesc}>하얀 LED로 실내 건조 적합 여부를 확인해요.</Text>
        </View>
        <View style={styles.usageCard}>
          <Text style={styles.usageEmoji}>👕</Text>
          <Text style={styles.usageTitle}>착용 가능 진단</Text>
          <Text style={styles.usageDesc}>10초 예열 후 팬을 7초 작동하고 CSV 학습값으로 수분을 예측해요.</Text>
        </View>
        <View style={styles.usageCard}>
          <Text style={styles.usageEmoji}>🧺</Text>
          <Text style={styles.usageTitle}>건조 모니터링</Text>
          <Text style={styles.usageDesc}>옷걸이 크래들에 장착하고 물리 버튼으로 시작해요.</Text>
        </View>
        <Pressable
          style={styles.usageCard}
          onPress={() => {
            closeSheet();
            onboardingRestart();
          }}
        >
          <Text style={styles.usageEmoji}>?</Text>
          <Text style={styles.usageTitle}>팝업 다시 보기</Text>
          <Text style={styles.usageDesc}>처음 안내 화면을 다시 열어요.</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>예시 사용법 영상</Text>
      <View style={styles.videoWrap}>
        {HOWTO_VIDEO_AVAILABLE ? (
          <Video
            source={{ uri: 'REPLACE_WITH_LOCAL_REQUIRE' }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlaceholderText}>assets/howto.mp4가 필요함</Text>
          </View>
        )}
      </View>
      <Text style={styles.smallHelp}>예열, 측정, 결과 확인 과정을 영상으로 확인할 수 있어요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s(26) },
  headTitle: { fontSize: s(28), fontWeight: '800', color: colors.text },
  sectionTitle: { fontSize: s(19), fontWeight: '900', color: colors.text, marginTop: s(24), marginBottom: s(12) },
  usageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: s(12) },
  usageCard: {
    width: '47%',
    backgroundColor: '#EEF2F8',
    borderRadius: s(24),
    minHeight: s(128),
    padding: s(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  usageEmoji: { fontSize: s(40) },
  usageTitle: { fontSize: s(18), fontWeight: '700', color: colors.text, marginTop: s(6), textAlign: 'center' },
  usageDesc: { fontSize: s(13), color: colors.muted, marginTop: s(8), textAlign: 'center', lineHeight: s(17) },
  videoWrap: {
    borderRadius: s(20),
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    backgroundColor: '#111827',
  },
  video: { width: '100%', height: '100%' },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  videoPlaceholderText: { color: '#fff', fontWeight: '700' },
  smallHelp: { fontSize: s(13), color: colors.muted, lineHeight: s(19), marginTop: s(10) },
});
