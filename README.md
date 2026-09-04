# IPJIMAYO | 입지마요

> **냄새·수분 기반 스마트 의류 상태 진단 솔루션**

**IPJIMAYO(입지마요)**는 사용자가 옷을 입기 전에 의류의 **냄새와 잔여 수분 상태를 센서로 측정하고 분석하여 의류 상태를 객관적으로 확인할 수 있도록 개발한 스마트 의류 관리 디바이스**입니다.

기존 의류 관리 제품이 건조나 탈취 등 냄새 발생 이후의 관리에 집중하는 것과 달리, 입지마요는 **"지금 이 옷을 입어도 될까?"**라는 질문에 답하기 위한 **사전 상태 진단**에 초점을 맞추었습니다.

---

## 1. 개발 배경

대학가 원룸이나 기숙사와 같은 청년 1인가구의 주거 환경에서는 좁은 건조 공간으로 인해 의류 건조 지연과 쉰내 문제가 반복적으로 발생합니다.

대학교 기숙사생 및 자취생을 대상으로 진행한 **44명 온라인 설문조사와 10명 대면 인터뷰** 결과,

- **84.1%** : 세탁 후 쉰내를 경험
- **54.5%** : 의류 관리 스트레스의 주요 원인으로 냄새를 선택
- **93.2%** : 의류의 건조 상태를 손의 감각에 의존해 판단

하는 것으로 나타났습니다.

입지마요는 이러한 문제의 핵심을 **객관적인 의류 상태 판단 기준의 부재**로 정의하였습니다.

---

# 2. Solution

입지마요는 다음 데이터를 이용하여 의류 상태를 판단합니다.

### 냄새
Bosch **BME690** 가스 센서를 이용하여 의류 표면의 VOC 반응을 측정하고, Heating Profile에 따른 센서 반응 패턴을 AI 모델로 분석합니다.

### 잔여 수분
의류에 직접 접촉하는 **구리 전극과 ESP32-S3의 정전용량 Touch Raw Data**를 이용하여 의류의 잔여 수분 상태를 추정합니다.

### 환경 정보
BME690을 통해 의류 주변의 **온도와 습도**도 함께 측정합니다.

측정 및 분석 결과는 BLE를 통해 모바일 인터페이스로 전달되어 사용자가 의류 상태와 행동 가이드를 확인할 수 있습니다.

---

# 3. 주요 기능

## 바로 진단

외출 전 의류의 현재 상태를 한 번의 측정으로 확인하는 기능입니다.

```text
측정 시작
   ↓
센서 준비 및 예열
   ↓
Fan을 이용한 의류 표면 공기 유입
   ↓
BME690 Heating Profile 측정
   ↓
AI 기반 BAD / NOT_BAD 냄새 분류
   ↓
정전용량 기반 잔여 수분 측정
   ↓
온도·습도 측정
   ↓
ESP32-S3 On-Device 분석
   ↓
BLE 결과 전송
   ↓
모바일 앱 결과 및 행동 가이드 표시
```

냉간 상태에서 바로 진단을 시작하는 경우 **10초의 센서 예열 과정**을 수행한 뒤 실제 측정을 진행합니다.

---

## 자동 확인

의류가 건조되는 동안 사용자가 계속 상태를 직접 확인하지 않아도 되도록 만든 모니터링 기능입니다.

자동 확인에서는 매번 모든 센서를 사용하는 대신 **수분 상태를 우선 확인하고 필요한 경우에만 냄새 측정을 수행**합니다.

```text
자동 확인 시작
      ↓
초기 수분 상태 저장
      ↓
30분 대기
      ↓
잔여 수분 측정
      ↓
┌── 수분 < 10% ──→ 건조 완료
│
└── 수분 ≥ 10%
          ↓
    이전 측정보다
    1%p 이상 감소?
      ↓        ↓
     YES       NO
      ↓         ↓
 정상 건조    수분 정체
      ↓         ↓
30분 후 확인   BME690 냄새 측정
                ↓
          냄새 위험도 확인
                ↓
      계속 건조 / 재세탁 안내
```

이를 통해 측정 목적과 의류 상태에 따라 필요한 센서만 선택적으로 동작시킵니다.

---

# 4. Dual-Form Factor

입지마요는 하나의 기기를 두 가지 방식으로 사용할 수 있도록 설계하였습니다.

### Handy Mode

사용자가 직접 의류 표면에 기기를 밀착하여 외출 전 현재 의류 상태를 확인합니다.

### Hanger Mode

기기를 전용 옷걸이 모듈에 결합하여 건조 중인 의류의 상태 변화를 주기적으로 확인합니다.

이를 통해 하나의 디바이스로

**외출 전 상태 확인 → 건조 중 자동 관리**

까지 지원할 수 있도록 설계하였습니다.

---

