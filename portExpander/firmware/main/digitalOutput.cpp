#include <Arduino.h>
#include "digitalOutput.h"
#include "global.cpp"
#include "protocol.h"


auto digitalOutputSetup = [](uint8_t data[], int dataLength) {
  //Serial.println("setup");
  pinMode(data[0], OUTPUT);
};

auto digitalOutputWrite = [](uint8_t data[], int dataLength) {
  //Serial.println("write");
  digitalWrite(data[0], data[1]);
};


void digitalOutputBegin() {
  registerFunc(10, digitalOutputSetup);
  registerFunc(11, digitalOutputWrite);
}
