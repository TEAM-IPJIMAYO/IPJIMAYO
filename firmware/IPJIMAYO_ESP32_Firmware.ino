/*
  NEW AI STUDIO MODEL METADATA
  - Algorithm: 0812_test
  - AI Studio: 3.2.0
  - BSEC: 3.3.0.0
  - Class 1: BAD
  - Class 2: NOT BAD
  - Heater profile: heater_501
  - timeBase: 140 ms
  - temperatures: [210, 265, 265, 320, 320, 265, 210, 155, 100, 155]
  - duration multipliers: [24, 2, 22, 2, 22, 24, 24, 24, 24, 24]
  - RDC: 1-0 Continuous
  - data channels: ['gas_resistance']
  - data augmentation: True
  - augmentation target ages: [10, 20, 30, 40, 50, 60]

  IMPORTANT
  The heater temperature/duration arrays above are metadata only.
  Runtime heater control is NOT hardcoded. bsec_sensor_control() reads the
  heater profile/timing from the exact 2001-byte exported BSEC config and
  applies it to the BME690.
*/

/*
  IPJIMAYO ESP32-S3 통합 코드 — 바로 진단 + 자동 확인 + BLE + 정전용량 수분

  물리 BOOT 버튼
  - 짧게(<1.5초): 바로 진단 시작.
    냉간이면 HP-501 10초 예열을 자동 수행한 뒤 사용자가 다시 누르지 않아도 측정을 이어갑니다.
  - 길게(>=1.5초): 자동 확인 시작.
    별도 예열 화면 없이 즉시 정전용량 수분 baseline을 저장하고 ESP32 자체 타이머로 30분마다 확인합니다.
  - 자동 확인 중 다시 길게: 자동 확인 종료.

  바로 진단
  - 팬 2초 선행 흡입
  - 기존 물리 heater cycle 중단 후 fresh HP-501 G0~G9
  - BSEC BAD/NOT BAD + 상대 gas resistance 변화량으로 임시 냄새 severity
  - GPIO4 정전용량 센서 31회 측정
  - 이번에 제공된 3개 수건 CSV 29개 유효 행에서 만든 monotonic median 보정으로 수분 % 예측
  - 실제 BME690 온도/습도와 함께 BLE JSON으로 HTML에 전송

  자동 확인
  - 최초 수분 baseline 저장
  - 30분마다 GPIO4 수분 측정
  - 수분 <10%: 건조 완료
  - 이전보다 1%p 이상 감소: 정상 건조, 다음 30분 예약
  - 1%p 미만 감소: 수분 정체로 판단하고 BME 냄새 full cycle 수행
  - 냄새 severity 증가를 누적하며 5회 증가 또는 severity >=75%면 자동 확인 종료/재세탁 권고

  배선
  - BOOT: GPIO0 (LOW active)
  - 정전용량 신호 전극: GPIO4
  - 정전용량 기준 전극: GND
  - 팬 MOSFET Gate: GPIO18
  - BME690 I2C: SDA GPIO9 / SCL GPIO10 / 0x76

  BLE
  - Nordic UART UUID
  - 기본 MTU 23
  - JSON_CHUNK 데이터 8 bytes
  - 센서/BSEC 초기화 완료 후 BLE 광고 시작
  - BLE callback에서는 명령 bit만 queue하고 실제 센서 동작은 loop에서 수행
*/

#include <Arduino.h>

const uint8_t bsec_config_selectivity[2001] = {
  0,0,3,3,189,1,0,0,0,0,0,0,185,7,0,0,80,0,1,0,0,168,19,73,
  64,49,119,76,0,78,237,73,0,0,97,69,0,0,97,69,10,0,3,0,0,0,96,64,
  23,183,209,56,199,186,56,189,211,188,99,188,43,24,149,60,222,2,201,190,16,233,175,191,
  216,129,243,190,41,92,47,63,168,198,75,63,154,153,25,63,154,153,25,63,48,76,70,63,
  28,0,2,0,0,0,72,66,41,92,47,63,168,198,75,63,154,153,25,63,154,153,25,63,
  48,76,70,63,16,0,3,0,10,215,163,60,10,215,35,59,10,215,35,59,13,0,5,0,
  0,0,0,0,100,254,131,137,87,88,0,9,0,7,240,150,61,0,0,0,0,0,0,0,
  0,28,124,225,61,52,128,215,63,0,0,160,64,0,0,0,0,0,0,0,0,205,204,12,
  62,103,213,39,62,230,63,76,192,0,0,0,0,0,0,0,0,145,237,60,191,251,58,64,
  63,177,80,131,64,0,0,0,0,0,0,0,0,93,254,227,62,54,60,133,191,0,0,64,
  64,12,0,10,0,0,0,0,0,0,0,0,0,45,5,11,0,0,0,2,200,206,35,61,
  15,13,212,62,199,136,53,191,139,178,232,62,151,127,15,62,137,92,183,60,128,35,237,62,
  103,67,229,188,143,113,255,58,172,225,135,191,92,111,46,191,69,25,174,62,132,29,247,60,
  10,118,84,188,74,61,220,190,107,162,201,61,249,210,255,190,238,166,213,190,240,48,159,62,
  127,38,157,61,21,17,128,189,21,17,128,61,0,0,0,0,0,0,0,0,100,34,163,61,
  42,37,7,63,96,94,244,189,188,10,125,190,91,232,136,63,69,142,121,62,184,166,97,62,
  103,255,18,63,30,35,217,62,91,188,11,190,151,239,212,62,123,84,201,62,85,202,161,190,
  128,18,144,191,70,173,47,63,142,53,30,63,6,0,73,63,126,80,37,63,113,215,233,62,
  0,242,243,189,188,52,23,63,248,122,109,190,52,170,127,190,216,201,24,63,66,41,200,190,
  235,76,180,189,162,198,233,190,51,80,50,191,28,108,86,61,96,130,6,63,4,243,148,62,
  93,151,33,191,254,203,48,59,220,238,124,62,71,126,105,189,168,11,23,191,60,188,5,191,
  100,242,85,190,225,29,79,191,14,74,229,62,158,81,34,191,39,184,97,62,111,109,45,191,
  136,109,236,190,174,57,22,191,156,0,217,190,9,13,214,62,183,226,164,62,14,79,128,190,
  111,154,219,190,25,222,241,62,95,202,36,190,216,181,8,189,43,124,5,60,1,98,13,62,
  36,103,47,191,244,132,236,190,12,81,191,190,113,218,165,190,66,156,210,190,195,216,208,62,
  61,47,73,62,126,89,199,189,201,148,40,62,157,101,57,189,254,200,180,188,161,144,64,61,
  63,74,139,190,82,89,104,190,5,130,213,61,149,179,246,190,157,78,31,191,44,20,2,62,
  212,48,212,62,240,140,66,190,150,188,197,61,53,176,139,189,104,184,34,190,50,52,61,190,
  93,81,198,189,31,216,73,190,158,126,77,63,171,254,37,190,202,155,88,62,166,199,138,191,
  237,91,177,62,200,76,181,62,225,100,165,190,61,87,137,61,234,66,2,191,233,4,127,191,
  126,93,11,190,227,40,112,191,131,96,68,63,244,47,222,62,152,112,5,62,57,69,33,61,
  247,218,232,62,85,106,224,62,196,226,139,190,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,39,147,43,64,145,236,165,191,54,178,182,191,
  111,79,210,59,206,202,49,64,253,222,140,63,134,122,68,64,195,87,161,190,232,65,106,191,
  15,87,188,191,138,99,3,191,175,155,4,191,189,201,17,63,109,87,48,189,166,74,158,189,
  176,205,33,63,152,100,70,190,66,189,152,63,94,20,248,190,172,15,63,63,101,49,95,62,
  220,44,129,61,119,43,105,61,242,245,22,190,53,145,168,62,127,89,156,61,216,147,78,62,
  104,120,116,62,34,68,82,62,206,242,65,191,232,100,145,63,241,101,143,63,164,30,144,191,
  243,1,163,188,134,75,171,190,29,51,142,190,194,26,169,190,146,209,53,191,14,173,145,63,
  184,110,138,191,92,202,122,191,184,143,102,64,117,243,92,63,251,204,67,190,31,125,159,190,
  188,204,106,192,85,81,159,64,112,93,175,190,201,123,122,64,60,141,62,63,144,121,54,63,
  46,102,142,61,41,130,244,62,174,232,62,59,38,120,144,62,153,251,242,189,240,202,39,63,
  111,223,29,189,111,245,248,189,75,193,139,63,138,210,159,191,195,32,13,191,47,217,136,63,
  44,50,39,190,166,7,148,191,194,121,110,63,224,130,148,191,163,17,149,63,152,33,78,191,
  214,188,82,63,50,50,137,63,198,138,24,192,52,238,59,64,38,162,136,62,240,14,153,63,
  72,208,32,64,168,6,187,191,178,44,41,64,217,12,43,192,187,42,139,64,153,183,253,62,
  39,66,105,190,200,240,222,62,228,78,99,61,251,232,47,63,106,214,3,63,199,170,84,63,
  230,227,16,63,23,239,23,191,2,118,203,63,120,213,226,63,243,115,217,63,51,8,206,191,
  245,248,0,63,231,21,201,63,103,176,205,191,88,58,193,63,233,35,232,191,24,80,160,63,
  193,48,169,191,212,23,207,191,176,41,234,63,0,0,0,0,0,0,0,0,245,59,44,192,
  171,229,36,64,0,0,0,0,0,0,0,0,57,40,68,64,219,45,81,192,0,0,0,0,
  0,0,0,0,97,58,212,62,16,72,116,62,0,0,0,0,0,0,0,0,206,120,10,192,
  141,238,165,63,0,0,0,0,0,0,0,0,242,172,158,63,38,15,237,191,0,0,0,0,
  0,0,0,0,166,8,121,192,32,213,83,64,0,0,0,0,0,0,0,0,108,110,16,64,
  160,184,23,192,0,0,0,0,0,0,0,0,120,210,32,192,228,141,17,64,0,0,0,0,
  0,0,0,0,73,57,8,65,48,76,4,193,0,0,0,0,0,0,0,0,10,10,2,133,
  77,86,73,210,31,162,72,211,197,197,72,84,76,49,72,26,121,143,72,245,150,27,73,251,
  108,173,73,115,19,112,74,58,207,83,75,175,147,66,74,0,0,0,0,0,0,0,0,0,
  0,0,0,125,235,12,73,132,64,62,72,202,218,100,72,101,5,182,71,8,192,12,72,78,
  93,175,72,24,121,94,73,235,3,45,74,72,220,37,75,244,184,14,74,0,0,128,63,0,
  0,128,63,0,0,128,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,159,1,254,0,2,1,
  5,48,117,100,0,44,1,112,23,0,4,132,3,100,0,92,4,64,1,64,1,64,1,144,
  1,48,117,48,117,48,117,48,117,100,0,100,0,100,0,48,117,48,117,48,117,100,0,100,
  0,48,117,48,117,8,7,8,7,8,7,8,7,8,7,8,7,8,7,8,7,8,7,44,
  1,100,0,100,0,100,0,100,0,48,117,48,117,48,117,100,0,100,0,100,0,48,117,48,
  117,100,0,100,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
  255,44,1,44,1,44,1,44,1,44,1,44,1,44,1,44,1,44,1,44,1,44,1,44,
  1,44,1,44,1,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
  255,112,23,112,23,112,23,112,23,8,7,8,7,8,7,8,7,112,23,112,23,112,23,112,
  23,112,23,112,23,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
  255,255,255,255,255,255,255,255,255,112,23,112,23,112,23,112,23,255,255,255,255,220,5,220,
  5,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
  255,255,255,255,255,255,255,255,255,220,5,220,5,220,5,255,255,255,255,255,255,255,255,255,
  255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
  255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
  255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
  255,48,117,0,1,0,24,0,2,0,22,0,2,0,22,0,24,0,24,0,24,0,24,0,
  24,0,210,0,9,1,9,1,64,1,64,1,9,1,210,0,155,0,100,0,155,0,10,2,
  0,0,0,0,0,255,5,0,0
};
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <esp_system.h>
#include <math.h>
#include <float.h>
#include <stdint.h>
#include <string.h>
#include <Wire.h>
#include <esp_timer.h>

#include <bsec_interface.h>

// Bosch BSEC Arduino wrapper와 동일한 process_data 검사 매크로
#ifndef BSEC_CHECK_INPUT
#define BSEC_CHECK_INPUT(x, shift) ((x) & (1UL << ((shift) - 1)))
#endif

// Compatibility IDs used by BSEC gas-scan/classification output.
// The installed bsec_datatypes.h documents GAS_ESTIMATE_x but does not
// expose these names in its enum, so define the documented IDs locally.
#ifndef BSEC_OUTPUT_GAS_ESTIMATE_1
#define BSEC_OUTPUT_GAS_ESTIMATE_1 22
#endif
#ifndef BSEC_OUTPUT_GAS_ESTIMATE_2
#define BSEC_OUTPUT_GAS_ESTIMATE_2 23
#endif
#ifndef BSEC_OUTPUT_GAS_ESTIMATE_3
#define BSEC_OUTPUT_GAS_ESTIMATE_3 24
#endif
#ifndef BSEC_OUTPUT_GAS_ESTIMATE_4
#define BSEC_OUTPUT_GAS_ESTIMATE_4 25
#endif
#ifndef BSEC_OUTPUT_RAW_GAS_INDEX
#define BSEC_OUTPUT_RAW_GAS_INDEX 26
#endif
#include "bme69x.h"

// Arduino 자동 프로토타입 생성에 의존하지 않도록 명시합니다.
bool sendBleText(const String &message);
static bool sendResultJsonInChunks(const String &json);
static void serviceBleCommandQueue();
static void sendBleStateSnapshot();
static void queueBleCommand(uint32_t commandBit);
static uint32_t takeBleCommands();
static bool startBle();
static void appendJsonOptionalFloat(String &json, bool valid, float value, uint8_t decimals);

void startWarmupCycle();
static void serviceBootButton();
static void handleShortBootPress();
static void handleLongBootPress();

static bool initCapacitiveMoistureSensor();
struct TouchStatistics;
struct MoisturePrediction;
static String buildMonitoringMoistureJson(
    const char *eventName,
    const TouchStatistics &touch,
    const MoisturePrediction &moisture,
    float previousMoisture,
    float moistureDrop);
static void startAutomaticMonitoring();
static void stopAutomaticMonitoring(bool userRequested);
static void serviceAutomaticMonitoring();
static void performMonitoringMoistureCheck(bool baseline);

void runOneDemonstration(bool monitoringMode = false);
bool initBsecClassifier();
struct SmellPrediction;
struct SmellSeverity;
bool initBme690();
static void printBsecStatus(const char *where, bsec_library_return_t status);
static void printBme690Status(const char *where, int8_t status);
static bool startBsecContinuousSession();
static void stopBsecContinuousSession();
static void serviceBsecContinuousSession();
static bool restartBsecForFreshMeasurementCycle();
static bool waitForNextValidGasIndexZero(uint32_t previousValidSequence, uint32_t timeoutMs);
static SmellPrediction waitForFreshBsecClassification(uint32_t previousSequence, uint32_t timeoutMs);
static SmellSeverity calculateSmellSeverity(const SmellPrediction &smell);

// ============================================================
// 1. 하드웨어 및 시간 설정
// ============================================================
static constexpr uint8_t BOOT_BUTTON_PIN = 0;

// 정전용량 수분센서 배선:
//   측정 전극(중앙/신호 전극) -> ESP32-S3 GPIO4
//   기준 전극(외곽/반대 전극) -> GND
// GPIO4는 ADC 입력이 아니라 ESP32-S3의 touchRead()로 직접 읽습니다.
static constexpr uint8_t TOUCH_SENSOR_PIN = 4;

static constexpr uint8_t FAN_CONTROL_PIN = 18;

static constexpr uint32_t WARMUP_TIME_MS = 10000UL;
static constexpr uint32_t FAN_RUN_TIME_MS = 2000;

// BLE 상태 알림과 팬 기동을 같은 순간에 겹치지 않게 분리합니다.
// 150 ms 후 팬 ON -> 2초 선행 흡입 -> BME fresh cycle 시작.
static constexpr uint32_t BLE_TO_FAN_GAP_MS = 150UL;

static constexpr uint32_t SENSOR_STABILIZE_MS = 300;

// 기존 학습 데이터와 동일하게 실제 판정에는 31개 샘플을 사용합니다.
// 첫 5회는 전극/터치 회로 안정화를 위해 버리고,
// 이후 31회를 5 ms 간격으로 측정합니다.
static constexpr size_t TOUCH_PRIME_READS = 5;
static constexpr uint32_t TOUCH_PRIME_INTERVAL_MS = 2;
static constexpr uint32_t TOUCH_SAMPLE_INTERVAL_MS = 5;
static constexpr size_t TOUCH_SAMPLE_COUNT = 31;