# 5. System Architecture

```text
                   ┌──────────────────┐
                   │   Mobile App     │
                   │ 측정 UI / 결과 표시 │
                   └────────┬─────────┘
                            │
                           BLE
                            │
                   ┌────────▼─────────┐
                   │     ESP32-S3     │
                   │  LOLIN S3 Pro    │
                   │                  │
                   │ Data Collection  │
                   │ Sensor Control   │
                   │ On-Device Logic  │
                   └───────┬──────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
       BME690         Copper Electrode    4010 FAN
       VOC / T&H        Moisture           Airflow
           │               │
           └───────┬───────┘
                   │
             의류 상태 분석
                   │
                   ▼
          냄새 / 수분 진단 결과
```

---

# 6. Hardware

| 구분 | 부품 | 기능 |
|---|---|---|
| MCU | ESP32-S3 (LOLIN S3 Pro) | 센서 데이터 수집, 시스템 제어 및 BLE 통신 |
| VOC Sensor | Bosch BME690 | 의류 냄새 관련 VOC 반응 측정 |
| Environment | Bosch BME690 | 온도·습도 측정 |
| Moisture Sensor | Copper Electrode | 정전용량 기반 잔여 수분 측정 |
| Air Intake | 4010 5V Fan | 의류 표면 공기를 센서부로 유입 |
| Charging | TP4056 | Li-Po 배터리 충전 |
| Power | DFR1026 | 배터리 전압 승압 및 시스템 전원 공급 |
| Battery | Li-Po Battery | 휴대형 시스템 전원 공급 |
| Input | Power / Operation Button | 전원 및 측정 기능 제어 |

---

# 7. Pin Configuration

현재 ESP32-S3 Firmware 기준 핀 구성입니다.

| Function | GPIO |
|---|---:|
| BME690 SDA | GPIO 9 |
| BME690 SCL | GPIO 10 |
| BME690 I2C Address | `0x76` |
| Fan MOSFET Gate | GPIO 18 |
| Moisture Electrode | GPIO 4 |
| Moisture Reference | GND |
| BOOT / Operation Button | GPIO 0 |

---

# 8. Software Stack

| 분야 | 기술 |
|---|---|
| MCU | ESP32-S3 (LOLIN S3 Pro) |
| Firmware | Arduino IDE / C++ |
| Gas Sensor | Bosch BME690 |
| AI | Bosch AI Studio |
| AI Runtime | Bosch BSEC 3.3.0.0 |
| Communication | Bluetooth Low Energy |
| Mobile | React Native / Expo |
| Mechanical Design | Fusion 360 |
| 3D Printing | Bambu Studio |
| Version Control | Git / GitHub |

---

# 9. 냄새 분류 AI

## Dataset

의류에서 실제로 발생하는 냄새 조건을 반영하기 위해 총 **120개의 냄새 샘플**을 수집하였습니다.

| Class | Samples |
|---|---:|
| BAD | 60 |
| NOT_BAD | 60 |
| **Total** | **120** |

각 표본은 약 **8분 동안 측정**하였으며, 라벨링 신뢰도를 높이기 위해 **2인의 후각 평가 결과가 일치한 샘플만 확정 라벨로 사용**하였습니다.

### BAD

관리가 필요한 냄새 상태

- 세탁 후 장시간 방치된 의류
- 쉰내
- 착용 후 땀냄새
- 활동복 냄새 등

### NOT_BAD

정상적으로 착용 가능한 냄새 상태

- 무취 의류
- 정상 건조 의류
- 섬유유연제 향
- 향수 및 좋은 향이 남아 있는 의류 등

---

# 10. Heating Profile 비교

BME690 가스 센서는 heater 온도에 따라 VOC에 대한 반응이 달라집니다.

따라서 Bosch AI Studio를 이용하여 네 가지 Heating Profile을 비교하였습니다.

| Profile | 특징 |
|---|---|
| HP-301 | 표준 계단식 Scan |
| HP-354 | 고온 유지 후 급랭·재가열 |
| HP-411 | 고온 Pulse 기반 Scan |
| **HP-501** | 승온 후 하강하는 Peak 형태 Scan |

실험 결과 HP-501에서 가장 높은 분류 성능을 확인하여 최종 모델에 적용하였습니다.

| Heating Profile | Accuracy | F1 Score | False Positive |
|---|---:|---:|---:|
| HP-301 | 95.59% | 95.57% | 4.46% |
| HP-411 | 95.76% | 95.76% | 4.16% |
| HP-354 | 95.45% | 95.45% | 4.59% |
| **HP-501** | **97.60%** | **97.60%** | **2.41%** |

> 97.60%는 프로젝트에서 구성한 실험 데이터셋과 검증 조건에서 측정한 Neural Network 성능입니다.

---

# 11. On-Device Odor Classification

