#include <Arduino.h>
#include <ModbusSlave.h>
#include "modbusConnection.h"
#include "global.cpp"
#include "protocol.h"
#include "helpers.h"


// Explicitly set a stream to use the Serial port.
Modbus slave(Serial, 1, 13); // stream = Serial, slave id = 1, rs485 control-pin = 8


// FC = 16
uint8_t afterWriteRegisters(uint8_t fc, uint16_t address, uint16_t length16Bit) {
  uint16_t package16Bit[length16Bit] = {0};

  for (int i = 0; i < length16Bit; i++) {
    package16Bit[i] = slave.readRegisterFromBuffer(address + i);
  }

  int sizeOfPackage8Bit = length16Bit * 2;
  uint8_t package8Bit[sizeOfPackage8Bit] = {0};

  convert16BitArrTo8Bit(package16Bit, length16Bit, package8Bit);
  
  handleIncomeData(package8Bit, sizeOfPackage8Bit);

  return STATUS_OK;
}

// Handle Read Input Registers (FC=04).
uint8_t beforeReadInputRegisters(uint8_t fc, uint16_t address, uint16_t length16Bit) {
  if (address == 0) {
    // master asked for a new package length
    double packageLength8Bytes = handlePackageLengthAsk();

    uint16_t package16BitLength = ceil(packageLength8Bytes / 2);

    slave.writeRegisterToBuffer(0, package16BitLength);
  }
  else if (address == 1) {
    // master has already received a packege length and asked for the package
    uint8_t package8Bit[MAX_PACKAGE_LENGTH_BYTES] = {0};
    uint16_t package16Bit[MAX_PACKAGE_LENGTH_WORDS] = {0};
    int length8Bit = length16Bit * 2;
    // get the package
    handlePackageAsk(package8Bit, length8Bit);
    // convert it to 16 bit words
    convertUint8ToUint16(package8Bit, length8Bit, package16Bit);
    // write the packet to modubs buffer to be read
    for (int i = 0; i < length16Bit; i++) {
      slave.writeRegisterToBuffer(i, package16Bit[i]);
    }
  }

  return STATUS_OK;
}


void modbusConnectionBegin() {
  // incoming write of multiple registers
  slave.cbVector[CB_WRITE_HOLDING_REGISTERS] = afterWriteRegisters;
  // asking for reading of miltiple registers
  slave.cbVector[CB_READ_INPUT_REGISTERS] = beforeReadInputRegisters;

  slave.begin(SERIAL_BAUD_RATE);
}

void modbusConnectionLoop() {
  // Listen for modbus requests on the serial port.
  // When a request is received it's going to get validated.
  // And if there is a function registered to the received function code, this function will be executed.
  slave.poll();
}
