#include "digitalOutput.h"
#include "digitalInput.h"
#include "modbusConnection.h"


void setup() {
  modbusConnectionBegin();
  digitalOutputBegin();
  digitalInputBegin();
  
  Serial.println("started!");
}

void loop() {
  digitalInputLoop();
  modbusConnectionLoop();
}
