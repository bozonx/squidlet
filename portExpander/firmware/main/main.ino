#include "funcDigitalOutput.h"
#include "funcDigitalInput.h"
#include "funcI2cMater.h"
#include "funcI2cSlave.h"
#include "modbusConnection.h"
#include "global.cpp"


void setup() {
  // Start the slave at a baudrate of 9600bps on the Serial port.
  Serial.begin(SERIAL_BAUD_RATE);
  modbusConnectionBegin();
  digitalOutputBegin();
  digitalInputBegin();
  i2cMasterBegin();
  i2cSlaveBegin();

  Serial.println("started!");
}

void loop() {
  digitalInputLoop();
  modbusConnectionLoop();
}
