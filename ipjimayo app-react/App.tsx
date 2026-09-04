import 'react-native-gesture-handler';
import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import { colors } from '@/constants/colors';
import { AppStateProvider, useAppState } from '@/store/AppStateContext';

import { DiagnosisHomeScreen } from '@/screens/DiagnosisHomeScreen';
import { WarmupScreen } from '@/screens/WarmupScreen';
import { ReadyScreen } from '@/screens/ReadyScreen';
import { AnalysisScreen } from '@/screens/AnalysisScreen';
import { ResultScreen } from '@/screens/ResultScreen';
import { TimeoutScreen } from '@/screens/TimeoutScreen';

import { OnboardingModal } from '@/onboarding/OnboardingModal';
import { SideMenu } from '@/components/SideMenu';
import { BottomSheet } from '@/components/BottomSheet';
import { SettingsSheet } from '@/components/SettingsSheet';
import { HelpSheet } from '@/components/HelpSheet';
import { TimelineSheet } from '@/components/TimelineSheet';

void SplashScreen.preventAutoHideAsync();

/**
 * Ported from the `#app` mount target + `render()` dispatcher (app.html
 * ~lines 6830-6852), which swaps innerHTML based on `state.screen`.
 *
 * Screens NOT ported yet (자동 확인 / monitoring flow — monitorAttach,
 * monitorWait) fall back to the diagnosis home screen rather than
 * rendering nothing; see README "What's not done".
 */
function ScreenSwitcher() {
  const { state } = useAppState();

  switch (state.screen) {
    case 'diagnosisHome':
      return <DiagnosisHomeScreen />;
    case 'warmup':
      return <WarmupScreen />;
    case 'ready':
      return <ReadyScreen />;
    case 'analysis':
      return <AnalysisScreen />;
    case 'result':
      return <ResultScreen />;
    case 'timeout':
      return <TimeoutScreen />;
    case 'monitorAttach':
    case 'monitorWait':
      // TODO: 자동 확인 (monitoring) flow — not ported yet.
      return <DiagnosisHomeScreen />;
    default:
      return <DiagnosisHomeScreen />;
  }
}

/** Ported from the `#sheetDim` / individual `.bottom-sheet` sections. */
function Sheets() {
  const { state, closeSheet } = useAppState();
  return (
    <BottomSheet visible={state.sheet != null} onClose={closeSheet}>
      {state.sheet === 'settings' && <SettingsSheet />}
      {state.sheet === 'help' && <HelpSheet />}
      {state.sheet === 'timeline' && <TimelineSheet />}
    </BottomSheet>
  );
}

function Root() {
  return (
    <View style={styles.phone}>
      <ScreenSwitcher />
      <OnboardingModal />
      <SideMenu />
      <Sheets />
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    // See src/constants/typography.ts for the weight -> family mapping
    // this app relies on. Drop the corresponding Pretendard static .otf
    // files into assets/fonts/ (not included in this port — see README)
    // before shipping; until then expo-font simply falls back to the
    // platform default and layout math (letterSpacing etc.) stays correct.
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
    'Pretendard-Black': require('./assets/fonts/Pretendard-Black.otf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.flex} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppStateProvider>
          <Root />
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // Ported from `.phone` (app.html lines 49-56): the reference HTML's
  // fixed-width "device frame". On a real phone this is just the full
  // window; the 430px reference is used for scaling (see utils/scale.ts),
  // not as a literal container width here.
  phone: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
