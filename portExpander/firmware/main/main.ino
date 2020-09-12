#include "digitalOutput.h"
#include "modbusConnection.h"


void setup() {
  digitalOutputBegin();
  modbusConnectionBegin();
  Serial.println("started!");
}

void loop() {
  modbusConnectionLoop();
}


//int sizeOfPackage16Bit = sizeof(package16Bit)/sizeof(package16Bit[0]);
