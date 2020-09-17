#include "funcDigitalOutput.h"
#include "funcDigitalInput.h"
#include "funcI2cMater.h"
#include "funcI2cSlave.h"
#include "modbusConnection.h"
#include "global.cpp"

//#include <Wire.h>


void setup() {
  
  
  // Start the slave at a baudrate of 9600bps on the Serial port.
  Serial.begin(SERIAL_BAUD_RATE);
  modbusConnectionBegin();
  digitalOutputBegin();
  digitalInputBegin();
  i2cMasterBegin();
  i2cSlaveBegin();

  Serial.println("started!");


//  Wire.begin();
//
//  delay(100);
//  
//  Wire.beginTransmission(0x41);
//  Wire.write(0x06);
//  Wire.write(0xc7);
//  Wire.endTransmission();
//
//  delay(100);
//
//  Wire.beginTransmission(0x41);
//  Wire.write(0x07);
//  Wire.write(0x00);
//  Wire.endTransmission();
//
//  delay(100);
//
//  Wire.beginTransmission(0x41);
//  Wire.write(0x08);
//  Wire.write(0xcc);
//  Wire.endTransmission();
//
//  delay(100);
//
//  Wire.beginTransmission(0x41);
//  Wire.write(0x09);
//  Wire.write(0x04);
//  Wire.endTransmission();
}

void loop() {
  digitalInputLoop();
  modbusConnectionLoop();
}