// BOOT 버튼은 인터럽트가 아니라 안정적인 debounced polling으로 길이를 측정합니다.
// 이전 자동 확인 코드와 동일한 기준: 1.5초 미만=짧게, 1.5초 이상=길게.
static constexpr uint32_t BOOT_DEBOUNCE_MS = 40UL;
static constexpr uint32_t BOOT_LONG_PRESS_MS = 1500UL;

// 자동 확인은 브라우저 타이머가 아니라 ESP32 자체 millis() 기준으로 30분마다 수행합니다.
static constexpr uint32_t MONITOR_INTERVAL_MS = 30UL * 60UL * 1000UL;
static constexpr float MONITOR_DRY_THRESHOLD_PERCENT = 10.0f;
static constexpr float MONITOR_MIN_MOISTURE_DECREASE_PERCENT = 1.0f;
static constexpr uint8_t MONITOR_MAX_ODOR_INCREASE_COUNT = 5;
static constexpr float MONITOR_ODOR_INCREASE_EPSILON = 0.5f;
static constexpr float MONITOR_HIGH_ODOR_SEVERITY_PERCENT = 75.0f;

// ============================================================
// AI Studio HP-501 + REAL BME690
// ============================================================
// IMPORTANT: verify these two GPIO numbers against the actual LOLIN S3 Pro
// I2C connector/pin labels before wiring. Only these two lines should need
// changing if your physical I2C pins are different.
static constexpr int BME690_SDA_PIN = 9;
static constexpr int BME690_SCL_PIN = 10;
static constexpr uint8_t BME690_I2C_ADDRESS = 0x76;

// HP-501 heater profile은 아래에서 직접 하드코딩하지 않습니다.
// AI Studio/BSEC configuration을 로드한 뒤 bsec_sensor_control()이
// 요구하는 heater profile / timing / operation mode를 그대로 BME690에 적용합니다.
static constexpr uint16_t BSEC_TOTAL_HEAT_DUR_MS = 140;

static struct bme69x_dev bme690Dev{};
static uint8_t bme690Address = BME690_I2C_ADDRESS;
static bool bme690Ready = false;

// AI Studio export is BSEC 3.3.0.0 and the exported configuration is 2001 bytes.
static constexpr uint32_t AI_BSEC_CONFIG_LEN = 2001;
static uint8_t AI_BSEC_WORK_BUFFER[BSEC_MAX_WORKBUFFER_SIZE];

struct SmellPrediction {
  float badProbability;
  float notBadProbability;
  uint8_t predictedClass;   // 1 = BAD, 2 = NOT BAD
  uint8_t accuracy;
  bool valid;
};

static SmellPrediction lastSmellPrediction{};
static bool bsecClassifierReady = false;
static void *bsecInstance = nullptr;
static uint8_t *bsecInstanceStorage = nullptr;
static size_t bsecInstanceStorageSize = 0;


// ============================================================
// 새 정전용량 수분 KNN 모델 — 이번에 제공된 3개 수건 CSV만 사용
// - dark brown 175 g / light brown 165 g / light gray 137 g
// - 총 원본 30행 중 1행은 touch_max=4194303, spread=4124489인
//   명백한 포화/오류 샘플이라 제외하여 29행을 사용합니다.
// - light gray의 117.88% 측정점은 물리적 표시 범위에 맞춰 100%로 clamp합니다.
// - 입력: GPIO4 touchRead 31회의 median, mean, min, max, spread
// - 방식: 5특징 표준화 + K=5 역거리 가중 KNN
// - 이전 22,000~27,500 RAW 강제 floor 보정은 새 데이터 분포(약 69k~80k)와
//   맞지 않으므로 완전히 제거합니다.
// ============================================================
// 이번 3개 CSV의 29개 유효 샘플을 touch_median 기준으로 정렬한 뒤,
// 서로 다른 수건에서 생긴 비단조 노이즈를 PAVA(isotonic regression)로 단조화했습니다.
// spread/min/max는 설치 배선과 노이즈에 따라 크게 흔들릴 수 있으므로
// 실제 수분량 판정에는 median을 사용하고, 나머지 통계는 품질 진단용으로 전송합니다.
static constexpr size_t MOISTURE_TRAINING_ROWS = 29;
static constexpr size_t MOISTURE_CALIBRATION_KNOTS = 12;
static constexpr uint32_t TRAINING_RAW_MIN = 69236u;
static constexpr uint32_t TRAINING_RAW_MAX = 80075u;
static constexpr uint32_t CALIBRATION_VALID_RAW_MIN = 65000u;
static constexpr uint32_t CALIBRATION_VALID_RAW_MAX = 85000u;

struct MoistureCalibrationKnot {
  uint32_t rawMedian;
  uint16_t moistureTimes100;
};

static const MoistureCalibrationKnot MOISTURE_CALIBRATION[MOISTURE_CALIBRATION_KNOTS] PROGMEM = {
  {69236u,     0u},
  {70064u,   295u},
  {70863u,   791u},
  {72877u,  1795u},
  {74150u,  2151u},
  {74978u,  3017u},
  {76342u,  5108u},
  {77250u,  6255u},
  {77268u,  6255u},
  {78132u,  6663u},
  {79166u,  8340u},
  {80075u, 10000u}
};

// HTML 기준 냄새 25 미만=낮음, 25~74=주의, 75 이상=높음.
// 냄새 1~5단계에는 BAD probability 자체가 아니라
// BAD × 상대 gas-resistance 변화량으로 만든 임시 severity를 전달합니다.

// BLE 기본 MTU가 작아도 안전한 크기로 JSON을 나눕니다.
static constexpr size_t JSON_CHUNK_DATA_BYTES = 8;
static constexpr uint32_t BLE_NOTIFY_GAP_MS = 25;

// ============================================================
// 2. HTML과 동일한 Nordic UART BLE UUID
// ============================================================
static const char *BLE_DEVICE_NAME = "IPJIMAYO";
static const char *SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
static const char *RX_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"; // HTML -> ESP32
static const char *TX_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; // ESP32 -> HTML

BLEServer *bleServer = nullptr;
BLECharacteristic *bleRxCharacteristic = nullptr;
BLECharacteristic *bleTxCharacteristic = nullptr;

volatile bool bleClientConnected = false;
volatile bool bleAppReady = false;
volatile bool warmupRequested = false;
volatile bool measurementRequested = false;
volatile bool warmupRunning = false;
volatile bool measurementRunning = false;

bool deviceWarmedUp = false;
bool systemInitializationReady = false;
uint32_t demoSequence = 0;

// BOOT 버튼 debounced polling 상태
static bool bootLastRawState = HIGH;
static bool bootStableState = HIGH;
static uint32_t bootChangedAt = 0;
static uint32_t bootPressedAt = 0;
static bool bootLongActionTriggered = false;

// 물리 버튼/앱 요청이 예열 완료 뒤 어디로 이어져야 하는지 기억합니다.
enum class WarmupOwner : uint8_t {
  NONE,
  DIAGNOSIS,
  MONITORING
};
static WarmupOwner warmupOwner = WarmupOwner::NONE;

// 자동 확인 상태
enum class MonitoringPhase : uint8_t {
  IDLE,
  WARMUP,
  BASELINE_PENDING,
  WAITING,
  MOISTURE_CHECK,
  ODOR_CHECK,
  DRY_COMPLETE,
  ENDED
};

static bool monitoringActive = false;
static bool monitoringBaselineValid = false;
static bool monitoringBaselineRequested = false;
static MonitoringPhase monitoringPhase = MonitoringPhase::IDLE;
static uint32_t monitoringNextCheckAt = 0;
static uint32_t monitoringCycleCount = 0;
static float monitoringPreviousMoisture = 0.0f;
static float monitoringLastOdorSeverity = 0.0f;
static bool monitoringLastOdorValid = false;
static uint8_t monitoringOdorIncreaseCount = 0;

// 마지막 full odor measurement를 monitoring logic에서 사용할 수 있게 보관합니다.
static float lastCompletedSmellSeverityPercent = 0.0f;
static float lastCompletedMoisturePercent = 0.0f;
static bool lastCompletedFullMeasurementValid = false;

// BLE callback에서는 센서/BSEC/팬/notify를 절대 직접 만지지 않습니다.
// 콜백은 아래 command bit만 큐에 넣고, 실제 처리는 Arduino loop/task 문맥에서 수행합니다.
enum BleCommandBit : uint32_t {
  BLE_CMD_NONE = 0,
  BLE_CMD_PING = 1UL << 0,
  BLE_CMD_COLD_RESET = 1UL << 1,
  BLE_CMD_WARMUP = 1UL << 2,
  BLE_CMD_MEASURE = 1UL << 3,
  BLE_CMD_GET_LAST_RESULT = 1UL << 4,
  BLE_CMD_START_MONITORING = 1UL << 5,
  BLE_CMD_STOP_MONITORING = 1UL << 6
};

static portMUX_TYPE bleCommandMux = portMUX_INITIALIZER_UNLOCKED;
static volatile uint32_t pendingBleCommandBits = BLE_CMD_NONE;
static bool coldResetPending = false;

// fresh HP-501 cycle 시작 시각.
// 재접속 후 PING을 받으면 D:P:<elapsed_ms>로 실제 진행 위치를 복원합니다.
static uint32_t measurementCycleStartedAt = 0;
static constexpr uint32_t HP501_CYCLE_DURATION_MS = 26880UL;

// 결과 전송 도중 링크가 끊겨도 재접속 후 GET_LAST_RESULT로 복구할 수 있도록 캐시합니다.
static String lastResultJsonCache;
static bool lastResultJsonAvailable = false;


// 앱에 표시할 실제 BME690 환경값.
// 실제 센서 데이터가 유효할 때만 JSON에 숫자를 넣고, 아직 없으면 null을 전송합니다.
static float latestBmeTemperatureC = 0.0f;
static float latestBmeHumidityPercent = 0.0f;
static bool latestBmeEnvironmentValid = false;

// 실제 결과 화면용 온/습도:
// 최종 판정에 사용한 fresh G0~G9 사이클 안에서 BME690이 읽은
// temperature / humidity의 평균값을 사용합니다.
static float measurementBmeTemperatureSum = 0.0f;
static float measurementBmeHumiditySum = 0.0f;
static uint16_t measurementBmeEnvironmentSamples = 0;
static float measurementBmeTemperatureC = 0.0f;
static float measurementBmeHumidityPercent = 0.0f;
static bool measurementBmeEnvironmentValid = false;

// HP-501 continuous session에서 완료된 BSEC classification 횟수.
// warmup progress와 fresh measurement result 판별에 사용합니다.
static uint32_t bsecClassificationSequence = 0;

// 유효 gas field 흐름 추적.
// 측정 버튼 이후 "다음 G0"에 정렬하고, 그 G0~G9 한 사이클만 결과로 사용합니다.
static uint32_t bsecValidGasSequence = 0;
static uint8_t bsecLastValidGasIndex = 255;

// 실제 측정용 한 사이클에서 G0~G9가 모두 들어왔는지 검증합니다.
static bool measurementCaptureActive = false;
static uint16_t measurementCaptureMask = 0;

// 임시 냄새 심각도 계산용 gas-resistance 기준값
// 상대변화율_i = |R_measure_i - R_baseline_i| / R_baseline_i
// Response(%) = 비교 가능한 G들의 평균 상대변화율 × 100 (최대 100)
// Severity(%) = BAD(%) × Response(%) / 100
static float backgroundGasResistance[10] = {};
static uint16_t backgroundGasValidMask = 0;

static float measurementBaselineGasResistance[10] = {};
static uint16_t measurementBaselineGasMask = 0;

static float measurementGasResistance[10] = {};
static uint16_t measurementGasResistanceMask = 0;

// ============================================================
// 3. 센서 결과 구조
// ============================================================
struct TouchStatistics {
  uint32_t median;
  float mean;
  uint32_t minimum;
  uint32_t maximum;
  uint32_t spread;
};

struct MoisturePrediction {
  float percent;
  float neighborStdDev;
  float nearestDistance;
  bool insideTrainingRawRange;
  bool calibrationValid;
};

struct SmellSeverity {
  float badPercent;
  float averageRelativeResistanceChange;
  float resistanceResponsePercent;
  float severityPercent;
  uint8_t comparedGasPoints;
  bool usedBadScoreFallback;
  bool valid;
};

// ============================================================
// 4. BLE 콜백
// ============================================================
static void queueBleCommand(uint32_t commandBit) {
  portENTER_CRITICAL(&bleCommandMux);
  pendingBleCommandBits |= commandBit;
  portEXIT_CRITICAL(&bleCommandMux);
}

static uint32_t takeBleCommands() {
  portENTER_CRITICAL(&bleCommandMux);
  const uint32_t commands = pendingBleCommandBits;
  pendingBleCommandBits = BLE_CMD_NONE;
  portEXIT_CRITICAL(&bleCommandMux);
  return commands;
}

class IpjimayoServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) override {
    (void)server;
    // 여기서는 상태 변수만 바꿉니다.
    // notification subscription 완료 전에는 어떤 notify도 보내지 않습니다.
    bleClientConnected = true;
    bleAppReady = false;
  }

  void onDisconnect(BLEServer *server) override {
    (void)server;
    bleClientConnected = false;
    bleAppReady = false;
    // 광고 재시작은 BLEServer::advertiseOnDisconnect(true)에 맡깁니다.
  }
};

class IpjimayoRxCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *characteristic) override {
    const auto received = characteristic->getValue();
    if (received.length() == 0) return;

    String command;
    command.reserve(received.length());
    for (size_t i = 0; i < received.length(); ++i) {
      command += static_cast<char>(received[i]);
    }
    command.trim();

    // 앱은 startNotifications()가 완료된 뒤에만 명령을 보냅니다.
    // 따라서 첫 명령을 받은 시점부터 notify 가능 상태로 간주합니다.
    bleAppReady = true;

    if (command.equalsIgnoreCase("PING")) {
      queueBleCommand(BLE_CMD_PING);
      return;
    }

    if (command.equalsIgnoreCase("APP_STATE:DIAGNOSIS_HOME_COLD") ||
        command.equalsIgnoreCase("RESET_WARMUP") ||
        command.equalsIgnoreCase("RESET_TO_COLD_HOME")) {
      queueBleCommand(BLE_CMD_COLD_RESET);
      return;
    }

    if (command.equalsIgnoreCase("START_WARMUP") ||
        command.equalsIgnoreCase("PREHEAT") ||
        command.equalsIgnoreCase("WARMUP")) {
      queueBleCommand(BLE_CMD_WARMUP);
      return;
    }

    if (command.equalsIgnoreCase("START_DIAGNOSIS") ||
        command.equalsIgnoreCase("MEASURE") ||
        command.equalsIgnoreCase("START_MEASUREMENT")) {
      queueBleCommand(BLE_CMD_MEASURE);
      return;
    }

    if (command.equalsIgnoreCase("START_MONITORING") ||
        command.equalsIgnoreCase("START_AUTO_MONITORING")) {
      queueBleCommand(BLE_CMD_START_MONITORING);
      return;
    }

    if (command.equalsIgnoreCase("STOP_MONITORING") ||
        command.equalsIgnoreCase("STOP_AUTO_MONITORING")) {
      queueBleCommand(BLE_CMD_STOP_MONITORING);
      return;
    }

    if (command.equalsIgnoreCase("GET_LAST_RESULT")) {
      queueBleCommand(BLE_CMD_GET_LAST_RESULT);
      return;
    }
  }
};

// ============================================================
// 5. BLE 송수신
// ============================================================
bool sendBleText(const String &message) {
  // 연결만 된 상태가 아니라, 브라우저가 notification subscription을 끝내고
  // 첫 RX 명령을 보낸 뒤에만 notify합니다.
  if (!bleClientConnected ||
      !bleAppReady ||
      bleTxCharacteristic == nullptr) {
    return false;
  }

  bleTxCharacteristic->setValue(
      reinterpret_cast<const uint8_t *>(message.c_str()),
      message.length());
  bleTxCharacteristic->notify();
  return true;
}

