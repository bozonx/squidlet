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
