#include <Arduino.h>
#include "digitalOutput.h"
#include "global.cpp"


auto digitalOutputSetup = [](uint8_t data[MAX_PAYLOAD_LENGTH_BYTES]) {
  Serial.println("setup");
  pinMode(data[0], OUTPUT);
};

auto digitalOutputWrite = [](uint8_t data[MAX_PAYLOAD_LENGTH_BYTES]) {
  Serial.println("write");
  digitalWrite(data[0], data[1]);
};

void digitalOutputBegin() {
  functionsArray[10] = digitalOutputSetup;
  functionsArray[11] = digitalOutputWrite;
}