static void sendBleStateSnapshot() {
  if (!bleClientConnected || !bleAppReady) return;

  if (!systemInitializationReady) {
    sendBleText("D:E");
    return;
  }

  // 자동 확인이 완료/종료된 상태는 재접속 후에도 앱에 다시 알려줍니다.
  if (!monitoringActive && monitoringPhase == MonitoringPhase::DRY_COMPLETE) {
    sendBleText("M:D");
    return;
  }
  if (!monitoringActive && monitoringPhase == MonitoringPhase::ENDED) {
    sendBleText("M:E");
    return;
  }

  // 자동 확인이 활성화되어 있으면 진단 상태보다 자동 확인 상태를 우선 동기화합니다.
  if (monitoringActive) {
    switch (monitoringPhase) {
      case MonitoringPhase::WARMUP:
        sendBleText("M:W");
        break;
      case MonitoringPhase::BASELINE_PENDING:
        sendBleText("M:S");
        break;
      case MonitoringPhase::MOISTURE_CHECK:
        sendBleText("M:C");
        break;
      case MonitoringPhase::ODOR_CHECK:
        sendBleText("M:V");
        break;
      case MonitoringPhase::WAITING:
        sendBleText("M:B");
        break;
      case MonitoringPhase::DRY_COMPLETE:
        sendBleText("M:D");
        break;
      case MonitoringPhase::ENDED:
        sendBleText("M:E");
        break;
      case MonitoringPhase::IDLE:
      default:
        sendBleText("M:S");
        break;
    }
    return;
  }

  if (measurementRunning) {
    if (measurementCycleStartedAt != 0) {
      const uint32_t elapsed =
          min(millis() - measurementCycleStartedAt, HP501_CYCLE_DURATION_MS);
      String packet = "D:P:";
      packet += String(elapsed);
      sendBleText(packet);
    } else {
      sendBleText("D:M");
    }
    return;
  }

  if (warmupRunning) {
    sendBleText("D:W");
  } else if (deviceWarmedUp) {
    sendBleText("D:R");
  } else {
    sendBleText("D:C");
  }
}

static bool sendResultJsonInChunks(const String &json) {
  if (!sendBleText("JSON_BEGIN")) return false;
  delay(BLE_NOTIFY_GAP_MS);

  for (size_t offset = 0;
       offset < json.length();
       offset += JSON_CHUNK_DATA_BYTES) {

    if (!bleClientConnected || !bleAppReady) {
      Serial.println("BLE_RESULT|INTERRUPTED|LINK_NOT_READY");
      return false;
    }

    const size_t end =
        min(offset + JSON_CHUNK_DATA_BYTES, json.length());

    const String packet =
        "JSON_CHUNK:" + json.substring(offset, end);

    if (!sendBleText(packet)) {
      Serial.println("BLE_RESULT|INTERRUPTED|CHUNK_SEND_FAILED");
      return false;
    }

    delay(BLE_NOTIFY_GAP_MS);
    yield();
  }

  if (!sendBleText("JSON_END")) {
    Serial.println("BLE_RESULT|INTERRUPTED|JSON_END_FAILED");
    return false;
  }

  return true;
}

static void serviceBleCommandQueue() {
  const uint32_t commands = takeBleCommands();
  if (commands == BLE_CMD_NONE) return;

  // 상태를 변경하는 명령을 PING보다 먼저 처리하여 snapshot이 최종 상태를 반영하게 합니다.
  if (commands & BLE_CMD_COLD_RESET) {
    coldResetPending = true;
    Serial.println("BLE_CMD|COLD_RESET|LATCHED");
  }

  // RESET 요청은 busy 때문에 사라지지 않습니다.
  // full measurement 중이면 종료 직후, 그 외에는 즉시 실행합니다.
  if (coldResetPending && !measurementRunning) {
    coldResetPending = false;

    if (monitoringActive) {
      stopAutomaticMonitoring(false);
    }

    warmupRunning = false;
    deviceWarmedUp = false;
    warmupRequested = false;
    measurementRequested = false;
    warmupOwner = WarmupOwner::NONE;
    latestBmeEnvironmentValid = false;
    measurementCycleStartedAt = 0;

    digitalWrite(FAN_CONTROL_PIN, LOW);
    stopBsecContinuousSession();

    monitoringActive = false;
    monitoringBaselineValid = false;
    monitoringBaselineRequested = false;
    monitoringNextCheckAt = 0;
    monitoringCycleCount = 0;
    monitoringPhase = MonitoringPhase::IDLE;

    Serial.println("BLE_CMD|COLD_RESET|DONE");
    sendBleText("D:C");
  }

  if (commands & BLE_CMD_STOP_MONITORING) {
    if (monitoringActive) {
      stopAutomaticMonitoring(true);
    }
  }

  if (commands & BLE_CMD_START_MONITORING) {
    if (!monitoringActive && !measurementRunning && !warmupRunning) {
      startAutomaticMonitoring();
    }
  }

  if (commands & BLE_CMD_WARMUP) {
    if (!systemInitializationReady) {
      sendBleText("D:E");
    } else if (!monitoringActive && !warmupRunning && !measurementRunning) {
      // 앱의 "예열" 버튼은 예열만 하고 READY에서 멈춥니다.
      warmupOwner = WarmupOwner::NONE;
      deviceWarmedUp = false;
      warmupRequested = true;
      measurementRequested = false;
      Serial.println("BLE_CMD|WARMUP|QUEUED");
    }
  }

  if (commands & BLE_CMD_MEASURE) {
    if (!systemInitializationReady) {
      sendBleText("D:E");
    } else if (!monitoringActive && !warmupRunning && !measurementRunning) {
      if (monitoringPhase == MonitoringPhase::DRY_COMPLETE ||
          monitoringPhase == MonitoringPhase::ENDED) {
        monitoringPhase = MonitoringPhase::IDLE;
      }

      if (deviceWarmedUp) {
        measurementRequested = true;
        warmupOwner = WarmupOwner::NONE;
        Serial.println("BLE_CMD|MEASURE|QUEUED");
      } else {
        // 냉간 상태에서는 예열만 수행합니다.
        // READY 후 새 START_MEASUREMENT 또는 물리 BOOT 입력이 있어야 측정합니다.
        warmupOwner = WarmupOwner::DIAGNOSIS;
        warmupRequested = true;
        measurementRequested = false;
        Serial.println("BLE_CMD|MEASURE|WARMUP_ONLY_WAIT_SECOND_TRIGGER");
      }
    }
  }

  if (commands & BLE_CMD_GET_LAST_RESULT) {
    if (lastResultJsonAvailable && bleClientConnected && bleAppReady) {
      Serial.println("BLE_CMD|GET_LAST_RESULT|SEND_CACHE");
      (void)sendResultJsonInChunks(lastResultJsonCache);
    } else {
      Serial.println("BLE_CMD|GET_LAST_RESULT|NO_CACHE_OR_LINK");
    }
  }

  if (commands & BLE_CMD_PING) {
    sendBleText("PONG");
    sendBleStateSnapshot();
  }
}

static bool startBle() {
  // 기본 MTU(23)를 그대로 사용합니다.
  // JSON_CHUNK 패킷은 prefix 11 bytes + data 8 bytes = 19 bytes라
  // 기본 ATT payload(20 bytes)에 안전하게 들어갑니다.
  if (!BLEDevice::init(BLE_DEVICE_NAME)) {
    Serial.println("BLE|FATAL|DEVICE_INIT_FAILED");
    return false;
  }

  bleServer = BLEDevice::createServer();
  if (bleServer == nullptr) {
    Serial.println("BLE|FATAL|SERVER_CREATE_FAILED");
    return false;
  }

  bleServer->setCallbacks(new IpjimayoServerCallbacks());

  BLEService *service =
      bleServer->createService(SERVICE_UUID);

  if (service == nullptr) {
    Serial.println("BLE|FATAL|SERVICE_CREATE_FAILED");
    return false;
  }

  bleTxCharacteristic = service->createCharacteristic(
      TX_UUID,
      BLECharacteristic::PROPERTY_NOTIFY |
          BLECharacteristic::PROPERTY_READ);

  if (bleTxCharacteristic == nullptr) {
    Serial.println("BLE|FATAL|TX_CREATE_FAILED");
    return false;
  }

  bleTxCharacteristic->addDescriptor(new BLE2902());

  // 명령은 안정성을 위해 WRITE with response만 사용합니다.
  bleRxCharacteristic = service->createCharacteristic(
      RX_UUID,
      BLECharacteristic::PROPERTY_WRITE);

  if (bleRxCharacteristic == nullptr) {
    Serial.println("BLE|FATAL|RX_CREATE_FAILED");
    return false;
  }

  bleRxCharacteristic->setCallbacks(
      new IpjimayoRxCallbacks());

  service->start();

  // Espressif 공식 Server 예제와 같은 방식으로 disconnect 시 자동 광고 재시작.
  bleServer->advertiseOnDisconnect(true);

  BLEAdvertising *advertising =
      BLEDevice::getAdvertising();

  if (advertising == nullptr) {
    Serial.println("BLE|FATAL|ADVERTISING_OBJECT_FAILED");
    return false;
  }

  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  advertising->setMinPreferred(0x06);
  advertising->setMaxPreferred(0x12);

  BLEDevice::startAdvertising();

  Serial.println("BLE|READY|ADVERTISING|NAME=IPJIMAYO|MTU=DEFAULT_23");
  return true;
}

// ============================================================
// 6. BOOT 버튼 — 짧게/길게 누름 구분
// - GPIO0을 40 ms debounce polling으로 읽습니다.
// - 1.5초 미만:
//     * 냉간 상태: 10초 예열만 수행하고 READY에서 멈춤.
//     * READY 상태: 두 번째 짧은 누름으로 즉시 진단 측정 시작.
// - 1.5초 이상: 자동 확인 시작. 자동 확인 중 다시 길게 누르면 종료.
// - 센서/BLE/팬 처리는 모두 loop 문맥에서 실행됩니다.
// ============================================================
static void handleShortBootPress() {
  if (!systemInitializationReady) {
    Serial.println("BUTTON|SHORT|IGNORED_SYSTEM_INIT_ERROR");
    sendBleText("D:E");
    return;
  }

  if (monitoringActive) {
    Serial.println("BUTTON|SHORT|IGNORED_MONITORING_ACTIVE");
    return;
  }

  if (measurementRunning || measurementRequested || warmupRunning || warmupRequested) {
    Serial.println("BUTTON|SHORT|IGNORED_BUSY");
    return;
  }

  Serial.println("BUTTON|SHORT|DIAGNOSIS_REQUEST");

  // 이전 자동 확인 완료/종료 latch가 남아 있으면 새 진단 시작과 함께 해제합니다.
  if (!monitoringActive &&
      (monitoringPhase == MonitoringPhase::DRY_COMPLETE ||
       monitoringPhase == MonitoringPhase::ENDED)) {
    monitoringPhase = MonitoringPhase::IDLE;
  }

  if (deviceWarmedUp) {
    measurementRequested = true;
    warmupOwner = WarmupOwner::NONE;
    Serial.println("BUTTON|SHORT|READY_TO_MEASURE");
  } else {
    // 첫 짧은 누름은 예열만 수행합니다.
    // 예열 완료 후 READY에서 두 번째 짧은 BOOT 입력을 기다립니다.
    warmupOwner = WarmupOwner::DIAGNOSIS;
    warmupRequested = true;
    measurementRequested = false;
    Serial.println("BUTTON|SHORT|COLD_TO_WARMUP_ONLY");
  }
}

static void handleLongBootPress() {
  if (!systemInitializationReady) {
    Serial.println("BUTTON|LONG|IGNORED_SYSTEM_INIT_ERROR");
    sendBleText("D:E");
    return;
  }

  if (monitoringActive) {
    Serial.println("BUTTON|LONG|MONITORING_STOP_REQUEST");
    stopAutomaticMonitoring(true);
    return;
  }

  if (measurementRunning || measurementRequested || warmupRunning || warmupRequested) {
    Serial.println("BUTTON|LONG|IGNORED_BUSY");
    return;
  }

  Serial.println("BUTTON|LONG|MONITORING_START_REQUEST");
  startAutomaticMonitoring();
}

static void serviceBootButton() {
  const bool rawState = digitalRead(BOOT_BUTTON_PIN);
  const uint32_t nowMs = millis();

  if (rawState != bootLastRawState) {
    bootLastRawState = rawState;
    bootChangedAt = nowMs;
  }

  if ((nowMs - bootChangedAt) < BOOT_DEBOUNCE_MS) return;

  // 안정 LOW 상태에서는 release를 기다리지 않고 1.5초가 되는 순간 long 동작을 1회 실행.
  if (bootStableState == LOW && rawState == LOW) {
    if (!bootLongActionTriggered &&
        (nowMs - bootPressedAt) >= BOOT_LONG_PRESS_MS) {
      bootLongActionTriggered = true;
      handleLongBootPress();
    }
    return;
  }

  if (rawState == bootStableState) return;

  bootStableState = rawState;

  if (bootStableState == LOW) {
    bootPressedAt = nowMs;
    bootLongActionTriggered = false;
    Serial.println("BUTTON|PRESS|DEBOUNCED");
    return;
  }

  const uint32_t heldMs = nowMs - bootPressedAt;

  if (bootLongActionTriggered) {
    Serial.print("BUTTON|RELEASE|LONG_ALREADY_HANDLED|HELD_MS=");
    Serial.println(heldMs);
    bootLongActionTriggered = false;
    return;
  }

  if (heldMs >= BOOT_DEBOUNCE_MS) {
    handleShortBootPress();
  }
}

// ============================================================
// 7. 실제 HP-501 10초 예열
// - 첫 번째 BOOT: BSEC sensor_control 기반 HP-501 / RDC-1-0 연속 스캔 시작
// - 10초 동안 heater profile과 BSEC 처리를 계속 유지
// - 10초 완료 뒤에도 스캔을 멈추지 않고 READY 상태에서 계속 유지
// - 두 번째 BOOT: 이미 안정화된 연속 스캔 상태에서 측정
// ============================================================
uint32_t warmupStartedAt = 0;
uint32_t lastWarmupProgressPrintAt = 0;

void startWarmupCycle() {
  warmupRequested = false;

  if (deviceWarmedUp) {
    if (warmupOwner == WarmupOwner::DIAGNOSIS) {
      warmupOwner = WarmupOwner::NONE;
      measurementRequested = false;
      sendBleText("D:R");
    } else if (warmupOwner == WarmupOwner::MONITORING && monitoringActive) {
      warmupOwner = WarmupOwner::NONE;
      monitoringPhase = MonitoringPhase::BASELINE_PENDING;
      monitoringBaselineRequested = true;
      sendBleText("M:S");
    } else {
      sendBleText("D:R");
    }
    return;
  }

  digitalWrite(FAN_CONTROL_PIN, LOW);

  // 실제 HP-501 continuous session을 여기서 시작합니다.
  if (!startBsecContinuousSession()) {
    warmupRunning = false;
    deviceWarmedUp = false;
    Serial.println("WARMUP|ERROR|HP501_CONTINUOUS_SESSION_START_FAILED");

    if (monitoringActive) {
      monitoringPhase = MonitoringPhase::ENDED;
      monitoringActive = false;
      sendBleText("M:E");
    } else {
      sendBleText("D:C");
    }
    warmupOwner = WarmupOwner::NONE;
    return;
  }

  warmupRunning = true;
  warmupStartedAt = millis();
  lastWarmupProgressPrintAt = warmupStartedAt;

  Serial.println();
  Serial.println("==================================================");
  Serial.print("WARMUP|START|MODE=HP501_CONTINUOUS|DURATION_MS=");
  Serial.println(WARMUP_TIME_MS);
  Serial.println("WARMUP|BME690_HEATER_PROFILE_IS_ACTUALLY_RUNNING");

  if (warmupOwner == WarmupOwner::MONITORING) {
    monitoringPhase = MonitoringPhase::WARMUP;
    sendBleText("M:W");
  } else {
    sendBleText("D:W");
  }
}

void serviceWarmupCycle() {
  if (!warmupRunning) return;

  // 실제 BSEC/HP-501 스캔은 loop()의 serviceBsecContinuousSession()에서
  // 계속 처리되고 있습니다. 여기서는 정확히 10초 경과 여부만 관리합니다.
  const uint32_t nowMs = millis();
  const uint32_t elapsed = nowMs - warmupStartedAt;

  if (elapsed < WARMUP_TIME_MS) return;

  deviceWarmedUp = true;
  warmupRunning = false;

  Serial.print("WARMUP|COMPLETE|MODE=HP501_CONTINUOUS|ELAPSED_MS=");
  Serial.println(elapsed);
  Serial.println("WARMUP|HP501_SCAN_REMAINS_RUNNING");

  const WarmupOwner completedOwner = warmupOwner;
  warmupOwner = WarmupOwner::NONE;

  if (completedOwner == WarmupOwner::DIAGNOSIS) {
    // 예열 완료 후 READY에서 멈추고 두 번째 BOOT를 기다립니다.
    sendBleText("D:R");
    measurementRequested = false;
    Serial.println("WARMUP|NEXT=READY_WAIT_SECOND_BOOT");
  } else if (completedOwner == WarmupOwner::MONITORING && monitoringActive) {
    monitoringPhase = MonitoringPhase::BASELINE_PENDING;
    monitoringBaselineRequested = true;
    sendBleText("M:S");
    Serial.println("WARMUP|NEXT=MONITORING_BASELINE");
  } else {
    // 앱의 예열 버튼처럼 예열만 요청한 경우 READY에서 대기합니다.
    sendBleText("D:R");
    Serial.println("WARMUP|NEXT=READY");
  }

  Serial.println("==================================================");
}