Bosch AI Studio에서 생성한 BSEC configuration을 ESP32-S3 Firmware에 포함시켰습니다.

```cpp
const uint8_t bsec_config_selectivity[2001]
```

현재 모델의 주요 설정은 다음과 같습니다.

```text
Class 1        : BAD
Class 2        : NOT_BAD
Heating Profile: HP-501
BSEC           : 3.3.0.0
Input Channel  : Gas Resistance
```

BME690에서 생성된 Heating Profile의 시계열 반응을 BSEC Neural Network에 입력하여 ESP32-S3 내부에서 BAD / NOT_BAD를 분류합니다.

즉, 냄새 분석을 위해 센서 Raw Data를 별도의 서버로 전송할 필요 없이 **On-Device 환경에서 직접 분류 결과를 계산**합니다.

---

# 12. Odor Severity

BAD / NOT_BAD 분류 결과 외에도 gas resistance 변화를 이용하여 냄새 상태의 상대적인 정도를 계산합니다.

```text
Relative Change(i)
= |R_measure(i) - R_baseline(i)| / R_baseline(i)

Response(%)
= Average Relative Change × 100

Severity(%)
= BAD Probability × Response / 100
```

이를 통해 단순 이진 분류 결과와 함께 냄새 상태 변화에 대한 보조 지표를 생성합니다.

---

# 13. 잔여 수분 추정

입지마요는 별도의 상용 수분 센서를 사용하는 대신 **구리 전극과 ESP32-S3의 정전용량 Touch 기능**을 이용합니다.

## Ground Truth 생성

의류의 실제 수분 함량은 중량을 기준으로 계산하였습니다.

```text
완전 건조 의류 무게 = mdry
현재 의류 무게     = mt
```

건량 기준 수분 함량은 다음과 같이 정의합니다.

```text
MCdb = (mt - mdry) / mdry × 100
```

건조 과정에서

```text
Touch Raw Data
+
동일 시점의 실제 의류 무게
```

를 함께 측정하여 **정전용량 값과 실제 수분 함량의 학습 Pair**를 생성하였습니다.

---

## Firmware 수분 추정

현재 ESP32-S3 Firmware에서는 Touch Raw Data를 반복 측정한 뒤 대표값을 계산하고, 중량 기반 실험 데이터로 생성한 calibration을 이용하여 잔여 수분 상태를 추정합니다.

```text
Copper Electrode
       ↓
ESP32 touchRead()
       ↓
Repeated Sampling
       ↓
Median
       ↓
Calibration
       ↓
Moisture %
```

이를 통해 실제 사용 시에는 저울을 함께 사용하지 않고 전극에서 측정한 정전용량 값으로 의류의 수분 상태를 추정합니다.

---

# 14. 주요 Firmware 구성

현재 ESP32-S3 통합 Firmware에는 다음 기능이 포함되어 있습니다.

- BME690 초기화 및 측정
- Bosch BSEC AI configuration 적용
- HP-501 Heating Profile 동작
- BAD / NOT_BAD 냄새 분류
- Gas Resistance 기반 냄새 Severity 계산
- 정전용량 Touch Raw Data 측정
- 잔여 수분 상태 추정
- BME690 온도·습도 측정
- 4010 Fan 제어
- 물리 버튼 입력 처리
- 바로 진단
- 자동 확인
- BLE 통신
- 측정 결과 JSON 생성
- BLE 결과 분할 전송
- 마지막 측정 결과 재전송

---

# 15. 주요 Firmware Functions

| Function | 역할 |
|---|---|
| `setup()` / `loop()` | 센서 및 통신 초기화, 전체 상태 관리 |
| `serviceBsecContinuousSession()` | HP-501 기반 BME690 측정 진행 |
| `processValidBme690FieldThroughBsec()` | BME690 데이터를 BSEC에 전달 |
| `calculateSmellSeverity()` | 냄새 분류 결과와 gas resistance를 이용한 보조 강도 계산 |
| `readTouchStatistics()` | 정전용량 Raw Data 반복 측정 및 대표값 계산 |
| `predictMoistureFromTrainingData()` | Calibration 기반 잔여 수분 상태 추정 |
| `runOneDemonstration()` | 바로 진단 전체 측정 수행 |
| `serviceAutomaticMonitoring()` | 30분 주기 자동 확인 |
| `serviceBleCommandQueue()` | 모바일 앱 BLE 명령 처리 |
| `sendResultJsonInChunks()` | 측정 결과 BLE 분할 전송 |

---

# 16. BLE Communication

ESP32-S3와 모바일 앱은 Bluetooth Low Energy를 이용하여 통신합니다.

주요 명령은 다음과 같습니다.

```text
PING
START_WARMUP
START_DIAGNOSIS
START_MEASUREMENT
START_MONITORING
STOP_MONITORING
GET_LAST_RESULT
```

