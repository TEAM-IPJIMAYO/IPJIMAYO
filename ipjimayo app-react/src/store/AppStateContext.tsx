import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { DEFAULT_STATE, type AppState, type ScreenName } from '@/types/state';
import { hydratePersistedState, persistWarmup, setValue } from '@/services/storage';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { sendBleCommand } from '@/services/ble';
import { BLE_COMMANDS } from '@/constants/ble';
import { onboardingSlides } from '@/onboarding/slides';

/**
 * Port of the source's plain-object `state` + free functions
 * (goHome, startWarmup, completeWarmup, cancelWarmup, showIdleTimeout,
 * startDiagnosisAnalysis, completeAnalysis, switchMode, setScreen,
 * prevOnboarding/nextOnboarding/skipOnboarding/restartOnboarding,
 * openMenu/closeMenu, tick) — app.html lines 6079-6420, 8007-8055, 8203-8245.
 *
 * The source drives everything through a single mutable `state` object and
 * a `render()` call after each mutation. Here that becomes a reducer +
 * useReducer, with `dispatch` standing in for "mutate state, then render()".
 */

type Action =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'TICK'; now: number }
  | { type: 'GO_HOME' }
  | { type: 'START_WARMUP_BEGIN'; now: number }
  | { type: 'START_WARMUP_FAILED' }
  | { type: 'COMPLETE_WARMUP'; fromAlways?: boolean; now: number }
  | { type: 'CANCEL_WARMUP' }
  | { type: 'SHOW_IDLE_TIMEOUT' }
  | { type: 'START_DIAGNOSIS_ANALYSIS'; now: number }
  | { type: 'COMPLETE_ANALYSIS' }
  | { type: 'SWITCH_MODE'; mode: AppState['mode'] }
  | { type: 'SET_SCREEN'; screen: ScreenName }
  | { type: 'ONBOARDING_NEXT' }
  | { type: 'ONBOARDING_PREV' }
  | { type: 'ONBOARDING_SKIP' }
  | { type: 'ONBOARDING_RESTART' }
  | { type: 'OPEN_MENU' }
  | { type: 'CLOSE_MENU' }
  | { type: 'OPEN_SHEET'; sheet: NonNullable<AppState['sheet']> }
  | { type: 'CLOSE_SHEET' }
  | { type: 'SET_WARMUP_TYPE_ALWAYS'; now: number }
  | { type: 'SET_WARMUP_TYPE_SCHEDULED' }
  | { type: 'SET_SCHEDULED_TIME'; time: string; timestamp: number };

function isWarmupRunning(state: AppState, nowMs: number) {
  return Boolean(state.warmupEndTime) && state.warmupEndTime - nowMs > 0;
}
function isReadyActive(state: AppState, nowMs: number) {
  return Boolean(state.readySince) && (!state.idleTimeoutAt || nowMs < state.idleTimeoutAt);
}

