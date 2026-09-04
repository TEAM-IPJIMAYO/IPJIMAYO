import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { s } from '@/utils/scale';
import { useAppState } from '@/store/AppStateContext';
import { onboardingSlides } from '@/onboarding/slides';
import { ModesOverviewBody } from '@/onboarding/ModesOverviewBody';
import { PendingSlideBody } from '@/onboarding/PendingSlideBody';

/**
 * Ported from renderOnboardingPopup(), app.html lines 7405-7431, and its
 * chrome CSS (.onboarding-popup-dim / .onboarding-popup-card /
 * .onboard-popup-top / .onboard-popup-scroll / .popup-bottom / .page-dots
 * / .onboard-actions — lines 470-620).
 *
 * Slide bodies: only `modesOverview` (slide 1) is fully ported — see
 * ModesOverviewBody.tsx. The other six slide types (deviceOverview,
 * environment, diagnosisPrepFull, diagnosisResultFull, monitoringSetup,
 * monitoringResult) render via PendingSlideBody, which shows the real
 * title/description/mode-tag from source (see onboarding/slides.ts) but a
 * placeholder where the custom illustration goes. See README.
 */
export function OnboardingModal() {
  const { state, onboardingNext, onboardingPrev, onboardingSkip } = useAppState();
  const insets = useSafeAreaInsets();

  if (!state.onboardingPopupOpen) return null;

  const slide = onboardingSlides[state.onboardingIndex];
  const isFirst = state.onboardingIndex === 0;
  const isLast = state.onboardingIndex === onboardingSlides.length - 1;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.dim}>
        <View
          style={[
            styles.card,
            { maxHeight: 820, marginTop: insets.top + s(18), marginBottom: insets.bottom + s(18) },
          ]}
          accessibilityRole="none"
          accessibilityLabel="입지마요 첫 사용 안내"
        >
          <View style={styles.top}>
            <Text style={[styles.link, isFirst ? styles.linkHidden : null]} onPress={onboardingPrev}>
              이전
            </Text>
            <Pressable onPress={onboardingSkip}>
              <Text style={styles.link}>건너뛰기</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View>
              {slide.modeLabel ? (
                <View style={styles.modeTag}>
                  <Text style={styles.modeTagText}>{slide.modeLabel}</Text>
                </View>
              ) : null}
              {slide.title ? (
                <Text
                  style={[
                    styles.question,
                    ['monitoringSetup', 'monitoringResult', 'modesOverview'].includes(slide.type) && styles.questionCompact,
                  ]}
                >
                  {slide.title}
                </Text>
              ) : null}
              {slide.desc ? <Text style={styles.desc}>{slide.desc}</Text> : null}
              <View style={styles.bodyWrap}>
                {slide.type === 'modesOverview' ? <ModesOverviewBody /> : <PendingSlideBody type={slide.type} />}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.bottom, { paddingBottom: s(18) + insets.bottom }]}>
            <View style={styles.dots}>
              {onboardingSlides.map((_, i) => (
                <View key={i} style={[styles.dot, i === state.onboardingIndex && styles.dotActive]} />
              ))}
            </View>
            <View style={styles.actions}>
              {!isFirst && (
                <Pressable style={styles.secondaryBtn} onPress={onboardingPrev}>
                  <Text style={styles.secondaryBtnText}>이전</Text>
                </Pressable>
              )}
              <Pressable style={styles.primaryBtn} onPress={onboardingNext}>
                <Text style={styles.primaryBtnText}>{isLast ? '시작하기' : '다음'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // .onboarding-popup-dim (line 470): rgba(16,23,34,.46) + blur(8px)
  dim: {
    flex: 1,
    backgroundColor: 'rgba(16,23,34,0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: s(18),
  },
  // .onboarding-popup-card (line 482)
  card: {
    width: '100%',
    maxWidth: 430,
    borderRadius: s(34),
    backgroundColor: colors.card,
    overflow: 'hidden',
    flex: 1,
  },
  // .onboard-popup-top (line 507)
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingTop: s(16),
    paddingBottom: s(8),
  },
  // .onboard-link (source ~line 620s, reused pattern)
  link: {
    color: '#8B95A1',
    fontWeight: '700',
    fontSize: s(15),
  },
  linkHidden: {
    opacity: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(16),
    paddingVertical: s(6),
  },
  // .onboard-mode-tag (line 1027)
  modeTag: {
    alignSelf: 'flex-start',
    marginBottom: s(10),
    paddingVertical: s(6),
    paddingHorizontal: s(13),
    borderRadius: 999,
    backgroundColor: '#111827',
  },
  modeTagText: {
    color: '#fff',
    fontSize: s(12),
    fontWeight: '900',
  },
  // .onboarding-popup-card .onboard-question (line 549)
  question: {
    fontSize: s(29),
    marginTop: s(2),
    fontWeight: '900',
    color: colors.text,
    letterSpacing: s(29) * -0.075,
  },
  questionCompact: {
    fontSize: s(19),
    letterSpacing: s(19) * -0.06,
  },
  // .onboarding-popup-card .onboard-desc (line 559)
  desc: {
    fontSize: s(15),
    marginBottom: s(15),
    color: colors.muted,
    lineHeight: s(21),
  },
  bodyWrap: {
    marginTop: s(4),
  },
  // .popup-bottom (line 564)
  bottom: {
    paddingHorizontal: s(18),
    paddingTop: s(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(230,234,240,0.75)',
  },
  // .page-dots (line ~ , .dot)
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: s(8),
    marginBottom: s(12),
  },
  dot: {
    width: s(8),
    height: s(8),
    borderRadius: 999,
    backgroundColor: '#D8DEE8',
  },
  dotActive: {
    width: s(28),
    backgroundColor: colors.accent,
  },
  actions: {
    flexDirection: 'row',
    gap: s(10),
  },
  // .secondary-btn
  secondaryBtn: {
    flex: 0.72,
    borderRadius: 999,
    paddingVertical: s(14),
    paddingHorizontal: s(18),
    backgroundColor: '#EFF2F6',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#4B5563',
    fontWeight: '800',
  },
  // .primary-btn
  primaryBtn: {
    flex: 1.28,
    borderRadius: 999,
    paddingVertical: s(16),
    paddingHorizontal: s(24),
    backgroundColor: colors.accent2,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#0E161F',
    fontWeight: '900',
  },
});
