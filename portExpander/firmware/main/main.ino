#include <ModbusSlave.h>

// Explicitly set a stream to use the Serial port.
Modbus slave(Serial, 1, 13); // stream = Serial, slave id = 1, rs485 control-pin = 8

void setup() {
    // Register functions to call when a certain function code is received.
    // If there is no handler assigned to the function code a valid but empty message will be replied.
    // TODO: на самом деле должно быть FC_READ_INPUT_REGISTERS (fc04) но почему-то оно не работает
    //       а FC_READ_HOLDING_REGISTERS это fc03
    slave.cbVector[FC_READ_HOLDING_REGISTERS] = readInputRegisters;

    // Start the slave at a baudrate of 9600bps on the Serial port.
    Serial.begin(9600);
    slave.begin(9600);

    Serial.println("started!");
}

void loop() {
    // Listen for modbus requests on the serial port.
    // When a request is received it's going to get validated.
    // And if there is a function registered to the received function code, this function will be executed.
    slave.poll();
}

// Handle Read Input Registers (FC=04).
uint8_t readInputRegisters(uint8_t fc, uint16_t address, uint16_t length) {
    slave.writeRegisterToBuffer(0, fc);
    slave.writeRegisterToBuffer(1, address);
    slave.writeRegisterToBuffer(2, length);
    slave.writeRegisterToBuffer(3, 11);
    
    return STATUS_OK;
}