// ============================================================
// 8. 정전용량 수분 센서(GPIO4) + 수분 비율
// ============================================================
//
// HTML과의 데이터 계약:
//   ESP32 -> BLE JSON
//   input.moistureStagnation : 최종 수분 예측값 0~100 (%)
//   sensor.rawMedian         : GPIO4 touchRead 중앙값
//   sensor.rawMean           : 평균
//   sensor.rawMin/rawMax     : 최소/최대
//   sensor.rawSpread         : max-min
//   sensor.predictedMoisturePercent : KNN 결과
//
// HTML은 input.moistureStagnation을 state.moistureValue로 받아
// 결과 화면의 물방울 5단계와 수분 유무 판단에 사용합니다.
// ============================================================
static bool initCapacitiveMoistureSensor() {
  // touchRead() 핀에는 일반 INPUT/OUTPUT pinMode를 적용하지 않습니다.
  // ESP32-S3 touch peripheral이 GPIO4를 직접 사용하도록 둡니다.
  delay(20);

  uint32_t lastRaw = 0;
  for (size_t i = 0; i < TOUCH_PRIME_READS; ++i) {
    lastRaw = touchRead(TOUCH_SENSOR_PIN);
    delay(TOUCH_PRIME_INTERVAL_MS);
  }

  Serial.print("MOISTURE_SENSOR|INIT|TYPE=CAPACITIVE_TOUCH");
  Serial.print("|PIN=GPIO");
  Serial.print(TOUCH_SENSOR_PIN);
  Serial.print("|PRIME_RAW=");
  Serial.println(lastRaw);

  // 정상적인 ESP32-S3 touchRead 값은 0이 아닌 raw count입니다.
  // 0이면 배선/핀/코어 설정 점검용 경고만 남기고 실행은 계속합니다.
  if (lastRaw == 0) {
    Serial.println("MOISTURE_SENSOR|WARNING|TOUCH_RAW_ZERO|CHECK_GPIO4_ELECTRODE_AND_GND");
    return false;
  }

  Serial.println("MOISTURE_SENSOR|READY|GPIO4_TOUCHREAD");
  return true;
}

void insertionSort(uint32_t *values, size_t count) {
  for (size_t i = 1; i < count; ++i) {
    const uint32_t key = values[i];
    size_t j = i;
    while (j > 0 && values[j - 1] > key) {
      values[j] = values[j - 1];
      --j;
    }
    values[j] = key;
  }
}

TouchStatistics readTouchStatistics() {
  uint32_t samples[TOUCH_SAMPLE_COUNT];
  uint64_t sum = 0;
  uint32_t minimum = UINT32_MAX;
  uint32_t maximum = 0;

  // 팬은 이 함수가 호출되기 전에 이미 OFF입니다.
  // touch peripheral의 첫 읽기 편차를 줄이기 위해 몇 회 버린 뒤 본 측정합니다.
  for (size_t i = 0; i < TOUCH_PRIME_READS; ++i) {
    (void)touchRead(TOUCH_SENSOR_PIN);
    delay(TOUCH_PRIME_INTERVAL_MS);
  }

  for (size_t i = 0; i < TOUCH_SAMPLE_COUNT; ++i) {
    const uint32_t value = touchRead(TOUCH_SENSOR_PIN);
    samples[i] = value;
    sum += value;
    minimum = min(minimum, value);
    maximum = max(maximum, value);
    delay(TOUCH_SAMPLE_INTERVAL_MS);
  }

  insertionSort(samples, TOUCH_SAMPLE_COUNT);

  TouchStatistics result{};
  result.median = samples[TOUCH_SAMPLE_COUNT / 2];
  result.mean = static_cast<float>(sum) / static_cast<float>(TOUCH_SAMPLE_COUNT);
  result.minimum = minimum;
  result.maximum = maximum;
  result.spread = maximum - minimum;
  return result;
}

MoisturePrediction predictMoistureFromTrainingData(const TouchStatistics &touch) {
  MoisturePrediction result{};

  const uint32_t raw = touch.median;
  result.insideTrainingRawRange =
      raw >= TRAINING_RAW_MIN && raw <= TRAINING_RAW_MAX;
  result.calibrationValid =
      raw >= CALIBRATION_VALID_RAW_MIN && raw <= CALIBRATION_VALID_RAW_MAX;

  if (raw <= TRAINING_RAW_MIN) {
    result.percent = 0.0f;
    result.neighborStdDev = 0.0f;
    result.nearestDistance =
        static_cast<float>(TRAINING_RAW_MIN - raw);
    return result;
  }

  if (raw >= TRAINING_RAW_MAX) {
    result.percent = 100.0f;
    result.neighborStdDev = 0.0f;
    result.nearestDistance =
        static_cast<float>(raw - TRAINING_RAW_MAX);
    return result;
  }

  MoistureCalibrationKnot left{};
  MoistureCalibrationKnot right{};

  for (size_t i = 0; i + 1 < MOISTURE_CALIBRATION_KNOTS; ++i) {
    memcpy_P(&left, &MOISTURE_CALIBRATION[i], sizeof(left));
    memcpy_P(&right, &MOISTURE_CALIBRATION[i + 1], sizeof(right));

    if (raw < left.rawMedian || raw > right.rawMedian) continue;

    const float x0 = static_cast<float>(left.rawMedian);
    const float x1 = static_cast<float>(right.rawMedian);
    const float y0 = static_cast<float>(left.moistureTimes100) / 100.0f;
    const float y1 = static_cast<float>(right.moistureTimes100) / 100.0f;

    const float t =
        (x1 > x0)
            ? constrain(
                  (static_cast<float>(raw) - x0) / (x1 - x0),
                  0.0f,
                  1.0f)
            : 0.0f;

    result.percent =
        constrain(y0 + (y1 - y0) * t, 0.0f, 100.0f);
    result.neighborStdDev = 0.0f;
    result.nearestDistance =
        min(
            fabsf(static_cast<float>(raw) - x0),
            fabsf(static_cast<float>(raw) - x1));
    return result;
  }

  result.percent = 0.0f;
  result.neighborStdDev = 0.0f;
  result.nearestDistance = -1.0f;
  result.calibrationValid = false;
  return result;
}

static void printBsecStatus(const char *where, bsec_library_return_t status) {
  Serial.print("BSEC_STATUS|");
  Serial.print(where);
  Serial.print("|");
  Serial.println((int)status);
}

bool initBsecClassifier() {
  // BSEC3 multi-instance API.
  // 최초 setup에서는 메모리를 할당하고, 측정 시 fresh G0 재시작에서는
  // 같은 메모리를 0으로 초기화한 뒤 bsec_init()을 다시 호출합니다.
  // 이렇게 해야 이전 HP-501 partial scan의 내부 분류 상태가
  // 새 G0~G9 결과에 섞이지 않습니다.
  const size_t requiredInstanceSize = bsec_get_instance_size();
  Serial.print("BSEC_INSTANCE_SIZE|");
  Serial.println((unsigned long)requiredInstanceSize);

  if (requiredInstanceSize == 0) {
    Serial.println("BSEC|FATAL|INVALID_INSTANCE_SIZE");
    return false;
  }

  bsecClassifierReady = false;

  if (bsecInstanceStorage == nullptr ||
      bsecInstanceStorageSize != requiredInstanceSize) {
    if (bsecInstanceStorage != nullptr) {
      free(bsecInstanceStorage);
      bsecInstanceStorage = nullptr;
      bsecInstance = nullptr;
    }

    bsecInstanceStorage =
        static_cast<uint8_t *>(calloc(1, requiredInstanceSize));
    if (bsecInstanceStorage == nullptr) {
      Serial.println("BSEC|FATAL|INSTANCE_ALLOC_FAILED");
      return false;
    }
    bsecInstanceStorageSize = requiredInstanceSize;
  } else {
    memset(bsecInstanceStorage, 0, bsecInstanceStorageSize);
  }

  bsecInstance = static_cast<void *>(bsecInstanceStorage);

  bsec_library_return_t status = bsec_init(bsecInstance);
  printBsecStatus("INIT", status);
  if (status < BSEC_OK) return false;

  bsec_version_t version{};
  status = bsec_get_version(bsecInstance, &version);
  printBsecStatus("GET_VERSION", status);

  Serial.print("BSEC_VERSION|");
  Serial.print(version.major);
  Serial.print(".");
  Serial.print(version.minor);
  Serial.print(".");
  Serial.print(version.major_bugfix);
  Serial.print(".");
  Serial.println(version.minor_bugfix);

  // AI Studio에서 Export for BSEC로 생성한 HP-501 설정을 그대로 사용합니다.
  status = bsec_set_configuration(
      bsecInstance,
      bsec_config_selectivity,
      AI_BSEC_CONFIG_LEN,
      AI_BSEC_WORK_BUFFER,
      sizeof(AI_BSEC_WORK_BUFFER));

  printBsecStatus("SET_AI_STUDIO_501_CONFIG", status);
  if (status < BSEC_OK) return false;

  // Classification 결과를 받기 위한 BSEC subscription.
  // AI Studio의 클래스 순서는 .aiconfig 기준:
  // class 1 = BAD, class 2 = NOT BAD.
  bsec_sensor_configuration_t requested[9]{};
  requested[0].sensor_id = BSEC_OUTPUT_GAS_ESTIMATE_1;
  requested[0].sample_rate = BSEC_SAMPLE_RATE_SCAN;
  requested[1].sensor_id = BSEC_OUTPUT_GAS_ESTIMATE_2;
  requested[1].sample_rate = BSEC_SAMPLE_RATE_SCAN;
  requested[2].sensor_id = BSEC_OUTPUT_GAS_ESTIMATE_3;
  requested[2].sample_rate = BSEC_SAMPLE_RATE_SCAN;
  requested[3].sensor_id = BSEC_OUTPUT_GAS_ESTIMATE_4;
  requested[3].sample_rate = BSEC_SAMPLE_RATE_SCAN;
  requested[4].sensor_id = BSEC_OUTPUT_RAW_TEMPERATURE;
  requested[4].sample_rate = BSEC_SAMPLE_RATE_SCAN;
  requested[5].sensor_id = BSEC_OUTPUT_RAW_PRESSURE;
  requested[5].sample_rate = BSEC_SAMPLE_RATE_SCAN;
  requested[6].sensor_id = BSEC_OUTPUT_RAW_HUMIDITY;
  requested[6].sample_rate = BSEC_SAMPLE_RATE_SCAN;
  requested[7].sensor_id = BSEC_OUTPUT_RAW_GAS;
  requested[7].sample_rate = BSEC_SAMPLE_RATE_SCAN;
  requested[8].sensor_id = BSEC_OUTPUT_RAW_GAS_INDEX;
  requested[8].sample_rate = BSEC_SAMPLE_RATE_SCAN;

  bsec_sensor_configuration_t required[BSEC_MAX_PHYSICAL_SENSOR]{};
  uint8_t nRequired = BSEC_MAX_PHYSICAL_SENSOR;

  status = bsec_update_subscription(
      bsecInstance,
      requested,
      9,
      required,
      &nRequired);

  printBsecStatus("UPDATE_SUBSCRIPTION", status);

  if (status < BSEC_OK) return false;

  Serial.print("BSEC_REQUIRED_INPUTS|");
  Serial.println(nRequired);
  for (uint8_t i = 0; i < nRequired; ++i) {
    Serial.print("INPUT|ID=");
    Serial.print(required[i].sensor_id);
    Serial.print("|RATE=");
    Serial.println(required[i].sample_rate, 6);
  }

  bsecClassifierReady = true;
  return true;
}

static int8_t bme690I2cRead(uint8_t reg_addr, uint8_t *reg_data, uint32_t len, void *intf_ptr) {
  const uint8_t address = *static_cast<uint8_t *>(intf_ptr);

  Wire.beginTransmission(address);
  Wire.write(reg_addr);
  if (Wire.endTransmission(false) != 0) {
    return -1;
  }

  const size_t received = Wire.requestFrom(address, static_cast<size_t>(len), true);
  if (received != len) {
    while (Wire.available()) {
      (void)Wire.read();
    }
    return -1;
  }

  for (uint32_t i = 0; i < len; ++i) {
    if (!Wire.available()) return -1;
    reg_data[i] = static_cast<uint8_t>(Wire.read());
  }

  return 0;
}

static int8_t bme690I2cWrite(uint8_t reg_addr, const uint8_t *reg_data, uint32_t len, void *intf_ptr) {
  const uint8_t address = *static_cast<uint8_t *>(intf_ptr);

  Wire.beginTransmission(address);
  if (Wire.write(reg_addr) != 1) return -1;

  for (uint32_t i = 0; i < len; ++i) {
    if (Wire.write(reg_data[i]) != 1) return -1;
  }

  return (Wire.endTransmission(true) == 0) ? 0 : -1;
}

static void bme690DelayUs(uint32_t period, void * /*intf_ptr*/) {
  delayMicroseconds(period);
}

static void printBme690Status(const char *where, int8_t status) {
  Serial.print("BME690_STATUS|");
  Serial.print(where);
  Serial.print("|");
  Serial.println(static_cast<int>(status));
}

bool initBme690() {
  Wire.begin(BME690_SDA_PIN, BME690_SCL_PIN);
  Wire.setClock(100000);

  Serial.println("BME690|I2C_INIT");
  Serial.print("BME690|SDA_GPIO=");
  Serial.print(BME690_SDA_PIN);
  Serial.print("|SCL_GPIO=");
  Serial.print(BME690_SCL_PIN);
  Serial.print("|ADDRESS=0x");
  Serial.println(BME690_I2C_ADDRESS, HEX);

  // Quick address check before entering the Bosch API.
  Wire.beginTransmission(BME690_I2C_ADDRESS);
  const uint8_t i2cError = Wire.endTransmission();
  if (i2cError != 0) {
    Serial.print("BME690|I2C_NOT_FOUND|ERROR=");
    Serial.println(i2cError);
    return false;
  }

  memset(&bme690Dev, 0, sizeof(bme690Dev));
  bme690Dev.intf = BME69X_I2C_INTF;
  bme690Dev.intf_ptr = &bme690Address;
  bme690Dev.read = bme690I2cRead;
  bme690Dev.write = bme690I2cWrite;
  bme690Dev.delay_us = bme690DelayUs;
  bme690Dev.amb_temp = 25;

  const int8_t initStatus = bme69x_init(&bme690Dev);
  printBme690Status("INIT", initStatus);
  if (initStatus != BME69X_OK) return false;

  Serial.print("BME690|CHIP_ID=0x");
  Serial.println(bme690Dev.chip_id, HEX);
  Serial.print("BME690|VARIANT_ID=");
  Serial.println(bme690Dev.variant_id);

  // Standard Bosch T/P/H measurement configuration used by the Sensor API.
  // If your original .bmeconfig contains a different T/P/H configuration,
  // this is one of the few settings to revisit after the hardware arrives.
  struct bme69x_conf conf{};
  conf.os_hum = BME69X_OS_1X;
  conf.os_temp = BME69X_OS_2X;
  conf.os_pres = BME69X_OS_16X;
  conf.filter = BME69X_FILTER_OFF;
  conf.odr = BME69X_ODR_NONE;

  const int8_t confStatus = bme69x_set_conf(&conf, &bme690Dev);
  printBme690Status("SET_TPH_CONFIG", confStatus);
  if (confStatus != BME69X_OK) return false;

  bme690Ready = true;
  Serial.println("BME690|READY|HP501");
  return true;
}

// ============================================================
// 9. BSEC sensor_control 기반 HP-501 연속 세션
// ============================================================
//
// 핵심:
// 1) 첫 BOOT에서 HP-501 / RDC-1-0 continuous session을 딱 한 번 시작합니다.
// 2) 10초 예열 중에도 bsec_sensor_control()을 계속 호출합니다.
// 3) 예열 완료 뒤에도 센서를 sleep/reset하지 않습니다.
// 4) 두 번째 BOOT 측정 때도 동일한 연속 스캔을 계속 유지합니다.
// 5) 측정 결과는 버튼을 누른 뒤 얻은 "새 classification"만 사용합니다.
//

static bsec_bme_settings_t bsecBmeSettings{};
static uint8_t bme690CurrentOpMode = BME69X_SLEEP_MODE;

static bool bsecContinuousActive = false;
static bool bsecDetailedLogging = false;
static bool bsecContinuousError = false;

// warmup 진행 표시 및 fresh-result 판별용 sequence는 전역 상태부에 선언되어 있습니다.

