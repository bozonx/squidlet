#include <Arduino.h>
#include <Wire.h>
#include "funcI2cSlave.h"
#include "global.cpp"
#include "protocol.h"


typedef enum __attribute__ ((packed))  {
  FUNC_SETUP = 44,
  FUNC_WRITE,
} I2cSlaveFunctionNum;

typedef enum __attribute__ ((packed))  {
  FEEDBACK_READ = 46
} I2cSlaveFeedbackNum;

boolean i2cSlaveHasBeenSetup = false;


// function that executes whenever data is received from master
// this function is registered as an event, see setup()
void receiveEvent(int dataLength)
{
  uint8_t argsData[dataLength] = {0};
  int feedbackNum = FEEDBACK_READ;
  int i = 0;
  
  while(Wire.available()) {
    argsData[i] = Wire.read();

    i++;
  }

  if (dataLength > AVAILABLE_PACKAGE_LENGTH_BYTES) {
    // do nothing if length of the message is too big
    return;
  }
  else if (i + 1 == dataLength) {
    // do nothing if data length doesn't match
    return;
  }

  addFeedbackMessage(feedbackNum, argsData, dataLength);
}

// params are: address. Other params sdaPin, slcPin, frequency aren't used on arduino
auto i2cSlaveSetup = [](uint8_t data[], int dataLength) {
  if (i2cSlaveHasBeenSetup) {
    return;
  }

  i2cSlaveHasBeenSetup = true;
  
  Wire.begin(data[0]);
  Wire.onReceive(receiveEvent);
};

auto i2cSlaveWrite = [](uint8_t data[], int dataLength) {
  // param data[0] (sdaPin) isn't used on arduino, it can be just 0
  Wire.beginTransmission(data[1]);

  for (int i = 0; i < dataLength - 2; i++) {
    Wire.write(data[i + 2]);
  }

  Wire.endTransmission();
};


void i2cSlaveBegin() {
  registerFunc(FUNC_SETUP, i2cSlaveSetup);
  registerFunc(FUNC_WRITE, i2cSlaveWrite);
}
