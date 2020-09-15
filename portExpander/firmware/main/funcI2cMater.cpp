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


// params: sdaPin, slcPin, frequency aren't used in arduino
auto i2cMasterSetup = [](uint8_t data[], int dataLength) {
  Wire.begin();
};

auto i2cMasterWrite = [](uint8_t data[], int dataLength) {
  // param data[0] (sdaPin) isn't used on arduino, it can be just 0
  Wire.beginTransmission(data[1]);

  for (int i = 0; i < dataLength - 2; i++) {
    Wire.write(data[i + 2]);
  }

  Wire.endTransmission();
};

// params: sdaPin, address, length
auto i2cMasterRead = [](uint8_t data[], int dataLength) {
  // param data[0] (sdaPin) isn't used on arduino, it can be just 0
  
  Wire.requestFrom(data[1], data[2]);

  // TODO: закинуть сообщение в буфер

  while (Wire.available()) { // slave may send less than requested
    char c = Wire.read(); // receive a byte as character
    Serial.print(c);         // print the character
  }
  
};


void i2cMasterBegin() {
  registerFunc(FUNC_SETUP, i2cMasterSetup);
  registerFunc(FUNC_WRITE, i2cMasterWrite);
  registerFunc(FUNC_READ, i2cMasterRead);
}
