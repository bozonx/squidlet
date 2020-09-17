#include <Arduino.h>
#include <Wire.h>
#include "funcI2cMater.h"
#include "global.cpp"
#include "protocol.h"


typedef enum __attribute__ ((packed))  {
  FUNC_SETUP = 40,
  FUNC_WRITE,
  FUNC_READ
} I2cMasterFunctionNum;

typedef enum __attribute__ ((packed))  {
  FEEDBACK_READ = 43
} I2cMasterFeedbackNum;

boolean i2cMasterHasBeenSetup = false;


// params: sdaPin, slcPin, frequency aren't used in arduino
auto i2cMasterSetup = [](uint8_t data[], int dataLength) {
  if (i2cMasterHasBeenSetup) {
    return;
  }

  i2cMasterHasBeenSetup = true;
  

};

auto i2cMasterWrite = [](uint8_t data[], int dataLength) {
  // param data[0] (sdaPin) isn't used on arduino, it can be just 0
  Wire.beginTransmission(data[1]);

  //int argsLength = dataLength - 2; 
  //uint8_t argsData[100] = {0};

  for (int i = 0; i < dataLength - 2; i++) {
    Wire.write(data[i + 2]);
    //argsData[i] = data[i + 2];
  }

  //Wire.write(argsData, argsLength);

  Wire.endTransmission();
};

// params: sdaPin, address, length
auto i2cMasterRead = [](uint8_t data[], int dataLength) {
  // param data[0] (sdaPin) isn't used on arduino, it can be just 0

  if (dataLength > AVAILABLE_PACKAGE_LENGTH_BYTES) {
    // do nothing if length of the message is too big
    return;
  }
  
  Wire.requestFrom(data[1], data[2]);

  uint8_t argsData[dataLength] = {0};
  int feedbackNum = FEEDBACK_READ;
  int i = 0;

  while (Wire.available()) {
    argsData[i] = Wire.read();
    
    i++;
  }

  if (i + 1 == dataLength) {
    // do nothing if data length doesn't match
    return;
  }

  addFeedbackMessage(feedbackNum, argsData, dataLength);
};


void i2cMasterBegin() {
  registerFunc(FUNC_SETUP, i2cMasterSetup);
  registerFunc(FUNC_WRITE, i2cMasterWrite);
  registerFunc(FUNC_READ, i2cMasterRead);

  //Wire.begin();
}
