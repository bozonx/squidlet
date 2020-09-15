#include <Arduino.h>
#include <Wire.h>
#include "funcI2cMater.h"
//#include "global.cpp"
#include "protocol.h"


typedef enum __attribute__ ((packed))  {
  FUNC_SETUP = 40,
  FUNC_WRITE,
  FUNC_READ
} I2cMasterFunctionNum;

typedef enum __attribute__ ((packed))  {
  FEEDBACK_READ = 43
} I2cMasterFeedbackNum;


auto i2cMasterSetup = [](uint8_t data[], int dataLength) {
  Wire.begin();
};

auto i2cMasterWrite = [](uint8_t data[], int dataLength) {
  digitalWrite(data[0], data[1]);
};

auto i2cMasterRead = [](uint8_t data[], int dataLength) {
  digitalWrite(data[0], data[1]);
};


void i2cMasterBegin() {
  registerFunc(FUNC_SETUP, i2cMasterSetup);
  registerFunc(FUNC_WRITE, i2cMasterWrite);
  registerFunc(FUNC_READ, i2cMasterRead);
}
