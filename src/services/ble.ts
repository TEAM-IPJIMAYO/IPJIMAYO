/**
 * React Native BLE service, ported from the Web Bluetooth implementation
 * in app.html (lines 8546-9026) to `react-native-ble-plx`.
 *
 * Mapping from source to here:
 *   navigator.bluetooth.requestDevice(...)      -> BleManager.startDeviceScan()
 *   device.gatt.connect()                       -> device.connect()
 *   server.getPrimaryService(uuid)               -> implicit via characteristic calls
 *   service.getCharacteristic(rxUuid)             -> writeCharacteristicWithoutResponseForService
 *   txCharacteristic.startNotifications()         -> device.monitorCharacteristicForService
 *   'gattserverdisconnected' listener             -> BleManager.onDeviceDisconnected
 *   'characteristicvaluechanged' listener         -> monitor callback
 *
 * Same protocol constants (service/rx/tx UUIDs, command strings, state
 * codes, JSON chunking markers) as the source — see src/constants/ble.ts.
 *
 * IMPORTANT: This module requires a native module (react-native-ble-plx),
 * so it will NOT run inside Expo Go — an Expo Development Build is
 * required (task rule #23). Until that build exists, the app runs with
 * `UI_EDIT_WITHOUT_BLUETOOTH = true` (see constants/ble.ts), exactly like
 * the reference HTML shipped (app.html line 8813 + the DOMContentLoaded
 * handler at 9021-9025 that skips the connect popup entirely).
 */
import { Buffer } from 'buffer';
import {
  IPJIMAYO_BLE,
  BLE_DEVICE_NAME,
  COMPACT_STATE_MAP,
  BLE_JSON_MARKERS,
  UI_EDIT_WITHOUT_BLUETOOTH,
} from '@/constants/ble';

export type BleMessageHandler = (message: string) => void;
export type BleConnectionHandler = (connected: boolean) => void;

let manager: import('react-native-ble-plx').BleManager | null = null;
let connectedDevice: import('react-native-ble-plx').Device | null = null;
let jsonBuffer = '';
let jsonReceiving = false;

function getManager() {
  if (!manager) {
    // Lazy require so the native module is only touched when BLE is
    // actually used (keeps this file safe to import in Expo Go too,
    // where the native module isn't linked).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { BleManager } = require('react-native-ble-plx');
    manager = new BleManager();
  }
  return manager;
}

/**
 * Ported from sendBleCommand() — app.html lines 8815-8850.
 * Writes `command + '\n'` to the RX characteristic, matching the source's
 * `TextEncoder().encode(command + '\n')`.
 */
export async function sendBleCommand(command: string): Promise<boolean> {
  if (UI_EDIT_WITHOUT_BLUETOOTH) {
    console.log('[UI 수정용 모드] BLE 명령 생략:', command);
    return true;
  }
  if (!connectedDevice) {
    console.warn('먼저 IPJIMAYO 기기를 연결해 주세요.');
    return false;
  }
  try {
    const payload = Buffer.from(`${command}\n`, 'utf-8').toString('base64');
    await connectedDevice.writeCharacteristicWithoutResponseForService(
      IPJIMAYO_BLE.serviceUuid,
      IPJIMAYO_BLE.rxUuid,
      payload
    );
    return true;
  } catch (error) {
    console.error('BLE 명령 전송 실패:', error);
    return false;
  }
}

/**
 * Ported from handleIpjimayoBleMessage() — app.html lines 8586-8731.
 * Applies the compact-state translation and JSON chunk reassembly, then
 * calls back with the fully-resolved message string (or a parsed JSON
 * object string for JSON_END).
 */
function decodeIncoming(base64Value: string): string {
  return Buffer.from(base64Value, 'base64').toString('utf-8').trim();
}

export function handleIncomingValue(
  base64Value: string,
  onState: (message: string) => void,
  onResultJson: (data: unknown) => void
) {
  const raw = decodeIncoming(base64Value);
  if (!raw) return;

  const message = COMPACT_STATE_MAP[raw] ?? raw;

  if (message === BLE_JSON_MARKERS.begin) {
    jsonBuffer = '';
    jsonReceiving = true;
    return;
  }
  if (message.startsWith(BLE_JSON_MARKERS.chunkPrefix)) {
    if (!jsonReceiving) {
      jsonBuffer = '';
      jsonReceiving = true;
    }
    jsonBuffer += message.slice(BLE_JSON_MARKERS.chunkPrefix.length);
    return;
  }
  if (message === BLE_JSON_MARKERS.end) {
    const completed = jsonBuffer;
    jsonBuffer = '';
    jsonReceiving = false;
    try {
      onResultJson(JSON.parse(completed));
    } catch (error) {
      console.error('ESP32 결과 JSON 해석 실패:', error, completed);
    }
    return;
  }
  if (message.startsWith('{') && message.endsWith('}')) {
    try {
      onResultJson(JSON.parse(message));
    } catch (error) {
      console.error('ESP32 단일 JSON 해석 실패:', error, message);
    }
    return;
  }

  onState(message);
}

/**
 * Ported from connectIpjimayoBle() — app.html lines 8924-8974.
 * Scans for a device named "IPJIMAYO", connects, discovers services, and
 * subscribes to the TX characteristic.
 */
export async function connectIpjimayoBle(
  onMessage: BleMessageHandler,
  onResultJson: (data: unknown) => void,
  onDisconnected: BleConnectionHandler
): Promise<import('react-native-ble-plx').Device> {
  const bleManager = getManager();

  return new Promise((resolve, reject) => {
    bleManager.startDeviceScan([IPJIMAYO_BLE.serviceUuid], null, async (error, device) => {
      if (error) {
        bleManager.stopDeviceScan();
        reject(error);
        return;
      }
      if (device?.name !== BLE_DEVICE_NAME) return;

      bleManager.stopDeviceScan();
      try {
        const connected = await device.connect();
        await connected.discoverAllServicesAndCharacteristics();
        connectedDevice = connected;

        connected.monitorCharacteristicForService(
          IPJIMAYO_BLE.serviceUuid,
          IPJIMAYO_BLE.txUuid,
          (charError, characteristic) => {
            if (charError || !characteristic?.value) return;
            handleIncomingValue(characteristic.value, onMessage, onResultJson);
          }
        );

        connected.onDisconnected(() => {
          connectedDevice = null;
          jsonBuffer = '';
          jsonReceiving = false;
          onDisconnected(false);
        });

        resolve(connected);
      } catch (connectError) {
        reject(connectError);
      }
    });
  });
}

export function disconnectIpjimayoBle() {
  return connectedDevice?.cancelConnection();
}

export function isConnected() {
  return connectedDevice != null;
}
