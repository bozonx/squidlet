#include "digitalOutput.h"
#include "digitalInput.h"
#include "modbusConnection.h"


void setup() {
  digitalOutputBegin();
  digitalInputBegin();
  modbusConnectionBegin();
  Serial.println("started!");
}

void loop() {
  digitalInputLoop();
  modbusConnectionLoop();
}


//int sizeOfPackage16Bit = sizeof(package16Bit)/sizeof(package16Bit[0]);
