#include "modbusConnection.h"


void setup() {
  modbusConnectionBegin();
  Serial.println("started!");
}

void loop() {
  modbusConnectionLoop();
}