측정 결과는 JSON 형태로 생성한 후 BLE 패킷 크기에 맞게 분할하여 모바일 앱으로 전달합니다.

---

# 17. 기술적 차별성

### 1. 사후 제거가 아닌 사전 진단

기존 의류 관리 제품이 건조·탈취 등 의류 상태를 개선하는 것에 집중하는 것과 달리, 입지마요는 **착용 전에 현재 의류 상태를 측정하고 판단**하는 것을 목표로 합니다.

### 2. 냄새 + 수분 복합 센싱

하나의 센서값만 사용하는 것이 아니라

```text
VOC
+
잔여 수분
+
온도·습도
```

정보를 함께 사용자에게 제공합니다.

### 3. On-Device AI

BME690과 Bosch AI Studio 기반 냄새 분류 모델을 ESP32-S3에서 직접 실행합니다.

### 4. 직접 설계한 정전용량 수분 센싱

의류와 직접 접촉하는 구리 전극을 이용하고 실제 중량을 Ground Truth로 사용하여 수분 상태 추정 기준을 생성하였습니다.

### 5. Dual-Form Factor

하나의 기기를 핸디형과 옷걸이형으로 사용할 수 있도록 설계하여 외출 전 진단과 건조 중 자동 확인을 하나의 시스템에서 지원합니다.

### 6. 선택적 자동 모니터링

자동 확인 시 매번 냄새 센서를 구동하지 않고 수분 변화를 먼저 분석한 뒤 필요할 때만 냄새 측정을 수행합니다.

---

# 18. Development Process

개발 과정에서 다음 문제를 개선하였습니다.

### 학습 데이터 부족

초기 냄새 데이터셋이 실제 의류의 다양한 냄새 조건을 충분히 포함하지 못하는 문제를 해결하기 위해 측정 조건과 샘플 범위를 확대하였습니다.

### 긴 냄새 측정 시간

Heating Profile과 측정 State Machine을 최적화하여 센서 준비 및 측정 과정을 개선하였습니다.

### 의류와 센서의 밀착 부족

실리콘 스커트를 적용하여 센싱부와 의류 표면 사이의 밀착성을 높이고 외부 공기 유입을 감소시켰습니다.

### 내부 부품 간섭

실제 부품 치수를 Fusion 360 모델에 반영하고 PCB, 배터리 및 배선의 위치와 고정 구조를 반복적으로 재설계하였습니다.

---

# 19. Mobile Application

모바일 앱에서는 BLE를 통해 IPJIMAYO와 통신하고 다음 정보를 사용자에게 제공합니다.

- 바로 진단 시작
- 센서 예열 및 측정 상태 표시
- 냄새 상태
- 잔여 수분 상태
- 온도·습도
- 자동 확인 상태
- 이상 상태 알림
- 상황별 행동 가이드

개발 환경:

```text
React Native
Expo
BLE
```

---

# 20. Future Work

현재 시스템을 기반으로 다음 기능으로 확장할 수 있습니다.

### 건조 완료 시간 예측

30분마다 수집되는 잔여 수분 데이터를 시간축으로 분석하여 건조 완료 예상 시점을 계산합니다.

```text
1차 모델
y(t) = a + b·t

고도화 모델
y(t) = a + b·t + c·t² + d·t³
```

최신 측정 데이터에 더 높은 가중치를 적용하여 건조 환경 변화에 대응하는 방향으로 확장할 수 있습니다.

### 온·습도 보정 수분 모델

현재 정전용량 기반 수분 추정을 고도화하여

```text
MCdb = f(Touch Raw Data, Temperature, Humidity)
```

형태의 다변수 회귀 모델로 확장할 수 있습니다.

### 사용자 데이터 기반 개인화

의류 종류, 사용 환경, 건조 조건 및 측정 이력을 축적하여 사용자별 의류 관리 모델로 확장할 수 있습니다.

### B2B / Public Application

개인 사용뿐 아니라

- 기숙사
- 공동 세탁실
- 청년주택
- 빨래방

등 다수의 사용자가 공유하는 의류 관리 환경으로 확장할 수 있습니다.

---

# 21. Demo Video

실제 IPJIMAYO의 동작 과정은 아래 시연 영상에서 확인할 수 있습니다.

**YouTube**

https://youtu.be/Q7IOEdqx0VQ

---

# 22. Repository Structure

```text
IPJIMAYO/
│
├── README.md
│
├── firmware/
│   └── IPJIMAYO_ESP32_Firmware.ino
│
├── app/
│
├── hardware/
│
└── docs/
    └── images/
```

---

# IPJIMAYO

> **"이 빨래, 입어도 될까? 입지마요."**

냄새·수분 기반 스마트 의류 상태 진단 솔루션
