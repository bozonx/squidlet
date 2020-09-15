#include <Arduino.h>
#include <Wire.h>
#include "funcI2cMater.h"
//#include "global.cpp"
#include "protocol.h"


typedef enum __attribute__ ((packed))  {
  FUNC_SETUP = 44,
  FUNC_WRITE,
} I2cSlaveFunctionNum;

typedef enum __attribute__ ((packed))  {
  FEEDBACK_READ = 46
} I2cSlaveFeedbackNum;


// function that executes whenever data is received from master
// this function is registered as an event, see setup()
void receiveEvent(int howMany)
{
  while(1 < Wire.available()) // loop through all but the last
  {
    char c = Wire.read(); // receive byte as a character
    Serial.print(c);         // print the character
  }
  int x = Wire.read();    // receive byte as an integer
  Serial.println(x);         // print the integer
}

// params are: address. Other params sdaPin, slcPin, frequency aren't used on arduino
auto i2cSlaveSetup = [](uint8_t data[], int dataLength) {
  Wire.begin(data[0]);

  // TODO:  не регистрировать при повторном вызове
  Wire.onReceive(receiveEvent);
};

auto i2cSlaveWrite = [](uint8_t data[], int dataLength) {
  // TODO: add
};


void i2cSlaveBegin() {
  registerFunc(FUNC_SETUP, i2cSlaveSetup);
  registerFunc(FUNC_WRITE, i2cSlaveWrite);
}
