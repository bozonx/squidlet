#include <Arduino.h>
#include <ModbusSlave.h>
#include "modbusConnection.h"
#include "protocol.h"


// Explicitly set a stream to use the Serial port.
Modbus slave(Serial, 1, 13); // stream = Serial, slave id = 1, rs485 control-pin = 8


// FC = 16
uint8_t afterWriteRegisters(uint8_t fc, uint16_t address, uint16_t length) {
  uint16_t package16Bit[length];

  for (int i = 0; i < length; i++) {
    package16Bit[i] = slave.readRegisterFromBuffer(address + i);
  }

  handleIncomeData(package16Bit, length);

  return STATUS_OK;
}

// Handle Read Input Registers (FC=04).
uint8_t beforeReadInputRegisters(uint8_t fc, uint16_t address, uint16_t length) {
  if (address == 0) {
    // TODO: сформировать сообщения и сохранить пакеты в буфер
    // TODO: если повторно запрашивается длина то отдать длину первого сообщения в буфере
    slave.writeRegisterToBuffer(0, 2);
  }
  else if (address == 1) {
    // TODO: взять 1е сообщение из буфера и записать в регистры и удалить сообщение из буфера
    // TODO: если других сообщений уже нет то удалить буфер и ждать новых запросов
    // [length of message(2), functionNum(13), data(5)]
    slave.writeRegisterToBuffer(0, 525);
    slave.writeRegisterToBuffer(1, 1280);
  }
  
//  uint16_t package[];
//  
//  prepareOutcomeData(address, length);
//
//  for (int i = 0; i < length; i++) {
//    slave.writeRegisterToBuffer(i, package[i]);
//
//    Serial.println(package[i]);
//  }

  return STATUS_OK;
}


void modbusConnectionBegin() {
  // incoming write of multiple registers
  slave.cbVector[CB_WRITE_HOLDING_REGISTERS] = afterWriteRegisters;
  // asking for reading of miltiple registers
  slave.cbVector[CB_READ_INPUT_REGISTERS] = beforeReadInputRegisters;

  // Start the slave at a baudrate of 9600bps on the Serial port.
  Serial.begin(9600);
  slave.begin(9600);
}

void modbusConnectionLoop() {
  // Listen for modbus requests on the serial port.
  // When a request is received it's going to get validated.
  // And if there is a function registered to the received function code, this function will be executed.
  slave.poll();
}