static bool applyBsecSettingsToBme690(
    const bsec_bme_settings_t &settings,
    uint8_t previousMode) {

  int8_t status = BME69X_OK;

  // FORCED MODE
  if (settings.op_mode == BME69X_FORCED_MODE) {
    struct bme69x_conf conf{};
    conf.os_hum = settings.humidity_oversampling;
    conf.os_temp = settings.temperature_oversampling;
    conf.os_pres = settings.pressure_oversampling;
    conf.filter = BME69X_FILTER_OFF;
    conf.odr = BME69X_ODR_NONE;

    status = bme69x_set_conf(&conf, &bme690Dev);
    if (status != BME69X_OK) {
      printBme690Status("BSEC_SET_TPH_FORCED", status);
      return false;
    }

    struct bme69x_heatr_conf heatr{};
    heatr.enable = BME69X_ENABLE;
    heatr.heatr_temp = settings.heater_temperature;
    heatr.heatr_dur = settings.heater_duration;

    status = bme69x_set_heatr_conf(
        BME69X_FORCED_MODE,
        &heatr,
        &bme690Dev);

    if (status != BME69X_OK) {
      printBme690Status("BSEC_SET_HEATER_FORCED", status);
      return false;
    }

    status = bme69x_set_op_mode(BME69X_FORCED_MODE, &bme690Dev);
    if (status != BME69X_OK) {
      printBme690Status("BSEC_SET_MODE_FORCED", status);
      return false;
    }

    bme690CurrentOpMode = BME69X_FORCED_MODE;
    return true;
  }

  // PARALLEL MODE
  // 이미 parallel이면 절대 재설정하지 않습니다.
  if (settings.op_mode == BME69X_PARALLEL_MODE) {
    if (previousMode == BME69X_PARALLEL_MODE) {
      bme690CurrentOpMode = BME69X_PARALLEL_MODE;
      return true;
    }

    struct bme69x_conf conf{};
    conf.os_hum = settings.humidity_oversampling;
    conf.os_temp = settings.temperature_oversampling;
    conf.os_pres = settings.pressure_oversampling;
    conf.filter = BME69X_FILTER_OFF;
    conf.odr = BME69X_ODR_NONE;

    status = bme69x_set_conf(&conf, &bme690Dev);
    if (status != BME69X_OK) {
      printBme690Status("BSEC_SET_TPH_PARALLEL", status);
      return false;
    }

    const uint32_t measDurationUs =
        bme69x_get_meas_dur(BME69X_PARALLEL_MODE, &conf, &bme690Dev);
    const uint16_t measDurationMs =
        static_cast<uint16_t>(measDurationUs / 1000UL);

    if (measDurationMs >= BSEC_TOTAL_HEAT_DUR_MS) {
      Serial.print("BSEC|ERROR|MEAS_DURATION_MS=");
      Serial.println(measDurationMs);
      return false;
    }

    struct bme69x_heatr_conf heatr{};
    heatr.enable = BME69X_ENABLE;
    heatr.heatr_temp_prof =
        const_cast<uint16_t *>(settings.heater_temperature_profile);
    heatr.heatr_dur_prof =
        const_cast<uint16_t *>(settings.heater_duration_profile);
    heatr.profile_len = settings.heater_profile_len;
    heatr.shared_heatr_dur =
        static_cast<uint16_t>(BSEC_TOTAL_HEAT_DUR_MS - measDurationMs);

    Serial.println("BSEC_PARALLEL|CONFIGURE_ONCE");
    Serial.print("BSEC_PARALLEL|PROFILE_LEN=");
    Serial.println(settings.heater_profile_len);
    Serial.print("BSEC_PARALLEL|MEAS_DURATION_MS=");
    Serial.println(measDurationMs);
    Serial.print("BSEC_PARALLEL|SHARED_HEATER_MS=");
    Serial.println(heatr.shared_heatr_dur);

    for (uint8_t i = 0; i < settings.heater_profile_len; ++i) {
      Serial.print("BSEC_PROFILE|INDEX=");
      Serial.print(i);
      Serial.print("|TEMP=");
      Serial.print(settings.heater_temperature_profile[i]);
      Serial.print("|DUR_MULT=");
      Serial.println(settings.heater_duration_profile[i]);
    }

    status = bme69x_set_heatr_conf(
        BME69X_PARALLEL_MODE,
        &heatr,
        &bme690Dev);

    if (status != BME69X_OK) {
      printBme690Status("BSEC_SET_HEATER_PARALLEL", status);
      return false;
    }

    status = bme69x_set_op_mode(BME69X_PARALLEL_MODE, &bme690Dev);
    if (status != BME69X_OK) {
      printBme690Status("BSEC_SET_MODE_PARALLEL", status);
      return false;
    }

    bme690CurrentOpMode = BME69X_PARALLEL_MODE;
    Serial.println("BSEC_PARALLEL|STARTED_CONTINUOUS");
    return true;
  }

  // SLEEP MODE - BSEC가 실제로 요청한 경우만 적용
  if (settings.op_mode == BME69X_SLEEP_MODE) {
    if (previousMode != BME69X_SLEEP_MODE) {
      status = bme69x_set_op_mode(BME69X_SLEEP_MODE, &bme690Dev);
      if (status != BME69X_OK) {
        printBme690Status("BSEC_SET_MODE_SLEEP", status);
        return false;
      }
    }

    bme690CurrentOpMode = BME69X_SLEEP_MODE;
    return true;
  }

  Serial.print("BSEC|UNSUPPORTED_OP_MODE=");
  Serial.println(settings.op_mode);
  return false;
}

static bool processValidBme690FieldThroughBsec(
    const struct bme69x_data &data,
    const bsec_bme_settings_t &settings,
    int64_t timestampNs) {

  if ((data.status & BME69X_GASM_VALID_MSK) == 0) {
    return true;
  }

  bsec_input_t inputs[BSEC_MAX_PHYSICAL_SENSOR]{};
  uint8_t nInputs = 0;

  if (BSEC_CHECK_INPUT(settings.process_data, BSEC_INPUT_HEATSOURCE)) {
    inputs[nInputs].sensor_id = BSEC_INPUT_HEATSOURCE;
    inputs[nInputs].signal = 0.0f;
    inputs[nInputs].signal_dimensions = 1;
    inputs[nInputs].time_stamp = timestampNs;
    ++nInputs;
  }

  if (BSEC_CHECK_INPUT(settings.process_data, BSEC_INPUT_TEMPERATURE)) {
    inputs[nInputs].sensor_id = BSEC_INPUT_TEMPERATURE;
    inputs[nInputs].signal = data.temperature;
    inputs[nInputs].signal_dimensions = 1;
    inputs[nInputs].time_stamp = timestampNs;
    ++nInputs;
  }

  if (BSEC_CHECK_INPUT(settings.process_data, BSEC_INPUT_HUMIDITY)) {
    inputs[nInputs].sensor_id = BSEC_INPUT_HUMIDITY;
    inputs[nInputs].signal = data.humidity;
    inputs[nInputs].signal_dimensions = 1;
    inputs[nInputs].time_stamp = timestampNs;
    ++nInputs;
  }

  if (BSEC_CHECK_INPUT(settings.process_data, BSEC_INPUT_PRESSURE)) {
    inputs[nInputs].sensor_id = BSEC_INPUT_PRESSURE;
    inputs[nInputs].signal = data.pressure;
    inputs[nInputs].signal_dimensions = 1;
    inputs[nInputs].time_stamp = timestampNs;
    ++nInputs;
  }

  if (BSEC_CHECK_INPUT(settings.process_data, BSEC_INPUT_GASRESISTOR)) {
    inputs[nInputs].sensor_id = BSEC_INPUT_GASRESISTOR;
    inputs[nInputs].signal = data.gas_resistance;
    inputs[nInputs].signal_dimensions = 1;
    inputs[nInputs].time_stamp = timestampNs;
    ++nInputs;
  }

  if (BSEC_CHECK_INPUT(settings.process_data, BSEC_INPUT_PROFILE_PART)) {
    inputs[nInputs].sensor_id = BSEC_INPUT_PROFILE_PART;
    inputs[nInputs].signal =
        (bme690CurrentOpMode == BME69X_FORCED_MODE)
            ? 0.0f
            : static_cast<float>(data.gas_index);
    inputs[nInputs].signal_dimensions = 1;
    inputs[nInputs].time_stamp = timestampNs;
    ++nInputs;
  }

  if (nInputs == 0) return true;

  bsec_output_t outputs[BSEC_NUMBER_OUTPUTS]{};
  uint8_t nOutputs = BSEC_NUMBER_OUTPUTS;

  const bsec_library_return_t status =
      bsec_do_steps(
          bsecInstance,
          inputs,
          nInputs,
          outputs,
          &nOutputs);

  if (status < BSEC_OK) {
    Serial.print("BSEC_DO_STEPS|ERROR=");
    Serial.println(static_cast<int>(status));
    return false;
  }

  bool gotClass1ThisCall = false;
  bool gotClass2ThisCall = false;
  float badThisCall = 0.0f;
  float notBadThisCall = 0.0f;
  uint8_t accuracyThisCall = 0;

  if (bsecDetailedLogging) {
    Serial.print("BSEC_OUTPUT_COUNT|");
    Serial.println(nOutputs);
  }

  for (uint8_t i = 0; i < nOutputs; ++i) {
    const bsec_output_t &out = outputs[i];

    if (bsecDetailedLogging) {
      Serial.print("BSEC_OUTPUT|ID=");
      Serial.print(out.sensor_id);
      Serial.print("|SIGNAL=");
      Serial.print(out.signal, 6);
      Serial.print("|ACCURACY=");
      Serial.println(out.accuracy);
    }

    if (out.sensor_id == BSEC_OUTPUT_GAS_ESTIMATE_1) {
      badThisCall = out.signal;
      accuracyThisCall = out.accuracy;
      gotClass1ThisCall = true;
    } else if (out.sensor_id == BSEC_OUTPUT_GAS_ESTIMATE_2) {
      notBadThisCall = out.signal;
      if (out.accuracy > accuracyThisCall) {
        accuracyThisCall = out.accuracy;
      }
      gotClass2ThisCall = true;
    }
  }

  // 동일한 bsec_do_steps() 결과에서 Class 1/2가 함께 나온 경우만
  // 새로운 classification으로 인정합니다.
  if (gotClass1ThisCall && gotClass2ThisCall) {
    lastSmellPrediction.badProbability = badThisCall;
    lastSmellPrediction.notBadProbability = notBadThisCall;
    lastSmellPrediction.accuracy = accuracyThisCall;
    lastSmellPrediction.predictedClass =
        (badThisCall >= notBadThisCall) ? 1 : 2;
    lastSmellPrediction.valid = true;

    ++bsecClassificationSequence;

    Serial.print("BSEC_CLASSIFICATION|SEQ=");
    Serial.print(bsecClassificationSequence);
    Serial.print("|BAD=");
    Serial.print(badThisCall * 100.0f, 4);
    Serial.print("%|NOT_BAD=");
    Serial.print(notBadThisCall * 100.0f, 4);
    Serial.print("%|CLASS=");
    Serial.print(lastSmellPrediction.predictedClass);
    Serial.print("|ACCURACY=");
    Serial.println(lastSmellPrediction.accuracy);
  }

  return true;
}

static bool startBsecContinuousSession() {
  if (bsecContinuousActive) return true;

  if (!bme690Ready) {
    Serial.println("BME690|NOT_READY");
    return false;
  }

  if (!bsecClassifierReady || bsecInstance == nullptr) {
    Serial.println("BSEC|NOT_READY");
    return false;
  }

  // Session 시작 시 한 번만 sleep 상태에서 출발합니다.
  // 이후 10초 예열 -> READY -> 측정 동안 reset/sleep하지 않습니다.
  (void)bme69x_set_op_mode(BME69X_SLEEP_MODE, &bme690Dev);
  bme690CurrentOpMode = BME69X_SLEEP_MODE;

  memset(&bsecBmeSettings, 0, sizeof(bsecBmeSettings));
  lastSmellPrediction = {};
  bsecClassificationSequence = 0;
  bsecValidGasSequence = 0;
  bsecLastValidGasIndex = 255;
  measurementCaptureActive = false;
  measurementCaptureMask = 0;
  bsecContinuousError = false;
  bsecDetailedLogging = false;
  bsecContinuousActive = true;

  Serial.println("BSEC_SESSION|START|HP501|RDC=1-0|CONTINUOUS=1");
  return true;
}

static void stopBsecContinuousSession() {
  if (bsecContinuousActive || bme690CurrentOpMode != BME69X_SLEEP_MODE) {
    (void)bme69x_set_op_mode(BME69X_SLEEP_MODE, &bme690Dev);
  }

  bme690CurrentOpMode = BME69X_SLEEP_MODE;
  memset(&bsecBmeSettings, 0, sizeof(bsecBmeSettings));

  bsecContinuousActive = false;
  bsecContinuousError = false;
  bsecDetailedLogging = false;
  lastSmellPrediction = {};
  bsecClassificationSequence = 0;
  bsecValidGasSequence = 0;
  bsecLastValidGasIndex = 255;
  measurementCaptureActive = false;
  measurementCaptureMask = 0;

  memset(backgroundGasResistance, 0, sizeof(backgroundGasResistance));
  backgroundGasValidMask = 0;
  memset(measurementBaselineGasResistance, 0, sizeof(measurementBaselineGasResistance));
  measurementBaselineGasMask = 0;
  memset(measurementGasResistance, 0, sizeof(measurementGasResistance));
  measurementGasResistanceMask = 0;

  Serial.println("BSEC_SESSION|STOP|SENSOR_SLEEP");
}


// ============================================================
// 측정 버튼용 FAST RESTART
// - 현재 HP-501이 G1~G8 어디에 있든 기다리지 않고 즉시 SLEEP으로 중단
// - BSEC classifier instance는 유지하여 RDC 1-0 Continuous 상태를 보존
// - 물리 BME690 heater cycle만 즉시 중단
// - 2초 팬 선행 흡입 후 HP-501을 다시 적용하여 fresh G0부터 시작
// ============================================================
static bool restartBsecForFreshMeasurementCycle() {
  Serial.println("FAST_G0|ABORT_CURRENT_CYCLE_NOW");

  // 현재 heater/parallel cycle을 즉시 중단합니다.
  const int8_t sleepStatus =
      bme69x_set_op_mode(BME69X_SLEEP_MODE, &bme690Dev);

  if (sleepStatus != BME69X_OK) {
    printBme690Status("FAST_G0_SET_SLEEP", sleepStatus);
    return false;
  }

  bme690CurrentOpMode = BME69X_SLEEP_MODE;
  bsecContinuousActive = false;
  bsecContinuousError = false;
  bsecDetailedLogging = false;
  memset(&bsecBmeSettings, 0, sizeof(bsecBmeSettings));

  lastSmellPrediction = {};
  bsecClassificationSequence = 0;
  bsecValidGasSequence = 0;
  bsecLastValidGasIndex = 255;
  measurementCaptureActive = false;
  measurementCaptureMask = 0;

  // 중요:
  // 측정할 때마다 bsec_init()/bsec_set_configuration()을 다시 호출하지 않습니다.
  // AI Studio 모델의 RDC 1-0 Continuous classifier 상태를 유지하고,
  // 물리 BME690 heater cycle만 즉시 중단합니다.
  Serial.println("FAST_G0|BSEC_CLASSIFIER_STATE_PRESERVED");
  Serial.println("FAST_G0|OLD_SENSOR_CYCLE_ABORTED|READY_FOR_FRESH_G0");
  return true;
}

