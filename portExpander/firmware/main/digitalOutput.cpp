#include <Arduino.h>
#include "digitalOutput.h"
#include "global.cpp"
#include "protocol.h"


auto digitalOutputSetup = [](uint8_t data[], int dataLength) {
  pinMode(data[0], OUTPUT);
};

auto digitalOutputWrite = [](uint8_t data[], int dataLength) {
  digitalWrite(data[0], data[1]);
};


void digitalOutputBegin() {
  registerFunc(10, digitalOutputSetup);
  registerFunc(11, digitalOutputWrite);
}
