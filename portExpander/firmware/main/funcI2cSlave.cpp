#include <Arduino.h>
#include <Wire.h>
#include "funcI2cSlave.h"
//#include "global.cpp"
#include "protocol.h"


typedef enum __attribute__ ((packed))  {
  FUNC_SETUP = 40,
  FUNC_WRITE,
  FUNC_READ
} i2cSlaveFunctionNum;

typedef enum __attribute__ ((packed))  {
  FEEDBACK_READ = 43
} i2cSlaveFeedbackNum;
#include <Arduino.h>
#include <Wire.h>
#include "funcI2cMater.h"
//#include "global.cpp"
#include "protocol.h"


typedef enum __attribute__ ((packed))  {
  FUNC_SETUP = 40,
  FUNC_WRITE,
  FUNC_READ
} I2cSlaveFunctionNum;

typedef enum __attribute__ ((packed))  {
  FEEDBACK_READ = 43
} I2cSlaveFeedbackNum;


auto i2cSlaveSetup = [](uint8_t data[], int dataLength) {
  Wire.begin();
};

auto i2cSlaveWrite = [](uint8_t data[], int dataLength) {
  digitalWrite(data[0], data[1]);
};

auto i2cSlaveRead = [](uint8_t data[], int dataLength) {
  digitalWrite(data[0], data[1]);
};


void i2cSlaveBegin() {
  registerFunc(FUNC_SETUP, i2cSlaveSetup);
  registerFunc(FUNC_WRITE, i2cSlaveWrite);
  registerFunc(FUNC_READ, i2cSlaveRead);
}


auto i2cSlaveSetup = [](uint8_t data[], int dataLength) {
  Wire.begin();
};

auto i2cSlaveWrite = [](uint8_t data[], int dataLength) {
  digitalWrite(data[0], data[1]);
};

auto i2cSlaveRead = [](uint8_t data[], int dataLength) {
  digitalWrite(data[0], data[1]);
};


void i2cSlaveBegin() {
  registerFunc(FUNC_SETUP, i2cSlaveSetup);
  registerFunc(FUNC_WRITE, i2cSlaveWrite);
  registerFunc(FUNC_READ, i2cSlaveRead);
}
