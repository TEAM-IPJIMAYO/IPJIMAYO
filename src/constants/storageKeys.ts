/**
 * Every `localStorage` key read/written in app.html, ported to
 * AsyncStorage keys. Grep source for `localStorage.setItem` /
 * `localStorage.getItem` to re-verify this list if the HTML changes.
 *
 * Source lines: 5781, 5785, 5798-5807, 6074-6076, 6311, 6444-6450, 6482,
 * 8126-8141, 8206, 8625.
 */
export const STORAGE_KEYS = {
  warmupType: 'warmupType', // 'scheduled' | 'always'
  warmupDurationSeconds: 'warmupDurationSeconds', // fixed to '10' in source
  analysisDurationSeconds: 'analysisDurationSeconds',
  monitorCheckDurationSeconds: 'monitorCheckDurationSeconds',
  warmupEndTime: 'warmupEndTime',
  scheduledTime: 'scheduledTime', // 'HH:MM' string, default '07:30'
  scheduledTimestamp: 'scheduledTimestamp',
  readySince: 'readySince',
  idleTimeoutAt: 'idleTimeoutAt',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