static void serviceBsecContinuousSession() {
  if (!bsecContinuousActive || bsecContinuousError) return;

  const int64_t nowNs =
      esp_timer_get_time() * INT64_C(1000);

  // 아직 BSEC next_call 시간이 아니라면 바로 반환합니다.
  // 이 덕분에 10초 동안 loop()와 BLE가 막히지 않습니다.
  if (bsecBmeSettings.next_call > 0 &&
      nowNs < bsecBmeSettings.next_call) {
    return;
  }

  const uint8_t previousMode = bme690CurrentOpMode;

  const bsec_library_return_t controlStatus =
      bsec_sensor_control(
          bsecInstance,
          nowNs,
          &bsecBmeSettings);

  if (bsecDetailedLogging) {
    Serial.print("BSEC_SENSOR_CONTROL|STATUS=");
    Serial.print(static_cast<int>(controlStatus));
    Serial.print("|PREV_MODE=");
    Serial.print(previousMode);
    Serial.print("|OP_MODE=");
    Serial.print(bsecBmeSettings.op_mode);
    Serial.print("|TRIGGER=");
    Serial.print(bsecBmeSettings.trigger_measurement);
    Serial.print("|PROCESS_DATA=0x");
    Serial.print(bsecBmeSettings.process_data, HEX);
    Serial.print("|NEXT_CALL_NS=");
    Serial.println(static_cast<long long>(bsecBmeSettings.next_call));
  }

  if (controlStatus < BSEC_OK) {
    Serial.print("BSEC_SESSION|ERROR|SENSOR_CONTROL=");
    Serial.println(static_cast<int>(controlStatus));
    bsecContinuousError = true;
    return;
  }

  if (!applyBsecSettingsToBme690(
          bsecBmeSettings,
          previousMode)) {
    Serial.println("BSEC_SESSION|ERROR|APPLY_SETTINGS");
    bsecContinuousError = true;
    return;
  }

  if (!bsecBmeSettings.trigger_measurement ||
      bsecBmeSettings.op_mode == BME69X_SLEEP_MODE) {
    return;
  }

  // 현재 모델은 parallel mode지만 forced request도 안전하게 처리
  if (bsecBmeSettings.op_mode == BME69X_FORCED_MODE) {
    struct bme69x_conf forcedConf{};
    forcedConf.os_hum = bsecBmeSettings.humidity_oversampling;
    forcedConf.os_temp = bsecBmeSettings.temperature_oversampling;
    forcedConf.os_pres = bsecBmeSettings.pressure_oversampling;
    forcedConf.filter = BME69X_FILTER_OFF;
    forcedConf.odr = BME69X_ODR_NONE;

    const uint32_t measDurationUs =
        bme69x_get_meas_dur(
            BME69X_FORCED_MODE,
            &forcedConf,
            &bme690Dev);

    const uint32_t waitUs =
        measDurationUs +
        (static_cast<uint32_t>(bsecBmeSettings.heater_duration) * 1000UL) +
        2000UL;

    delayMicroseconds(waitUs);
  }

  struct bme69x_data data[3]{};
  uint8_t nFields = 0;

  const int8_t dataStatus =
      bme69x_get_data(
          bsecBmeSettings.op_mode,
          data,
          &nFields,
          &bme690Dev);

  if (dataStatus == BME69X_W_NO_NEW_DATA) {
    return;
  }

  if (dataStatus < BME69X_OK) {
    printBme690Status("BSEC_CONTINUOUS_GET_DATA", dataStatus);
    bsecContinuousError = true;
    return;
  }

  if (nFields == 0) return;

  for (uint8_t i = 0; i < nFields; ++i) {
    const bool gasValid =
        (data[i].status & BME69X_GASM_VALID_MSK) != 0;
    const bool heaterStable =
        (data[i].status & BME69X_HEAT_STAB_MSK) != 0;
    const bool newData =
        (data[i].status & BME69X_NEW_DATA_MSK) != 0;

    // bme69x_get_data()가 반환한 실제 보정 온도/습도 값을 항상 최신값으로 저장합니다.
    // NEW_DATA 비트에만 의존하면 parallel mode에서 온/습도 샘플을 놓칠 수 있으므로
    // 유효한 수치이면 직접 사용합니다.
    if (isfinite(data[i].temperature) && isfinite(data[i].humidity)) {
      latestBmeTemperatureC = data[i].temperature;
      latestBmeHumidityPercent = data[i].humidity;
      latestBmeEnvironmentValid = true;
    }

    if (bsecDetailedLogging) {
      Serial.print("BME_DATA|T=");
      Serial.print(data[i].temperature, 2);
      Serial.print("|H=");
      Serial.print(data[i].humidity, 2);
      Serial.print("|P=");
      Serial.print(data[i].pressure, 2);
      Serial.print("|GAS=");
      Serial.print(data[i].gas_resistance, 2);
      Serial.print("|STATUS=0x");
      Serial.print(data[i].status, HEX);
      Serial.print("|NEW_DATA=");
      Serial.print(newData ? 1 : 0);
      Serial.print("|GAS_VALID=");
      Serial.print(gasValid ? 1 : 0);
      Serial.print("|HEATER_STABLE=");
      Serial.print(heaterStable ? 1 : 0);
      Serial.print("|GAS_INDEX=");
      Serial.print(data[i].gas_index);
      Serial.print("|MEAS_INDEX=");
      Serial.println(data[i].meas_index);
    }

    if (!gasValid) continue;

    // 실제 유효 gas sample이 들어온 순서와 GAS_INDEX를 추적합니다.
    ++bsecValidGasSequence;
    bsecLastValidGasIndex = data[i].gas_index;

    // 측정 중이 아닐 때의 각 GAS_INDEX 최신 gas_resistance를 background로 유지합니다.
    if (!measurementRunning &&
        data[i].gas_index <= 9 &&
        isfinite(data[i].gas_resistance) &&
        data[i].gas_resistance > 0.0f) {
      const uint8_t idx = data[i].gas_index;
      backgroundGasResistance[idx] = data[i].gas_resistance;
      backgroundGasValidMask |= (uint16_t)(1U << idx);
    }

    if (measurementCaptureActive && data[i].gas_index <= 9) {
      const uint16_t gasBit = (uint16_t)(1U << data[i].gas_index);
      const bool firstCaptureForThisGasIndex =
          (measurementCaptureMask & gasBit) == 0;

      measurementCaptureMask |= gasBit;

      if (firstCaptureForThisGasIndex &&
          isfinite(data[i].gas_resistance) &&
          data[i].gas_resistance > 0.0f) {
        measurementGasResistance[data[i].gas_index] = data[i].gas_resistance;
        measurementGasResistanceMask |= gasBit;
      }

      // 최종 결과 화면 온/습도는 fresh G0~G9에서 실제 BME690이 측정한
      // 보정 temperature/humidity를 각 GAS_INDEX당 정확히 1번씩 평균냅니다.
      if (firstCaptureForThisGasIndex &&
          isfinite(data[i].temperature) &&
          isfinite(data[i].humidity)) {
        measurementBmeTemperatureSum += data[i].temperature;
        measurementBmeHumiditySum += data[i].humidity;
        ++measurementBmeEnvironmentSamples;
      }

      Serial.print("MEAS_CAPTURE|G");
      Serial.print(data[i].gas_index);
      Serial.print("|MASK=0x");
      Serial.println(measurementCaptureMask, HEX);
    }

    if (!processValidBme690FieldThroughBsec(
            data[i],
            bsecBmeSettings,
            nowNs)) {
      Serial.println("BSEC_SESSION|ERROR|DO_STEPS");
      bsecContinuousError = true;
      return;
    }
  }
}

static bool waitForNextValidGasIndexZero(
    uint32_t previousValidSequence,
    uint32_t timeoutMs) {

  const uint32_t startedAt = millis();

  Serial.print("BSEC_MEASUREMENT|WAIT_NEXT_G0|AFTER_VALID_SEQ=");
  Serial.println(previousValidSequence);

  while ((millis() - startedAt) < timeoutMs) {
    serviceBsecContinuousSession();

    if (bsecContinuousError) {
      Serial.println("BSEC_MEASUREMENT|FAILED|WAIT_G0_SESSION_ERROR");
      return false;
    }

    if (bsecValidGasSequence > previousValidSequence &&
        bsecLastValidGasIndex == 0) {
      Serial.print("BSEC_MEASUREMENT|G0_ALIGNED|VALID_SEQ=");
      Serial.print(bsecValidGasSequence);
      Serial.print("|CLASS_SEQ=");
      Serial.println(bsecClassificationSequence);
      return true;
    }

    serviceBleCommandQueue();

    delay(1);
    yield();
  }

  Serial.println("BSEC_MEASUREMENT|TIMEOUT|NEXT_G0_NOT_FOUND");
  return false;
}

static SmellPrediction waitForFreshBsecClassification(
    uint32_t previousSequence,
    uint32_t timeoutMs) {

  SmellPrediction result{};
  const uint32_t startedAt = millis();

  Serial.print("BSEC_MEASUREMENT|WAIT_FRESH_CLASSIFICATION|AFTER_SEQ=");
  Serial.println(previousSequence);

  while ((millis() - startedAt) < timeoutMs) {
    serviceBsecContinuousSession();

    if (bsecContinuousError) {
      Serial.println("BSEC_MEASUREMENT|FAILED|CONTINUOUS_SESSION_ERROR");
      return result;
    }

    if (bsecClassificationSequence > previousSequence &&
        lastSmellPrediction.valid) {
      result = lastSmellPrediction;

      Serial.print("BSEC_MEASUREMENT|FRESH_RESULT|SEQ=");
      Serial.print(bsecClassificationSequence);
      Serial.print("|BAD=");
      Serial.print(result.badProbability * 100.0f, 4);
      Serial.print("%|NOT_BAD=");
      Serial.print(result.notBadProbability * 100.0f, 4);
      Serial.print("%|CLASS=");
      Serial.print(result.predictedClass);
      Serial.print("|ACCURACY=");
      Serial.println(result.accuracy);

      return result;
    }

    // BLE 연결 상태 등 기본 housekeeping
    serviceBleCommandQueue();

    delay(1);
    yield();
  }

  Serial.println("BSEC_MEASUREMENT|TIMEOUT|NO_FRESH_CLASSIFICATION");
  return result;
}

// ============================================================
// 10. 7초 팬 + 실제 BME690/BSEC + 실제 수분 측정 흐름
// ============================================================

const char *smellScenarioLabel(const SmellPrediction &smell) {
  if (!smell.valid) return "INVALID";
  return smell.predictedClass == 1 ? "BAD" : "NOT BAD";
}

// ============================================================
// 9. 자동 확인 — ESP32 자체 30분 타이머 + 정전용량 센서
// ============================================================
static bool cacheAndSendResultJson(const String &json) {
  lastResultJsonCache = json;
  lastResultJsonAvailable = true;

  const bool delivered = sendResultJsonInChunks(lastResultJsonCache);
  if (!delivered) {
    Serial.println("BLE_RESULT|CACHED_FOR_RECONNECT");
  }
  return delivered;
}

static String buildMonitoringMoistureJson(
    const char *eventName,
    const TouchStatistics &touch,
    const MoisturePrediction &moisture,
    float previousMoisture,
    float moistureDrop) {

  String json;
  json.reserve(760);

  json += "{\"type\":\"result\",\"mode\":\"monitoring\"";
  json += ",\"showResultImmediately\":false";
  json += ",\"input\":{\"moistureStagnation\":";
  json += String(moisture.percent, 1);
  json += "}";

  json += ",\"weather\":{\"temperature\":";
  appendJsonOptionalFloat(
      json,
      latestBmeEnvironmentValid,
      latestBmeTemperatureC,
      1);
  json += ",\"humidity\":";
  appendJsonOptionalFloat(
      json,
      latestBmeEnvironmentValid,
      latestBmeHumidityPercent,
      1);
  json += "}";

  json += ",\"environmentValid\":";
  json += (latestBmeEnvironmentValid ? "true" : "false");
  json += ",\"environmentSource\":\"BME690_REAL_SENSOR\"";
  json += ",\"updatedAt\":";
  json += String(millis());

  json += ",\"monitoring\":{\"event\":\"";
  json += eventName;
  json += "\",\"cycle\":";
  json += String(monitoringCycleCount);
  json += ",\"intervalSeconds\":1800";
  json += ",\"previousMoisture\":";
  json += String(previousMoisture, 2);
  json += ",\"currentMoisture\":";
  json += String(moisture.percent, 2);
  json += ",\"moistureDrop\":";
  json += String(moistureDrop, 2);
  json += ",\"odorIncreaseCount\":";
  json += String(monitoringOdorIncreaseCount);
  json += "}";

  json += ",\"sensor\":{\"model\":\"CSV_ISOTONIC_MEDIAN_3TOWEL\"";
  json += ",\"sensorType\":\"ESP32S3_CAPACITIVE_TOUCH\"";
  json += ",\"trainingSource\":\"DARK_BROWN_175G_LIGHT_BROWN_165G_LIGHT_GRAY_137G\"";
  json += ",\"touchPin\":";
  json += String(TOUCH_SENSOR_PIN);
  json += ",\"sampleCount\":";
  json += String(TOUCH_SAMPLE_COUNT);
  json += ",\"trainingRows\":";
  json += String(MOISTURE_TRAINING_ROWS);
  json += ",\"trainingRawMin\":";
  json += String(TRAINING_RAW_MIN);
  json += ",\"trainingRawMax\":";
  json += String(TRAINING_RAW_MAX);
  json += ",\"rawMedian\":";
  json += String(touch.median);
  json += ",\"rawMean\":";
  json += String(touch.mean, 2);
  json += ",\"rawMin\":";
  json += String(touch.minimum);
  json += ",\"rawMax\":";
  json += String(touch.maximum);
  json += ",\"rawSpread\":";
  json += String(touch.spread);
  json += ",\"predictedMoisturePercent\":";
  json += String(moisture.percent, 2);
  json += ",\"neighborStdDev\":";
  json += String(moisture.neighborStdDev, 2);
  json += ",\"nearestDistance\":";
  json += String(moisture.nearestDistance, 4);
  json += ",\"insideTrainingRawRange\":";
  json += (moisture.insideTrainingRawRange ? "true" : "false");
  json += ",\"calibrationValid\":";
  json += (moisture.calibrationValid ? "true" : "false");
  json += "}}";

  return json;
}

static void startAutomaticMonitoring() {
  if (monitoringActive) return;

  monitoringActive = true;
  monitoringBaselineValid = false;
  monitoringBaselineRequested = false;
  monitoringNextCheckAt = 0;
  monitoringCycleCount = 0;
  monitoringPreviousMoisture = 0.0f;
  monitoringLastOdorSeverity = 0.0f;
  monitoringLastOdorValid = false;
  monitoringOdorIncreaseCount = 0;
  monitoringPhase = MonitoringPhase::BASELINE_PENDING;

  lastResultJsonCache = "";
  lastResultJsonAvailable = false;

  Serial.println("MONITOR|START|BOOT_LONG|INTERVAL_MS=1800000|NO_EXPLICIT_WARMUP");
  sendBleText("M:S");

  // 자동 확인은 시작 즉시 정전용량 baseline을 측정합니다.
  // BME690/BSEC는 30분 뒤 수분 정체 시 냄새 확인에 대비해 백그라운드에서 시작하지만
  // 사용자에게 별도의 10초 예열 단계를 요구하지 않습니다.
  if (!bsecContinuousActive || bsecContinuousError) {
    bsecContinuousError = false;
    if (startBsecContinuousSession()) {
      Serial.println("MONITOR|BME_BSEC_BACKGROUND_STARTED|NO_UI_WARMUP");
    } else {
      Serial.println("MONITOR|WARNING|BME_BSEC_BACKGROUND_START_FAILED|MOISTURE_MONITOR_CONTINUES");
    }
  }

  warmupOwner = WarmupOwner::NONE;
  warmupRequested = false;
  warmupRunning = false;
  monitoringPhase = MonitoringPhase::BASELINE_PENDING;
  monitoringBaselineRequested = true;
}

static void stopAutomaticMonitoring(bool userRequested) {
  monitoringActive = false;
  monitoringBaselineValid = false;
  monitoringBaselineRequested = false;
  monitoringNextCheckAt = 0;
  monitoringCycleCount = 0;
  monitoringPreviousMoisture = 0.0f;
  monitoringLastOdorValid = false;
  monitoringOdorIncreaseCount = 0;
  monitoringPhase = MonitoringPhase::IDLE;

  digitalWrite(FAN_CONTROL_PIN, LOW);

  Serial.print("MONITOR|STOP|SOURCE=");
  Serial.println(userRequested ? "USER_LONG_PRESS_OR_APP" : "SYSTEM");

  if (userRequested) {
    sendBleText("M:X");
  }
}

