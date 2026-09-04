/**
 * ESP32 BLE protocol constants, ported verbatim from app.html lines
 * 8546-9026 (the "ESP32 Web Bluetooth 연결" script block).
 *
 * These MUST stay byte-for-byte identical to the firmware's expectations —
 * do not "clean up" or rename any of these strings.
 */

/** Nordic UART Service (NUS) UUIDs — app.html lines 8552-8556. */
export const IPJIMAYO_BLE = {
  serviceUuid: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  rxUuid: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  txUuid: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
} as const;

/** The advertised device name the app filters for (app.html line 8949). */
export const BLE_DEVICE_NAME = 'IPJIMAYO';

/**
 * Compact single-message state codes the firmware sends to avoid BLE
 * notification size limits — app.html lines 8593-8599.
 */
export const COMPACT_STATE_MAP: Record<string, string> = {
  'D:C': 'STATE:DIAGNOSIS_COLD',
  'D:W': 'STATE:DIAGNOSIS_PREHEATING',
  'D:R': 'STATE:DIAGNOSIS_READY',
  'D:M': 'STATE:DIAGNOSIS_MEASURING',
  'D:S': 'STATE:DIAGNOSIS_READY_SILENT',
};

/** Full state message identifiers (post compact-map translation). */
export const BLE_STATE = {
  DIAGNOSIS_COLD: 'STATE:DIAGNOSIS_COLD',
  DIAGNOSIS_PREHEATING: 'STATE:DIAGNOSIS_PREHEATING',
  DIAGNOSIS_MEASURING: 'STATE:DIAGNOSIS_MEASURING',
  DIAGNOSIS_READY_SILENT: 'STATE:DIAGNOSIS_READY_SILENT',
  DIAGNOSIS_READY: 'STATE:DIAGNOSIS_READY',
} as const;

/** JSON-over-BLE chunking markers — app.html lines 8685-8721. */
export const BLE_JSON_MARKERS = {
  begin: 'JSON_BEGIN',
  chunkPrefix: 'JSON_CHUNK:',
  end: 'JSON_END',
} as const;

/**
 * Outbound commands the app sends to the ESP32 (app.html: `sendBleCommand`
 * call sites). Keep these exact strings — changing them breaks firmware
 * compatibility (task rule #24).
 */
export const BLE_COMMANDS = {
  /** Sent when the home screen loads with the device cold (line 6304, 8918). */
  APP_STATE_DIAGNOSIS_HOME_COLD: 'APP_STATE:DIAGNOSIS_HOME_COLD',
  /** Sent when the user taps "예열 시작" (line 6324). */
  START_WARMUP: 'START_WARMUP',
  /** Sent right after connecting, to confirm the link (line 8921). */
  PING: 'PING',
} as const;

/**
 * Dev-only simulation flag, ported from app.html line 8813
 * (`const UI_EDIT_WITHOUT_BLUETOOTH = true;`). When true, sendBleCommand()
 * is a no-op that always resolves success, and the BLE connect popup /
 * auto-reconnect flow is skipped (see window 'DOMContentLoaded' handler,
 * app.html lines 9021-9025 — this was the mode the reference HTML was
 * actually shipped in). Flip to false once react-native-ble-plx wiring
 * (src/services/ble.ts) is validated against real hardware.
 */
export const UI_EDIT_WITHOUT_BLUETOOTH = true;