/** Ported from remainingWarmupSeconds/remainingAnalysisSeconds (lines 6061-6066). */
export function remainingWarmupSeconds(state: AppState, nowMs: number) {
  if (!state.warmupEndTime) return 0;
  return Math.max(0, Math.ceil((state.warmupEndTime - nowMs) / 1000));
}
export function remainingAnalysisSeconds(state: AppState, nowMs: number) {
  if (!state.analysisEndTime) return 0;
  return Math.max(0, Math.ceil((state.analysisEndTime - nowMs) / 1000));
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload };

    case 'GO_HOME': {
      // Source: goHome() early-returns during 'analysis' (line 6294) and
      // redirects monitoring screens to resetMonitoringToAttach() — the
      // monitoring flow isn't ported yet (see README "What's not done"),
      // so we only guard the analysis case here.
      if (state.screen === 'analysis') return state;
      if (state.mode === 'monitoring') return state; // TODO: monitoring flow
      return { ...state, mode: 'diagnosis', screen: 'diagnosisHome' };
    }

    case 'START_WARMUP_BEGIN': {
      // Ported from startWarmup() app.html 6308-6320 — screen + timer are
      // committed immediately (optimistic), before the BLE ack.
      return {
        ...state,
        warmupDurationSeconds: 10,
        warmupEndTime: action.now + 10000,
        readySince: 0,
        idleTimeoutAt: 0,
        mode: 'diagnosis',
        screen: 'warmup',
      };
    }

    case 'START_WARMUP_FAILED':
      // Ported from startWarmup()'s failure branch, app.html 6328-6335.
      return { ...state, warmupEndTime: 0, screen: 'diagnosisHome' };

    case 'COMPLETE_WARMUP': {
      // Ported from completeWarmup(fromAlways), app.html 6339-6358.
      if (!action.fromAlways && state.screen === 'warmup' && state.warmupEndTime && action.now < state.warmupEndTime) {
        return state;
      }
      return {
        ...state,
        warmupEndTime: 0,
        readySince: action.now,
        idleTimeoutAt: state.warmupType === 'scheduled' ? action.now + state.readyIdleLimitSeconds * 1000 : 0,
        mode: 'diagnosis',
        screen: 'ready',
      };
    }

    case 'CANCEL_WARMUP':
      // Ported from cancelWarmup(), app.html 6360-6371.
      return { ...state, warmupEndTime: 0, readySince: 0, idleTimeoutAt: 0, screen: 'diagnosisHome' };

    case 'SHOW_IDLE_TIMEOUT':
      // Ported from showIdleTimeout(), app.html 6372-6382.
      if (state.warmupType !== 'scheduled') return state;
      return { ...state, warmupEndTime: 0, readySince: 0, idleTimeoutAt: 0, screen: 'timeout' };

    case 'START_DIAGNOSIS_ANALYSIS': {
      // Ported from startDiagnosisAnalysis(), app.html 6383-6394.
      if (state.onboardingPopupOpen || state.screen === 'warmup' || state.mode !== 'diagnosis') return state;
      return {
        ...state,
        warmupEndTime: 0,
        readySince: 0,
        idleTimeoutAt: 0,
        analysisContext: 'diagnosis',
        analysisEndTime: action.now + state.analysisDurationSeconds * 1000,
        screen: 'analysis',
      };
    }

    case 'COMPLETE_ANALYSIS': {
      // Ported from completeAnalysis(), app.html 6395-6406. Monitoring
      // branch (finishMonitoringAnalysis) is not ported yet.
      if (!state.analysisEndTime) return state;
      if (state.analysisContext === 'monitoring') return { ...state, analysisEndTime: 0 }; // TODO: monitoring
      return { ...state, analysisEndTime: 0, screen: 'result' };
    }

    case 'SWITCH_MODE': {
      // Ported from switchMode(), app.html 6245-6254.
      if (action.mode === 'monitoring') {
        return { ...state, mode: 'monitoring', screen: state.monitorMounted ? 'monitorWait' : 'monitorAttach' };
      }
      return { ...state, mode: 'diagnosis', screen: 'diagnosisHome' };
    }

    case 'SET_SCREEN':
      return { ...state, screen: action.screen };

    case 'TICK': {
      // Ported from tick(), app.html 8203-8232. Scheduled-warmup auto-start
      // and monitoring polling are left as TODOs (monitoring not ported).
      let next = state;
      if (next.warmupEndTime && action.now >= next.warmupEndTime) {
        next = reducer(next, { type: 'COMPLETE_WARMUP', now: action.now });
      }
      if (next.analysisEndTime && remainingAnalysisSeconds(next, action.now) <= 0) {
        next = reducer(next, { type: 'COMPLETE_ANALYSIS' });
      }
      if (next.warmupType === 'scheduled' && next.idleTimeoutAt && action.now >= next.idleTimeoutAt) {
        next = reducer(next, { type: 'SHOW_IDLE_TIMEOUT' });
      }
      return next;
    }

    case 'ONBOARDING_NEXT': {
      // Ported from nextOnboarding(), app.html 8013-8020.
      const isLast = state.onboardingIndex === onboardingSlides.length - 1;
      if (isLast) return { ...state, onboardingPopupOpen: false };
      return { ...state, onboardingIndex: state.onboardingIndex + 1 };
    }
    case 'ONBOARDING_PREV':
      // Ported from prevOnboarding(), app.html 8007-8012.
      return { ...state, onboardingIndex: Math.max(0, state.onboardingIndex - 1) };
    case 'ONBOARDING_SKIP':
      // Ported from skipOnboarding(), app.html 8021-8027.
      return { ...state, onboardingPopupOpen: false };
    case 'ONBOARDING_RESTART':
      // Ported from restartOnboarding(), app.html 8028-8038.
      return { ...state, onboardingPopupOpen: true, onboardingIndex: 0 };

    case 'OPEN_MENU':
      return { ...state, menuOpen: true };
    case 'CLOSE_MENU':
      return { ...state, menuOpen: false };
    case 'OPEN_SHEET':
      return { ...state, menuOpen: false, sheet: action.sheet };
    case 'CLOSE_SHEET':
      return { ...state, sheet: null };

    case 'SET_WARMUP_TYPE_ALWAYS': {
      // Ported from setWarmupType('always'), app.html 6480-6488: closes the
      // sheet, forces diagnosis mode, and immediately completes warmup
      // (fromAlways=true) so the user lands straight on 'ready'.
      const withType = { ...state, warmupType: 'always' as const, sheet: null, mode: 'diagnosis' as const };
      return reducer(withType, { type: 'COMPLETE_WARMUP', fromAlways: true, now: action.now });
    }
    case 'SET_WARMUP_TYPE_SCHEDULED': {
      // Ported from setWarmupType('scheduled') else-branch, app.html 6489-6498.
      const next: AppState = {
        ...state,
        warmupType: 'scheduled',
        readySince: 0,
        idleTimeoutAt: 0,
        warmupEndTime: 0,
      };
      if (next.screen === 'ready' || next.screen === 'warmup') {
        return { ...next, mode: 'diagnosis', screen: 'diagnosisHome' };
      }
      return next;
    }
    case 'SET_SCHEDULED_TIME':
      // Ported from scheduleTimeChanged(), app.html 6442-6452.
      return { ...state, scheduledTime: action.time, scheduledTimestamp: action.timestamp };

    default:
      return state;
  }
}

