#include <ModbusSlave.h>


void setup() {
  modbusConnectionBegin();
  //Serial.println("started!");
}

void loop() {
  modbusConnectionLoop();
}