static void performMonitoringMoistureCheck(bool baseline) {
  if (!monitoringActive || measurementRunning || warmupRunning) return;

  monitoringPhase =
      baseline ? MonitoringPhase::BASELINE_PENDING
               : MonitoringPhase::MOISTURE_CHECK;

  if (!baseline) {
    sendBleText("M:C");
  }

  const TouchStatistics touch = readTouchStatistics();
  const MoisturePrediction moisture =
      predictMoistureFromTrainingData(touch);

  const float previous =
      baseline ? moisture.percent : monitoringPreviousMoisture;
  const float drop =
      baseline ? 0.0f : previous - moisture.percent;

  Serial.print("MONITOR_MOISTURE|BASELINE=");
  Serial.print(baseline ? "YES" : "NO");
  Serial.print("|CYCLE=");
  Serial.print(monitoringCycleCount);
  Serial.print("|RAW_MEDIAN=");
  Serial.print(touch.median);
  Serial.print("|PREDICTED_PERCENT=");
  Serial.print(moisture.percent, 2);
  Serial.print("|DROP_PERCENT_POINT=");
  Serial.println(drop, 2);

  if (baseline) {
    monitoringPreviousMoisture = moisture.percent;
    monitoringBaselineValid = true;
    monitoringPhase = MonitoringPhase::WAITING;
    monitoringNextCheckAt = millis() + MONITOR_INTERVAL_MS;

    const String json =
        buildMonitoringMoistureJson(
            "baseline",
            touch,
            moisture,
            moisture.percent,
            0.0f);
    (void)cacheAndSendResultJson(json);
    sendBleText("M:B");
    return;
  }

  ++monitoringCycleCount;

  // 수분이 10% 미만이면 건조 완료.
  if (moisture.percent < MONITOR_DRY_THRESHOLD_PERCENT) {
    monitoringPreviousMoisture = moisture.percent;
    monitoringNextCheckAt = 0;
    monitoringPhase = MonitoringPhase::DRY_COMPLETE;
    monitoringActive = false;

    const String json =
        buildMonitoringMoistureJson(
            "dry_complete",
            touch,
            moisture,
            previous,
            drop);
    (void)cacheAndSendResultJson(json);
    sendBleText("M:D");

    Serial.println("MONITOR|COMPLETE|MOISTURE_BELOW_10_PERCENT");
    return;
  }

  // 먼저 이번 30분 정전용량 측정값을 HTML에 전달합니다.
  const bool moistureDecreasing =
      drop >= MONITOR_MIN_MOISTURE_DECREASE_PERCENT;

  const String moistureJson =
      buildMonitoringMoistureJson(
          moistureDecreasing ? "moisture_decrease" : "stagnation",
          touch,
          moisture,
          previous,
          drop);
  (void)cacheAndSendResultJson(moistureJson);

  monitoringPreviousMoisture = moisture.percent;

  if (moistureDecreasing) {
    monitoringPhase = MonitoringPhase::WAITING;
    monitoringNextCheckAt = millis() + MONITOR_INTERVAL_MS;
    sendBleText("M:B");
    Serial.println("MONITOR|NORMAL_DRYING|NEXT_CHECK_30_MIN");
    return;
  }

  // 수분이 1%p 이상 감소하지 않았을 때만 냄새 full cycle을 수행합니다.
  monitoringPhase = MonitoringPhase::ODOR_CHECK;
  monitoringNextCheckAt = 0;
  sendBleText("M:V");
  Serial.println("MONITOR|STAGNATION|START_ODOR_MEASUREMENT");

  lastCompletedFullMeasurementValid = false;
  runOneDemonstration(true);

  if (!monitoringActive) {
    return;
  }

  if (lastCompletedFullMeasurementValid) {
    const float currentSeverity =
        lastCompletedSmellSeverityPercent;

    if (monitoringLastOdorValid &&
        currentSeverity >
            monitoringLastOdorSeverity + MONITOR_ODOR_INCREASE_EPSILON) {
      if (monitoringOdorIncreaseCount < 255) {
        ++monitoringOdorIncreaseCount;
      }
      Serial.print("MONITOR|ODOR_INCREASE|COUNT=");
      Serial.println(monitoringOdorIncreaseCount);
    }

    monitoringLastOdorSeverity = currentSeverity;
    monitoringLastOdorValid = true;

    if (monitoringOdorIncreaseCount >= MONITOR_MAX_ODOR_INCREASE_COUNT ||
        currentSeverity >= MONITOR_HIGH_ODOR_SEVERITY_PERCENT) {
      monitoringNextCheckAt = 0;
      monitoringPhase = MonitoringPhase::ENDED;
      monitoringActive = false;
      sendBleText("M:E");
      Serial.println("MONITOR|ENDED|ODOR_RISK");
      return;
    }
  }

  monitoringPhase = MonitoringPhase::WAITING;
  monitoringNextCheckAt = millis() + MONITOR_INTERVAL_MS;
  sendBleText("M:B");
}

static void serviceAutomaticMonitoring() {
  if (!monitoringActive) return;

  if (monitoringBaselineRequested &&
      !warmupRunning &&
      !measurementRunning) {
    monitoringBaselineRequested = false;
    performMonitoringMoistureCheck(true);
    return;
  }

  if (!monitoringBaselineValid ||
      monitoringPhase != MonitoringPhase::WAITING ||
      monitoringNextCheckAt == 0 ||
      measurementRunning ||
      warmupRunning) {
    return;
  }

  if (static_cast<int32_t>(millis() - monitoringNextCheckAt) < 0) {
    return;
  }

  monitoringNextCheckAt = 0;
  performMonitoringMoistureCheck(false);
}

static SmellSeverity calculateSmellSeverity(
    const SmellPrediction &smell) {

  SmellSeverity result{};
  result.badPercent =
      constrain(smell.badProbability * 100.0f, 0.0f, 100.0f);

  if (!smell.valid) {
    Serial.println("SMELL_SEVERITY|INVALID_BSEC_CLASSIFICATION");
    return result;
  }

  const uint16_t comparableMask =
      measurementBaselineGasMask &
      measurementGasResistanceMask &
      0x03FF;

  float relativeChangeSum = 0.0f;
  uint8_t compared = 0;

  for (uint8_t i = 0; i < 10; ++i) {
    const uint16_t bit = (uint16_t)(1U << i);
    if ((comparableMask & bit) == 0) continue;

    const float baseline = measurementBaselineGasResistance[i];
    const float measured = measurementGasResistance[i];

    if (!isfinite(baseline) || !isfinite(measured) || baseline <= 0.0f) continue;

    const float relativeChange =
        fabsf(measured - baseline) / baseline;

    relativeChangeSum += relativeChange;
    ++compared;

    Serial.print("SMELL_RESISTANCE|G");
    Serial.print(i);
    Serial.print("|BASE=");
    Serial.print(baseline, 2);
    Serial.print("|MEASURE=");
    Serial.print(measured, 2);
    Serial.print("|REL_CHANGE_PERCENT=");
    Serial.println(relativeChange * 100.0f, 2);
  }

  result.comparedGasPoints = compared;

  // 첫 진단의 10초 예열은 HP-501 전체 26.88초보다 짧아서
  // G0~G9 background baseline이 충분하지 않을 수 있습니다.
  // BSEC BAD 결과가 유효한데도 상대저항 baseline 부족 때문에 0%가 되는 것을 막습니다.
  if (compared < 3) {
    result.averageRelativeResistanceChange = 0.0f;
    result.resistanceResponsePercent = 0.0f;
    result.severityPercent = result.badPercent;
    result.usedBadScoreFallback = true;
    result.valid = true;

    Serial.print("SMELL_SEVERITY|FALLBACK=BAD_SCORE|COMPARED_G=");
    Serial.print(compared);
    Serial.print("|BAD_PERCENT=");
    Serial.println(result.badPercent, 2);
    return result;
  }

  result.averageRelativeResistanceChange =
      relativeChangeSum / static_cast<float>(compared);

  result.resistanceResponsePercent =
      constrain(
          result.averageRelativeResistanceChange * 100.0f,
          0.0f,
          100.0f);

  // 임시 공식: BAD score × 상대 저항 변화량
  result.severityPercent =
      constrain(
          result.badPercent *
          result.resistanceResponsePercent /
          100.0f,
          0.0f,
          100.0f);

  result.usedBadScoreFallback = false;
  result.valid = true;
  return result;
}

static void appendJsonOptionalFloat(
    String &json,
    bool valid,
    float value,
    uint8_t decimals) {
  if (valid && isfinite(value)) {
    // ESP32 Arduino Core 3.3.x에서 uint8_t는 unsigned char이므로
    // String(float, uint8_t)가 정수 base 오버로드와 충돌할 수 있습니다.
    // decimalPlaces 타입을 명확히 unsigned int로 지정합니다.
    json += String(value, static_cast<unsigned int>(decimals));
  } else {
    json += "null";
  }
}

String buildResultJson(uint32_t sequence,
                       const SmellPrediction &smell,
                       const SmellSeverity &severity,
                       const MoisturePrediction &moisture,
                       const TouchStatistics &touch,
                       bool monitoringMode) {
  String json;
  json.reserve(900);

  // HTML 냄새 1~5단계에는 BAD 자체가 아니라
  // BAD × 상대 gas-resistance 변화량으로 만든 임시 severity를 전달합니다.
  const float smellSeverityPercent =
      severity.valid ? severity.severityPercent : 0.0f;

  json += "{\"input\":{\"smellStagnation\":";
  if (severity.valid) {
    json += String(smellSeverityPercent, 1);
  } else {
    json += "null";
  }
  // HTML의 handleFirebaseControlData()/BLE direct handler가 실제로 읽는 필드.
  // 이 값이 그대로 state.moistureValue가 되어 물방울 5단계에 반영됩니다.
  json += ",\"moistureStagnation\":";
  json += String(moisture.percent, 1);
  const bool resultEnvironmentValid =
      measurementBmeEnvironmentValid || latestBmeEnvironmentValid;
  const float resultTemperatureC =
      measurementBmeEnvironmentValid
          ? measurementBmeTemperatureC
          : latestBmeTemperatureC;
  const float resultHumidityPercent =
      measurementBmeEnvironmentValid
          ? measurementBmeHumidityPercent
          : latestBmeHumidityPercent;

  json += "},\"weather\":{\"temperature\":";
  appendJsonOptionalFloat(json, resultEnvironmentValid, resultTemperatureC, 1);
  json += ",\"humidity\":";
  appendJsonOptionalFloat(json, resultEnvironmentValid, resultHumidityPercent, 1);
  json += "},\"environmentValid\":";
  json += (resultEnvironmentValid ? "true" : "false");
  json += ",\"environmentSource\":\"BME690_REAL_SENSOR\"";
  json += ",\"updatedAt\":";
  json += String(millis());
  json += ",\"mode\":\"";
  json += (monitoringMode ? "monitoring" : "diagnosis");
  json += "\"";
  json += ",\"showResultImmediately\":";
  json += (monitoringMode ? "false" : "true");

  if (monitoringMode) {
    // 이 packet은 같은 30분 주기의 수분 packet 뒤에 오는 냄새 결과이므로
    // HTML에서 monitoring cycle을 두 번 세지 않도록 표시합니다.
    json += ",\"monitoring\":{\"event\":\"odor_result\"";
    json += ",\"skipMonitoringCycle\":true";
    json += ",\"cycle\":";
    json += String(monitoringCycleCount);
    json += ",\"odorIncreaseCount\":";
    json += String(monitoringOdorIncreaseCount);
    json += ",\"intervalSeconds\":1800}";
  }

  json += ",\"demo\":{\"sequence\":";
  json += String(sequence);
  json += ",\"scenario\":\"";
  json += smellScenarioLabel(smell);
  json += "\",\"warmupSeconds\":10";
  json += ",\"fanSeconds\":2";
  json += ",\"touchMedian\":";
  json += String(touch.median);
  json += ",\"touchMean\":";
  json += String(touch.mean, 2);
  json += ",\"touchMin\":";
  json += String(touch.minimum);
  json += ",\"touchMax\":";
  json += String(touch.maximum);
  json += ",\"touchSpread\":";
  json += String(touch.spread);
  json += ",\"predictedMoisturePercent\":";
  json += String(moisture.percent, 2);
  json += "}";

  json += ",\"smellAI\":{\"model\":\"AI_STUDIO_BSEC_SENSOR_CONTROL\"";
  json += ",\"badProbability\":";
  json += String(smell.badProbability, 4);
  json += ",\"notBadProbability\":";
  json += String(smell.notBadProbability, 4);
  json += ",\"predictedClass\":";
  json += String(smell.predictedClass);
  json += ",\"predictedLabel\":\"";
  json += smellScenarioLabel(smell);
  json += "\",\"accuracy\":";
  json += String(smell.accuracy);
  json += ",\"valid\":";
  json += (smell.valid ? "true" : "false");
  json += ",\"resistanceBaselineValid\":";
  json += (severity.comparedGasPoints >= 3 ? "true" : "false");
  json += ",\"usedBadScoreFallback\":";
  json += (severity.usedBadScoreFallback ? "true" : "false");
  json += ",\"baselineGasMask\":";
  json += String(measurementBaselineGasMask);
  json += ",\"measurementGasMask\":";
  json += String(measurementGasResistanceMask);
  json += ",\"comparedGasPoints\":";
  json += String(severity.comparedGasPoints);
  json += ",\"averageRelativeResistanceChange\":";
  json += String(severity.averageRelativeResistanceChange, 4);
  json += ",\"resistanceResponsePercent\":";
  json += String(severity.resistanceResponsePercent, 2);
  json += ",\"severityPercent\":";
  json += String(severity.severityPercent, 2);
  json += ",\"severityFormula\":\"BAD_PERCENT_X_RELATIVE_RESISTANCE_CHANGE_PERCENT_DIV_100\"";
  json += "}";

  json += ",\"sensor\":{\"model\":\"CSV_ISOTONIC_MEDIAN_3TOWEL\"";
  json += ",\"sensorType\":\"ESP32S3_CAPACITIVE_TOUCH\"";
  json += ",\"trainingSource\":\"DARK_BROWN_175G_LIGHT_BROWN_165G_LIGHT_GRAY_137G\"";
  json += ",\"touchPin\":";
  json += String(TOUCH_SENSOR_PIN);
  json += ",\"sampleCount\":";
  json += String(TOUCH_SAMPLE_COUNT);
  json += ",\"moistureOutputField\":\"input.moistureStagnation\"";
  json += ",\"trainingRows\":";
  json += String(MOISTURE_TRAINING_ROWS);
  json += ",\"trainingRawMin\":";
  json += String(TRAINING_RAW_MIN);
  json += ",\"trainingRawMax\":";
  json += String(TRAINING_RAW_MAX);
  json += ",\"rawMedian\":";
  json += String(touch.median);
  json += ",\"rawMean\":";
  json += String(touch.mean, 2);
  json += ",\"rawMin\":";
  json += String(touch.minimum);
  json += ",\"rawMax\":";
  json += String(touch.maximum);
  json += ",\"rawSpread\":";
  json += String(touch.spread);
  json += ",\"predictedMoisturePercent\":";
  json += String(moisture.percent, 2);
  json += ",\"neighborStdDev\":";
  json += String(moisture.neighborStdDev, 2);
  json += ",\"nearestDistance\":";
  json += String(moisture.nearestDistance, 4);
  json += ",\"insideTrainingRawRange\":";
  json += (moisture.insideTrainingRawRange ? "true" : "false");
  json += ",\"calibrationValid\":";
  json += (moisture.calibrationValid ? "true" : "false");
  json += ",\"bmeTemperatureC\":";
  appendJsonOptionalFloat(json, resultEnvironmentValid, resultTemperatureC, 2);
  json += ",\"bmeHumidityPercent\":";
  appendJsonOptionalFloat(json, resultEnvironmentValid, resultHumidityPercent, 2);
  json += ",\"bmeEnvironmentSamples\":";
  json += String(measurementBmeEnvironmentSamples);
  json += "}}";

  return json;
}