interface AppStateContextValue {
  state: AppState;
  now: number;
  goHome: () => void;
  startWarmup: () => Promise<void>;
  completeWarmup: (fromAlways?: boolean) => void;
  cancelWarmup: () => void;
  switchMode: (mode: AppState['mode']) => void;
  setScreen: (screen: ScreenName) => void;
  onboardingNext: () => void;
  onboardingPrev: () => void;
  onboardingSkip: () => void;
  onboardingRestart: () => void;
  openMenu: () => void;
  closeMenu: () => void;
  openSheet: (sheet: NonNullable<AppState['sheet']>) => void;
  closeSheet: () => void;
  setWarmupTypeAlways: () => void;
  setWarmupTypeScheduled: () => void;
  setScheduledTime: (time: string) => void;
  simulateAlarm: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    ...DEFAULT_STATE,
    // Placeholder defaults until hydratePersistedState() resolves; matches
    // the source's synchronous localStorage defaults as closely as async
    // storage allows (see services/storage.ts).
    warmupType: 'scheduled',
    warmupDurationSeconds: 10,
    analysisDurationSeconds: 40,
    monitorCheckDurationSeconds: 1800,
    warmupEndTime: 0,
    scheduledTime: '07:30',
    scheduledTimestamp: 0,
    readySince: 0,
    idleTimeoutAt: 0,
  } as AppState);

  const nowRef = useRef(Date.now());

  // Hydrate persisted fields once on mount (source: synchronous
  // localStorage reads baked into the initial `state` object literal).
  useEffect(() => {
    hydratePersistedState().then((persisted) => dispatch({ type: 'HYDRATE', payload: persisted }));
  }, []);

  // Ported from `setInterval(tick, 50)`, app.html line 8542.
  useEffect(() => {
    const id = setInterval(() => {
      nowRef.current = Date.now();
      dispatch({ type: 'TICK', now: nowRef.current });
    }, 50);
    return () => clearInterval(id);
  }, []);

  // Ported from persistWarmup() being called alongside every mutation that
  // touches warmupEndTime/readySince/idleTimeoutAt (app.html 6073-6078 and
  // every call site of it). Centralized here as a single effect instead of
  // scattering persistWarmup() calls through every action creator.
  useEffect(() => {
    persistWarmup({
      warmupEndTime: state.warmupEndTime,
      readySince: state.readySince,
      idleTimeoutAt: state.idleTimeoutAt,
    });
  }, [state.warmupEndTime, state.readySince, state.idleTimeoutAt]);

  const goHome = useCallback(() => {
    if (state.screen === 'analysis') return;
    dispatch({ type: 'GO_HOME' });
    // Ported from goHome()'s trailing sendBleCommand, app.html line 6303.
    sendBleCommand(BLE_COMMANDS.APP_STATE_DIAGNOSIS_HOME_COLD);
  }, [state.screen]);

  const startWarmup = useCallback(async () => {
    // Ported from startWarmup(), app.html 6308-6338: commit the screen +
    // timer optimistically, then send the BLE command; roll back on failure.
    const startedAt = Date.now();
    await setValue(STORAGE_KEYS.warmupDurationSeconds, '10');
    dispatch({ type: 'START_WARMUP_BEGIN', now: startedAt });
    const sent = await sendBleCommand(BLE_COMMANDS.START_WARMUP);
    if (!sent) {
      dispatch({ type: 'START_WARMUP_FAILED' });
    }
  }, []);

  const completeWarmup = useCallback((fromAlways?: boolean) => {
    dispatch({ type: 'COMPLETE_WARMUP', fromAlways, now: Date.now() });
  }, []);

  const cancelWarmup = useCallback(() => dispatch({ type: 'CANCEL_WARMUP' }), []);
  const switchMode = useCallback((mode: AppState['mode']) => dispatch({ type: 'SWITCH_MODE', mode }), []);
  const setScreen = useCallback((screen: ScreenName) => dispatch({ type: 'SET_SCREEN', screen }), []);
  const onboardingNext = useCallback(() => dispatch({ type: 'ONBOARDING_NEXT' }), []);
  const onboardingPrev = useCallback(() => dispatch({ type: 'ONBOARDING_PREV' }), []);
  const onboardingSkip = useCallback(() => dispatch({ type: 'ONBOARDING_SKIP' }), []);
  const onboardingRestart = useCallback(() => dispatch({ type: 'ONBOARDING_RESTART' }), []);
  const openMenu = useCallback(() => dispatch({ type: 'OPEN_MENU' }), []);
  const closeMenu = useCallback(() => dispatch({ type: 'CLOSE_MENU' }), []);
  const openSheet = useCallback((sheet: NonNullable<AppState['sheet']>) => dispatch({ type: 'OPEN_SHEET', sheet }), []);
  const closeSheet = useCallback(() => dispatch({ type: 'CLOSE_SHEET' }), []);

  const setWarmupTypeAlways = useCallback(async () => {
    await setValue(STORAGE_KEYS.warmupType, 'always');
    dispatch({ type: 'SET_WARMUP_TYPE_ALWAYS', now: Date.now() });
  }, []);
  const setWarmupTypeScheduled = useCallback(async () => {
    await setValue(STORAGE_KEYS.warmupType, 'scheduled');
    dispatch({ type: 'SET_WARMUP_TYPE_SCHEDULED' });
  }, []);
  const setScheduledTime = useCallback(async (time: string) => {
    // Ported from scheduleTimeChanged(), app.html 6442-6451: next
    // occurrence of HH:MM, rolled to tomorrow if already passed today.
    const value = time || '07:30';
    const [h, m] = value.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
    await Promise.all([setValue(STORAGE_KEYS.scheduledTime, value), setValue(STORAGE_KEYS.scheduledTimestamp, d.getTime())]);
    dispatch({ type: 'SET_SCHEDULED_TIME', time: value, timestamp: d.getTime() });
  }, []);
  const simulateAlarm = useCallback(() => {
    // Ported from simulateAlarm(), app.html 6455-6464.
    if (state.warmupType !== 'scheduled') return;
    dispatch({ type: 'CLOSE_SHEET' });
    dispatch({ type: 'CLOSE_MENU' });
    startWarmup();
  }, [state.warmupType, startWarmup]);

  // Re-render every tick so screens showing a live countdown (warmup,
  // analysis) update — mirrors the source's updateLiveDisplays() being
  // called from tick() (app.html 8150-8202).
  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      now: nowRef.current,
      goHome,
      startWarmup,
      completeWarmup,
      cancelWarmup,
      switchMode,
      setScreen,
      onboardingNext,
      onboardingPrev,
      onboardingSkip,
      onboardingRestart,
      openMenu,
      closeMenu,
      openSheet,
      closeSheet,
      setWarmupTypeAlways,
      setWarmupTypeScheduled,
      setScheduledTime,
      simulateAlarm,
    }),
    [
      state,
      goHome,
      startWarmup,
      completeWarmup,
      cancelWarmup,
      switchMode,
      setScreen,
      onboardingNext,
      onboardingPrev,
      onboardingSkip,
      onboardingRestart,
      openMenu,
      closeMenu,
      openSheet,
      closeSheet,
      setWarmupTypeAlways,
      setWarmupTypeScheduled,
      setScheduledTime,
      simulateAlarm,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

export { isWarmupRunning, isReadyActive };
