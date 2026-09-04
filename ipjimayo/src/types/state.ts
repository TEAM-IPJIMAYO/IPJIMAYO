/**
 * Ported from the `state` object literal in app.html (lines 5783-5836).
 * Field names and defaults are kept identical to the source so the state
 * machine logic (store/AppStateContext.tsx) can be diffed against the
 * original functions 1:1.
 */

export type Mode = 'diagnosis' | 'monitoring';

/**
 * Every value `state.screen` can take in the source. Grep app.html for
 * `state.screen = '...'` and `setScreen('...')` to re-verify this list.
 * (diagnosisHome, warmup, ready, analysis, result, timeout, monitorAttach,
 * monitorWait — per task rule #14 — plus monitorResult/monitorSetup type
 * screens rendered inline as part of monitorAttach/monitorWait's panels.)
 */
export type ScreenName =
  | 'diagnosisHome'
  | 'warmup'
  | 'ready'
  | 'analysis'
  | 'result'
  | 'timeout'
  | 'monitorAttach'
  | 'monitorWait';

export type WarmupType = 'scheduled' | 'always';

export type SheetName = 'settings' | 'help' | 'timeline' | null;

export interface MonitorAlerts {
  firstSent: boolean;
  finalSent: boolean;
  lastAlertHours: number;
  phoneSent: boolean;
}

export interface AppState {
  mode: Mode;
  warmupType: WarmupType;
  screen: ScreenName;

  onboardingPopupOpen: boolean;
  onboardingIndex: number;

  odorLevel: number;
  moistureRemaining: boolean;
  moistureValue: number;
  prevMoistureValue: number;
  temp: number;
  humidity: number;

  warmupDurationSeconds: number;
  analysisDurationSeconds: number;
  monitorCheckDurationSeconds: number;
  readyIdleLimitSeconds: number;

  warmupEndTime: number;
  analysisEndTime: number;
  analysisContext: 'diagnosis' | 'monitoring';

  scheduledTime: string;
  scheduledTimestamp: number;
  readySince: number;
  idleTimeoutAt: number;

  monitorMounted: boolean;
  monitorNextCheckAt: number;
  monitorCycleCount: number;
  monitorStagnationStart: number;
  monitorStagnationActive: boolean;
  monitorOdorDetected: boolean;
  monitorOdorLevel: number;
  monitorStagnationCycles: number;
  monitorStagnationCheckCount: number;
  monitorOdorHistory: number[];
  monitorOdorIncreaseCount: number;
  monitorAlertedIncreaseMarks: number[];
  monitorLastMeasuredOdor: number | null;
  monitorVocStartLogged: boolean;
  monitorEnded: boolean;
  monitorTimeline: unknown[];
  monitorAlerts: MonitorAlerts;
  monitorIncreaseStreak: number;

  menuOpen: boolean;
  sheet: SheetName;

  firebaseConnected: boolean;
  firebaseLastData: unknown;
  firebaseLastError: string;
  firebaseLastProcessedAt: number;

  monitorHasBaseline: boolean;
  monitorStartedAt: number;
  monitorInitialMoisture: number;
  monitorMoistureSamples: number[];
  monitorDryingEstimateMinutes: number | null;
  monitorVocPhase: 'idle' | string;
  monitorDryComplete: boolean;
  monitorRewashAlert: boolean;
  monitorHasResult: boolean;
  monitorLastResultAt: number;
  monitorPanelIndex: number;
  monitorSwipeHintSeen: boolean;
}

/**
 * Ported from the `state` initializer, app.html lines 5783-5836, minus the
 * localStorage-backed fields (those are hydrated async — see
 * services/storage.ts `hydratePersistedState`) and `demoOpen` (the source
 * ships without the demo control panel per this task's brief).
 */
export const DEFAULT_STATE: Omit<
  AppState,
  | 'warmupType'
  | 'warmupDurationSeconds'
  | 'analysisDurationSeconds'
  | 'monitorCheckDurationSeconds'
  | 'warmupEndTime'
  | 'scheduledTime'
  | 'scheduledTimestamp'
  | 'readySince'
  | 'idleTimeoutAt'
> = {
  mode: 'diagnosis',
  screen: 'diagnosisHome',
  onboardingPopupOpen: true,
  onboardingIndex: 0,
  odorLevel: 61,
  moistureRemaining: true,
  moistureValue: 68,
  prevMoistureValue: 76,
  temp: 24,
  humidity: 64,
  readyIdleLimitSeconds: 600,
  analysisEndTime: 0,
  analysisContext: 'diagnosis',
  monitorMounted: false,
  monitorNextCheckAt: 0,
  monitorCycleCount: 0,
  monitorStagnationStart: 0,
  monitorStagnationActive: false,
  monitorOdorDetected: false,
  monitorOdorLevel: 61,
  monitorStagnationCycles: 0,
  monitorStagnationCheckCount: 0,
  monitorOdorHistory: [],
  monitorOdorIncreaseCount: 0,
  monitorAlertedIncreaseMarks: [],
  monitorLastMeasuredOdor: null,
  monitorVocStartLogged: false,
  monitorEnded: false,
  monitorTimeline: [],
  monitorAlerts: { firstSent: false, finalSent: false, lastAlertHours: 0, phoneSent: false },
  monitorIncreaseStreak: 0,
  menuOpen: false,
  sheet: null,
  firebaseConnected: false,
  firebaseLastData: null,
  firebaseLastError: '',
  firebaseLastProcessedAt: 0,
  monitorHasBaseline: false,
  monitorStartedAt: 0,
  monitorInitialMoisture: 0,
  monitorMoistureSamples: [],
  monitorDryingEstimateMinutes: null,
  monitorVocPhase: 'idle',
  monitorDryComplete: false,
  monitorRewashAlert: false,
  monitorHasResult: false,
  monitorLastResultAt: 0,
  monitorPanelIndex: 0,
  monitorSwipeHintSeen: false,
};
