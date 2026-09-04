/**
 * Firebase Realtime Database wiring, ported from app.html lines 9029-9070
 * (the `<script type="module">` block) and the `handleFirebaseControlData`
 * handler (lines 8414-8471).
 *
 * Source RTDB path: "device/control/output" — DO NOT change this path,
 * it must match the ESP32 firmware / display's write target.
 *
 * Expected payload shape (inferred from handleFirebaseControlData):
 *   {
 *     updatedAt: number,
 *     input: { smellStagnation?: number, moistureStagnation?: number },
 *     weather: { temperature?: number, humidity?: number },
 *     showResultImmediately?: boolean,
 *     quickPreset?: { showResultImmediately?: boolean },
 *   }
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, type Database, type Unsubscribe } from 'firebase/database';

// Ported verbatim from app.html line 9033-9036. If Anthropic's/your infra
// requires different credentials, only databaseURL is actually exercised
// by the source app (it's the only field referenced) — the rest of the
// config object was not fully visible in the truncated source dump and
// should be filled in from the original HTML's `firebaseConfig` object
// before shipping.
const firebaseConfig = {
  databaseURL: 'https://ipzimayo-default-rtdb.asia-southeast1.firebasedatabase.app',
};

let app: FirebaseApp | null = null;
let db: Database | null = null;

function getDb(): Database {
  if (!app) app = initializeApp(firebaseConfig);
  if (!db) db = getDatabase(app);
  return db;
}

export interface FirebaseControlPayload {
  updatedAt?: number;
  input?: {
    smellStagnation?: number;
    moistureStagnation?: number;
  };
  weather?: {
    temperature?: number;
    humidity?: number;
  };
  showResultImmediately?: boolean;
  quickPreset?: { showResultImmediately?: boolean };
}

/**
 * Subscribes to "device/control/output", mirroring the source's
 * `onValue(controlRef, ...)` listener. Returns an unsubscribe function.
 */
export function subscribeControlOutput(
  onData: (data: FirebaseControlPayload) => void,
  onError: (message: string) => void
): Unsubscribe {
  const controlRef = ref(getDb(), 'device/control/output');
  return onValue(
    controlRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) onData(data as FirebaseControlPayload);
    },
    (error) => onError(error.message)
  );
}
