# IPJIMAYO — Expo/React Native port

This is a 1:1 UI/UX port of `ipjimayo_app_no_demo_panel.html` to a real
Expo + React Native + TypeScript app, per the porting brief. It is **not**
a WebView wrapper — every screen is built from native `View`/`Text`/
`Pressable`/`Image`/SVG components.

Every file that ports source logic has a comment citing the exact
app.html line numbers / function names it came from, so you can diff
against the original at any time.

## Status: partial port (functional core flow, not feature-complete)

**What works end-to-end right now** (the 바로 진단 / "quick diagnosis" flow):

- Home → 예열 시작 (start warmup) → 10s warmup countdown with the flame
  fill visual → Ready → Analysis (with the scanning-magnifier animation)
  → Result (LED ring, smell-stage meter, moisture drops, environment
  compare card) → idle-timeout screen
- Mode toggle (바로 진단 / 자동 확인) — switching to 자동 확인 currently
  falls back to the home screen (see below)
- Side menu → 설정 (settings: warmup type, scheduled time, alarm
  simulation) and 도움말 (help) bottom sheets
- Onboarding popup shell with all 7 slides' real titles/descriptions and
  page dots/prev/next/skip; slide 1 (`modesOverview`) has its full
  illustration ported, the other 6 show a clearly-labeled "포팅 예정"
  (pending) placeholder instead of their custom illustration
- AsyncStorage persistence matching every `localStorage` key from source
- BLE service (`react-native-ble-plx`) and Firebase RTDB service, wired
  to the exact protocol/config from source, currently running in the same
  `UI_EDIT_WITHOUT_BLUETOOTH = true` simulation mode the source HTML
  shipped in (no real device required to explore the UI)

**What's NOT ported yet** — see inline `TODO` comments for exact source
line numbers to pick this up from:

1. **자동 확인 (monitoring) flow** — `monitorAttach` / `monitorWait`
   screens, the docking-rail animation, VOC phase tracking, drying-time
   estimator, stagnation detection, alerts, and the Timeline sheet's real
   content (source: ~40 functions between app.html lines 5942-7405,
   7831-8055). Currently these screens fall back to the home screen.
2. **Result screen center illustration** — the 5 per-result-code animated
   scenes (`resultSceneHTML()`, app.html ~7637-7690: shine-sweep +
   sparkles for "clean", falling drops for "drying", odor clouds for
   "caution", shirt-drop-into-basket for "basket"/"rewash"). Currently a
   static shirt emoji inside the LED ring.
3. **6 of 7 onboarding slide illustrations** (`deviceOverview`,
   `environment`, `diagnosisPrepFull`, `diagnosisResultFull`,
   `monitoringSetup`, `monitoringResult`) — see
   `src/onboarding/PendingSlideBody.tsx` for the exact source function
   each maps to.
4. **`assets/howto.mp4`** was not included with the source HTML. Per the
   task brief's explicit instruction, `HelpSheet.tsx` shows a labeled
   "assets/howto.mp4가 필요함" placeholder instead of fabricating a video.
   Drop the real file at `assets/videos/howto.mp4` and flip
   `HOWTO_VIDEO_AVAILABLE` in `HelpSheet.tsx`.
5. **Remaining CSS animations** — of the ~40 `@keyframes` in source, this
   port implements: `screenIn`, the flame clip-path fill, the mode-toggle
   pill slide, `scanSquare` (analysis magnifier), `ledPulse`. Not yet
   ported: LED sequential/rotation animations, docking/carriage
   animations, VOC pulse/ring, odor wisp/cloud, water-drop fall/evaporate,
   push-notification transitions, side-menu/bottom-sheet open easing
   tuning. Grep `app.html` for `@keyframes` for the full list (44 total).
6. **Push notifications UI** (`pushNotify()`, `.push-stack`) — not ported.

## Known fidelity gaps (things CSS can do that RN can't 1:1)

- **`filter: grayscale() brightness()`** on the flame "unlit" base layer
  (`FlameProgress.tsx`) is approximated with opacity, not a true
  grayscale filter. A pixel-exact port needs `react-native-skia`'s
  `ColorFilter` — flagged in the component's file header.
- **`color-mix(in srgb, ...)`** (used throughout for tinted
  shadows/borders, e.g. `.led-ring`) has no RN equivalent; ported as
  fixed pre-mixed colors per result state instead of computed at render
  time. Visually equivalent for the fixed palette this app uses.
- **`backdrop-filter: blur()`** on modal dim layers is not applied (RN
  has no first-class backdrop blur without `expo-blur`, which changes the
  visual less than it might seem for a solid `rgba` scrim — not added
  yet).
- **Time input**: source uses native `<input type="time">`;
  `SettingsSheet.tsx` uses a plain text field for "HH:MM" as a stand-in.
  Swap for `@react-native-community/datetimepicker` for a real picker.

## Setup

```bash
npm install
npx expo prebuild   # generates ios/ and android/ native projects
npx expo run:android  # requires an Expo Development Build — see below
```

**This app cannot run in Expo Go.** `react-native-ble-plx` is a native
module, so per task rule #23 you need an Expo Development Build:

```bash
npx expo install expo-dev-client
eas build --profile development --platform android   # or run:android locally with Android Studio installed
```

Until you've validated the BLE wiring against real ESP32 hardware, leave
`UI_EDIT_WITHOUT_BLUETOOTH = true` in `src/constants/ble.ts` (matches the
mode the source HTML actually shipped in — see that file's comment).

## Project structure

```
src/
├── screens/         DiagnosisHome, Warmup, Ready, Analysis, Result, Timeout
├── onboarding/       Slide data + popup shell + per-slide bodies
├── components/       Shared UI: header, flame, LED ring, sheets, menu, icons
├── store/            AppStateContext — the ported state machine (reducer)
├── services/         storage.ts (AsyncStorage), ble.ts, firebase.ts
├── constants/        colors, typography, thresholds, BLE protocol, storage keys
├── utils/            scale.ts (430px reference scaling), format.ts, resultLogic.ts
└── types/            AppState shape, ported from the source `state` object
assets/
├── images/           5 images extracted byte-for-byte from the source HTML's
│                     Base64 data URIs (flame, step2/step4 photos, monitoring previews)
├── fonts/            Real Pretendard static OTF weights (Regular/Medium/
│                     SemiBold/Bold/Black), sourced from the `pretendard` npm
│                     package — the same font family app.html loads from CDN
└── videos/           empty — see "What's NOT ported yet" #4
```

## Design tokens

All colors, thresholds, BLE UUIDs/commands, and storage keys are centralized
in `src/constants/` and were extracted directly from app.html's `:root` CSS
variables, `THRESHOLDS` object, `IPJIMAYO_BLE` object, and `localStorage`
call sites, respectively — cross-check those files against source before
making any visual or protocol change.

## Verifying against the source HTML

No emulator/device or screenshot tooling was available in the environment
this port was built in, so **pixel-parity verification (task rule #30)
has not been performed** — that needs to happen on a real Android build
next to the HTML (open app.html at 430px width in a browser, run this app
on a same-size device/emulator, and compare screen-by-screen). The line-
number citations throughout the source should make that diffing fast.
