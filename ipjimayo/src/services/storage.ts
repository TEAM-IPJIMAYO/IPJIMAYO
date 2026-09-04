import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storageKeys';

/**
 * Thin wrapper matching the read-with-default pattern the source HTML uses
 * everywhere, e.g.:
 *   Number(localStorage.getItem('analysisDurationSeconds') || 40)
 *   localStorage.getItem('warmupType') || 'scheduled'
 *
 * AsyncStorage is async, unlike localStorage, so state hydration happens
 * once at app boot (see store/AppStateContext.tsx `hydrate()`) rather than
 * synchronously in an initializer object literal like the source does.
 */

export async function getString(key: string, fallback: string): Promise<string> {
  const v = await AsyncStorage.getItem(key);
  return v ?? fallback;
}

export async function getNumber(key: string, fallback: number): Promise<number> {
  const v = await AsyncStorage.getItem(key);
  const n = Number(v);
  return v != null && !Number.isNaN(n) ? n : fallback;
}

export async function setValue(key: string, value: string | number): Promise<void> {
  await AsyncStorage.setItem(key, String(value));
}

/**
 * Hydrates every persisted field the source `state` object reads from
 * localStorage at init (app.html lines 5783-5807), plus applies the
 * "always reset warmupDurationSeconds to 10" behavior from line 5781/6311/
 * 8625 (the demo fixed a 10s warmup regardless of any prior stored value).
 */
export async function hydratePersistedState() {
  // Source line 5781: localStorage.setItem('warmupDurationSeconds', '10');
  // Always forced to 10s on load — ported as-is, not a bug.
  await setValue(STORAGE_KEYS.warmupDurationSeconds, '10');

  const [
    warmupType,
    analysisDurationSeconds,
    monitorCheckDurationSeconds,
    warmupEndTime,
    scheduledTime,
    scheduledTimestamp,
    readySince,
    idleTimeoutAt,
  ] = await Promise.all([
    getString(STORAGE_KEYS.warmupType, 'scheduled'),
    getNumber(STORAGE_KEYS.analysisDurationSeconds, 40),
    getNumber(STORAGE_KEYS.monitorCheckDurationSeconds, 1800),
    getNumber(STORAGE_KEYS.warmupEndTime, 0),
    getString(STORAGE_KEYS.scheduledTime, '07:30'),
    getNumber(STORAGE_KEYS.scheduledTimestamp, 0),
    getNumber(STORAGE_KEYS.readySince, 0),
    getNumber(STORAGE_KEYS.idleTimeoutAt, 0),
  ]);

  return {
    warmupType: warmupType as 'scheduled' | 'always',
    warmupDurationSeconds: 10,
    analysisDurationSeconds,
    monitorCheckDurationSeconds,
    warmupEndTime,
    scheduledTime,
    scheduledTimestamp,
    readySince,
    idleTimeoutAt,
  };
}

/** Ported from persistWarmup() — app.html lines 6073-6077. */
export async function persistWarmup(params: {
  warmupEndTime: number;
  readySince: number;
  idleTimeoutAt: number;
}) {
  await Promise.all([
    setValue(STORAGE_KEYS.warmupEndTime, params.warmupEndTime || 0),
    setValue(STORAGE_KEYS.readySince, params.readySince || 0),
    setValue(STORAGE_KEYS.idleTimeoutAt, params.idleTimeoutAt || 0),
  ]);
}