void runOneDemonstration(bool monitoringMode) {
  measurementRequested = false;
  lastCompletedFullMeasurementValid = false;

  if (!deviceWarmedUp && !monitoringMode) {
    Serial.println("MEASUREMENT|BLOCKED|HP501_10S_WARMUP_REQUIRED");
    warmupRequested = true;
    return;
  }

  // 자동 확인은 별도의 10초 UI 예열을 사용하지 않습니다.
  // 자동 확인 시작 시 BSEC를 백그라운드에서 시작하므로 첫 냄새 확인 시점에는
  // 일반적으로 이미 충분히 연속 동작한 상태입니다.
  if (!bsecContinuousActive || bsecContinuousError) {
    if (monitoringMode) {
      bsecContinuousError = false;
      if (!startBsecContinuousSession()) {
        Serial.println("MEASUREMENT|BLOCKED|MONITOR_BME_BSEC_START_FAILED");
        sendBleText("M:B");
        return;
      }
      Serial.println("MEASUREMENT|MONITOR_BME_BSEC_RESTARTED_WITHOUT_UI_WARMUP");
    } else {
      Serial.println("MEASUREMENT|BLOCKED|HP501_CONTINUOUS_SESSION_NOT_ACTIVE");
      return;
    }
  }

  measurementRunning = true;
  ++demoSequence;

  // 새 측정이 시작되면 이전 측정 결과 캐시는 폐기합니다.
  // 측정 도중 재접속이 발생했을 때 과거 결과를 잘못 재전송하지 않게 합니다.
  lastResultJsonCache = "";
  lastResultJsonAvailable = false;

  // BOOT 직전까지 수집된 최신 gas resistance를 이번 측정 baseline으로 동결합니다.
  memcpy(
      measurementBaselineGasResistance,
      backgroundGasResistance,
      sizeof(measurementBaselineGasResistance));
  measurementBaselineGasMask = backgroundGasValidMask;

  memset(measurementGasResistance, 0, sizeof(measurementGasResistance));
  measurementGasResistanceMask = 0;

  uint8_t baselinePointCount = 0;
  for (uint8_t i = 0; i < 10; ++i) {
    if (measurementBaselineGasMask & (uint16_t)(1U << i)) {
      ++baselinePointCount;
    }
  }

  Serial.print("SMELL_BASELINE|MASK=0x");
  Serial.print(measurementBaselineGasMask, HEX);
  Serial.print("|AVAILABLE_G_POINTS=");
  Serial.println(baselinePointCount);

  const uint32_t startedAt = millis();

  // BOOT 측정 시작:
  // 1) 앱에 분석 시작 알림
  // 2) 150 ms 동안 BLE/RTOS 처리 여유
  // 3) 팬 ON
  // 4) 2초 선행 흡입
  // 5) BME fresh HP-501 cycle 시작
  measurementCycleStartedAt = 0;
  if (!monitoringMode) {
    sendBleText("D:M");
  } else {
    sendBleText("M:V");
  }

  const uint32_t bleToFanStartedAt = millis();
  while ((millis() - bleToFanStartedAt) < BLE_TO_FAN_GAP_MS) {
    serviceBleCommandQueue();
    delay(1);
    yield();
  }

  digitalWrite(FAN_CONTROL_PIN, HIGH);

  Serial.println();
  Serial.println("==================================================");
  Serial.print("DEMO|START|SEQUENCE=");
  Serial.print(demoSequence);
  Serial.println("|MODEL=0812_TEST_HP501_BSEC33");
  Serial.println("MEASUREMENT_MODE|ABORT_OLD_CYCLE_NOW|PREFLOW_2S|FRESH_G0_TO_G9");
  Serial.println("FAN|ON|STARTED_SIMULTANEOUSLY_WITH_MEASUREMENT");

  // -----------------------------------------------------------
  // STEP 1. 기존 HP-501 cycle 즉시 중단.
  // 예전처럼 남은 Gx~G9가 끝날 때까지 기다리지 않습니다.
  // BSEC classifier는 유지하고 물리 heater cycle만 즉시 중단합니다.
  // -----------------------------------------------------------
  if (!restartBsecForFreshMeasurementCycle()) {
    digitalWrite(FAN_CONTROL_PIN, LOW);
    measurementCycleStartedAt = 0;
    measurementRunning = false;
    Serial.println("MEASUREMENT|FAILED|FAST_G0_RESTART_PREP_FAILED");
    sendBleText(monitoringMode ? "M:B" : "D:R");
    return;
  }

  // -----------------------------------------------------------
  // STEP 2. 기존 cycle은 이미 완전히 멈춘 상태에서 팬만 2초 선행 흡입.
  // -----------------------------------------------------------
  Serial.println("MEAS_STEP|1|OLD_CYCLE_ABORTED_IMMEDIATELY");
  Serial.println("MEAS_STEP|2|FAN_PREFLOW_START|DURATION_MS=2000|SENSOR_CYCLE_STOPPED");

  const uint32_t fanPreflowStartedAt = millis();
  while ((millis() - fanPreflowStartedAt) < FAN_RUN_TIME_MS) {
    serviceBleCommandQueue();
    delay(1);
    yield();
  }

  Serial.println("MEAS_STEP|2|FAN_PREFLOW_COMPLETE|START_FRESH_HP501_NOW");

  // -----------------------------------------------------------
  // STEP 3. fresh BSEC session 시작.
  // 방금 BSEC를 새로 초기화했기 때문에 HP-501은 profile 처음부터 시작합니다.
  // 즉 이전 cycle의 남은 Gx~G9를 기다리지 않습니다.
  // -----------------------------------------------------------
  if (!startBsecContinuousSession()) {
    digitalWrite(FAN_CONTROL_PIN, LOW);
    measurementCycleStartedAt = 0;
    measurementRunning = false;
    Serial.println("MEASUREMENT|FAILED|FRESH_HP501_START_FAILED");
    sendBleText(monitoringMode ? "M:B" : "D:R");
    return;
  }

  // 앱의 26.88초 진행바는 바로 이 시점부터 시작합니다.
  // D:M은 분석 화면 진입용, D:G는 fresh HP-501 G0 사이클 시작 기준점입니다.
  measurementCycleStartedAt = millis();
  if (!monitoringMode) {
    sendBleText("D:G");
  }
  Serial.println("BLE|CYCLE_START|HP501_DURATION_MS=26880");

  bsecDetailedLogging = false;

  // fresh measurement 환경값 capture 초기화
  measurementCaptureMask = 0;
  measurementCaptureActive = true;
  measurementBmeTemperatureSum = 0.0f;
  measurementBmeHumiditySum = 0.0f;
  measurementBmeEnvironmentSamples = 0;
  measurementBmeEnvironmentValid = false;

  // 새 세션의 첫 유효 gas sample G0를 기다립니다.
  // 여기서는 "기존 cycle 완료 대기"가 아니라 새 G0가 실제로 생성될 때까지의
  // G0 heater dwell/measurement 시간만 기다립니다.
  const bool gotFreshG0 =
      waitForNextValidGasIndexZero(
          0,
          15000UL);

  if (!gotFreshG0) {
    digitalWrite(FAN_CONTROL_PIN, LOW);
    bsecDetailedLogging = false;
    measurementCaptureActive = false;
    measurementCaptureMask = 0;
    measurementCycleStartedAt = 0;
    measurementRunning = false;

    Serial.println("MEASUREMENT|FAILED|FRESH_G0_NOT_FOUND");
    Serial.println("FAN|OFF");
    Serial.println("==================================================");
    sendBleText(monitoringMode ? "M:B" : "D:R");
    return;
  }

  const uint32_t classificationAtG0 = bsecClassificationSequence;

  Serial.print("MEAS_STEP|3|FRESH_G0_STARTED|CLASS_SEQ=");
  Serial.println(classificationAtG0);
  Serial.println("MEAS_STEP|3|FAN_STAYS_ON_DURING_FRESH_G0_TO_G9");

  // -----------------------------------------------------------
  // STEP 4. fresh G0~G9 전체가 완료되고 새 BSEC classification이 나올 때까지
  // 팬을 계속 ON으로 유지합니다.
  // -----------------------------------------------------------
  SmellPrediction smell =
      waitForFreshBsecClassification(
          classificationAtG0,
          60000UL);

  measurementCaptureActive = false;

  const uint16_t expectedFullMask = 0x03FF;
  const bool fullCycleCaptured =
      ((measurementCaptureMask & expectedFullMask) == expectedFullMask);

  // G0~G9 동안 실제 BME690이 읽은 온/습도 평균 확정
  if (measurementBmeEnvironmentSamples > 0) {
    measurementBmeTemperatureC =
        measurementBmeTemperatureSum /
        static_cast<float>(measurementBmeEnvironmentSamples);
    measurementBmeHumidityPercent =
        measurementBmeHumiditySum /
        static_cast<float>(measurementBmeEnvironmentSamples);
    measurementBmeEnvironmentValid = true;
  }

  Serial.print("MEAS_STEP|4|CAPTURE_MASK=0x");
  Serial.print(measurementCaptureMask, HEX);
  Serial.print("|EXPECTED=0x3FF|FULL_G0_G9=");
  Serial.println(fullCycleCaptured ? "YES" : "NO");

  Serial.print("BME_ENV_RESULT|SOURCE=FRESH_G0_G9_AVERAGE|SAMPLES=");
  Serial.print(measurementBmeEnvironmentSamples);
  Serial.print("|TEMP_C=");
  Serial.print(
      measurementBmeEnvironmentValid ? measurementBmeTemperatureC : latestBmeTemperatureC,
      2);
  Serial.print("|HUMIDITY_PERCENT=");
  Serial.println(
      measurementBmeEnvironmentValid ? measurementBmeHumidityPercent : latestBmeHumidityPercent,
      2);

  // 분석 완료 후 팬 OFF
  digitalWrite(FAN_CONTROL_PIN, LOW);
  Serial.println("MEAS_STEP|5|FAN_OFF_AFTER_FRESH_G0_TO_G9");

  if (!fullCycleCaptured) {
    Serial.println("MEASUREMENT|WARNING|FRESH_G0_TO_G9_CAPTURE_INCOMPLETE|KEEP_VALID_BSEC_CLASSIFICATION");
  }

  // BAD score와 G0~G9 상대 저항 변화량을 결합한 임시 심각도
  const SmellSeverity severity =
      calculateSmellSeverity(smell);

  Serial.print("SMELL_SEVERITY|BAD_PERCENT=");
  Serial.print(severity.badPercent, 2);
  Serial.print("|RESPONSE_PERCENT=");
  Serial.print(severity.resistanceResponsePercent, 2);
  Serial.print("|SEVERITY_PERCENT=");
  Serial.print(severity.severityPercent, 2);
  Serial.print("|COMPARED_G=");
  Serial.print(severity.comparedGasPoints);
  Serial.print("|VALID=");
  Serial.println(severity.valid ? "YES" : "NO");

  measurementCaptureMask = 0;

  // 수분센서
  const TouchStatistics touch = readTouchStatistics();
  const MoisturePrediction moisture =
      predictMoistureFromTrainingData(touch);

  Serial.print("TOUCH|MEDIAN=");
  Serial.print(touch.median);
  Serial.print("|MEAN=");
  Serial.print(touch.mean, 2);
  Serial.print("|MIN=");
  Serial.print(touch.minimum);
  Serial.print("|MAX=");
  Serial.print(touch.maximum);
  Serial.print("|SPREAD=");
  Serial.println(touch.spread);

  const float smellPercent =
      constrain(smell.badProbability * 100.0f, 0.0f, 100.0f);

  Serial.print("MOISTURE_BLE|GPIO=");
  Serial.print(TOUCH_SENSOR_PIN);
  Serial.print("|RAW_MEDIAN=");
  Serial.print(touch.median);
  Serial.print("|RAW_MEAN=");
  Serial.print(touch.mean, 2);
  Serial.print("|PREDICTED_PERCENT=");
  Serial.print(moisture.percent, 2);
  Serial.print("|CALIBRATION_VALID=");
  Serial.println(moisture.calibrationValid ? "YES" : "NO");

  Serial.print("RESULT|SMELL_BAD_PROBABILITY=");
  Serial.print(smellPercent, 3);
  Serial.print("|SMELL_SEVERITY_PERCENT=");
  Serial.print(severity.severityPercent, 3);
  Serial.print("|SMELL_CLASS=");
  Serial.print(smellScenarioLabel(smell));
  Serial.print("|FULL_G0_G9=");
  Serial.print(fullCycleCaptured ? "YES" : "NO");
  Serial.print("|MOISTURE_PERCENT=");
  Serial.print(moisture.percent, 2);
  Serial.print("|BME_TEMP_C=");
  Serial.print(
      measurementBmeEnvironmentValid ? measurementBmeTemperatureC : latestBmeTemperatureC,
      2);
  Serial.print("|BME_HUMIDITY=");
  Serial.println(
      measurementBmeEnvironmentValid ? measurementBmeHumidityPercent : latestBmeHumidityPercent,
      2);

  Serial.print("BLE_RESULT_ENV|VALID=");
  Serial.print((measurementBmeEnvironmentValid || latestBmeEnvironmentValid) ? "YES" : "NO");
  Serial.print("|TEMP_C=");
  if (measurementBmeEnvironmentValid) {
    Serial.print(measurementBmeTemperatureC, 2);
  } else if (latestBmeEnvironmentValid) {
    Serial.print(latestBmeTemperatureC, 2);
  } else {
    Serial.print("NULL");
  }
  Serial.print("|HUMIDITY_PERCENT=");
  if (measurementBmeEnvironmentValid) {
    Serial.println(measurementBmeHumidityPercent, 2);
  } else if (latestBmeEnvironmentValid) {
    Serial.println(latestBmeHumidityPercent, 2);
  } else {
    Serial.println("NULL");
  }

  lastCompletedSmellSeverityPercent =
      severity.valid ? severity.severityPercent : 0.0f;
  lastCompletedMoisturePercent = moisture.percent;
  lastCompletedFullMeasurementValid =
      fullCycleCaptured && smell.valid;

  const String json = buildResultJson(
      demoSequence,
      smell,
      severity,
      moisture,
      touch,
      monitoringMode);

  Serial.print("JSON|");
  Serial.println(json);

  // 전송 전에 결과를 캐시합니다. 전송 중 disconnect가 나도 재접속 후 복구 가능합니다.
  lastResultJsonCache = json;
  lastResultJsonAvailable = true;

  const bool resultDelivered =
      sendResultJsonInChunks(lastResultJsonCache);

  if (resultDelivered) {
    delay(40);
    if (!monitoringMode) {
      sendBleText("D:S");
    }
    Serial.println("BLE_RESULT|DELIVERED");
  } else {
    Serial.println("BLE_RESULT|CACHED_FOR_RECONNECT");
  }

  Serial.print("DEMO|COMPLETE|ELAPSED_MS=");
  Serial.println(millis() - startedAt);
  Serial.println("DEMO|FRESH_HP501_CONTINUES_AFTER_MEASUREMENT");
  Serial.println("==================================================");

  bsecDetailedLogging = false;

  measurementCycleStartedAt = 0;
  measurementRunning = false;
}

// ============================================================
// 11. Arduino 기본 함수
// ============================================================

void setup() {
  Serial.begin(115200);
  delay(250);

  const esp_reset_reason_t resetReason =
      esp_reset_reason();

  Serial.print("ESP32_RESET_REASON|CODE=");
  Serial.println(static_cast<int>(resetReason));

  if (resetReason == ESP_RST_BROWNOUT) {
    Serial.println(
        "ESP32_RESET_REASON|BROWNOUT|CHECK_POWER_FAN_MOSFET_GND");
  }

  // 1) 출력은 가장 먼저 안전 상태로 고정
  pinMode(FAN_CONTROL_PIN, OUTPUT);
  digitalWrite(FAN_CONTROL_PIN, LOW);
  pinMode(BOOT_BUTTON_PIN, INPUT_PULLUP);

  Serial.println();
  Serial.println("IPJIMAYO_STABLE_BLE_V3|BOOT");
  Serial.println("AI_MODEL|NAME=0812_test|HP=501|RDC=1-0|BSEC=3.3.0.0|CLASS1=BAD|CLASS2=NOT_BAD");
  Serial.println("STATE|BOOTING|BLE_ADVERTISING_WILL_START_AFTER_ALL_SENSOR_INIT");

  // 2) 정전용량 센서 초기화
  Serial.print("MOISTURE_SENSOR|WIRING|SIGNAL=GPIO");
  Serial.print(TOUCH_SENSOR_PIN);
  Serial.println("|REFERENCE=GND");

  const bool moistureReady =
      initCapacitiveMoistureSensor();

  // 3) BSEC classifier 초기화
  const bool bsecReady =
      initBsecClassifier();

  if (!bsecReady) {
    Serial.println("BSEC|FATAL|AI_STUDIO_CONFIG_INIT_FAILED");
  } else {
    Serial.println("BSEC|READY|AI_STUDIO_CONFIG");
  }

  // 4) BME690 초기화
  Serial.print("BME690|I2C|SDA=");
  Serial.print(BME690_SDA_PIN);
  Serial.print("|SCL=");
  Serial.print(BME690_SCL_PIN);
  Serial.print("|ADDR=0x");
  Serial.println(BME690_I2C_ADDRESS, HEX);

  const bool bmeReady =
      initBme690();

  if (!bmeReady) {
    Serial.println("BME690|FATAL|CHECK_I2C_PINS_ADDRESS_AND_WIRING");
  }

  systemInitializationReady =
      moistureReady && bsecReady && bmeReady;

  Serial.print("SYSTEM_INIT|");
  Serial.println(systemInitializationReady ? "READY" : "ERROR");

  // 5) 센서/BSEC 초기화가 모두 끝난 뒤에만 BLE stack과 광고 시작.
  const bool bleReady =
      startBle();

  if (!bleReady) {
    Serial.println("BLE|FATAL|START_FAILED");
  }

  // 6) BOOT는 interrupt가 아닌 debounced polling으로 읽습니다.
  // setup 시점의 현재 상태를 초기값으로 잡아 부팅 직후 가짜 press를 방지합니다.
  bootLastRawState = digitalRead(BOOT_BUTTON_PIN);
  bootStableState = bootLastRawState;
  bootChangedAt = millis();
  bootPressedAt = 0;

  Serial.println("BUTTON|READY|SHORT_LT_1500MS=DIAGNOSIS|LONG_GE_1500MS=MONITORING");
  Serial.println("SETUP|COMPLETE");
}

void loop() {
  // BLE callback에서 들어온 명령은 항상 loop 문맥에서 가장 먼저 처리.
  serviceBleCommandQueue();

  // 짧게/길게 누름은 polling으로 판별합니다.
  serviceBootButton();

  // 예열 중 / READY / 자동 확인 대기 중 모두 HP-501 / BSEC 연속 처리.
  serviceBsecContinuousSession();
  serviceWarmupCycle();

  if (warmupRequested &&
      !warmupRunning &&
      !measurementRunning) {
    startWarmupCycle();
  }

  // 자동 확인 baseline/30분 주기 측정은 ESP32 자체 타이머로 실행합니다.
  serviceAutomaticMonitoring();

  if (measurementRequested &&
      !warmupRunning &&
      !measurementRunning &&
      !monitoringActive) {
    runOneDemonstration(false);
  }

  delay(2);
  yield();
}
