#include <Arduino.h>
#include "funcDigitalOutput.h"
#include "global.cpp"
#include "protocol.h"


typedef enum __attribute__ ((packed))  {
  FUNC_SETUP = 10,
  FUNC_WRITE
} DigitalOutputFunctionNum;


auto digitalOutputSetup = [](uint8_t data[], int dataLength) {
  pinMode(data[0], OUTPUT);
};

auto digitalOutputWrite = [](uint8_t data[], int dataLength) {
  digitalWrite(data[0], data[1]);
};


void digitalOutputBegin() {
  registerFunc(FUNC_SETUP, digitalOutputSetup);
  registerFunc(FUNC_WRITE, digitalOutputWrite);
}
