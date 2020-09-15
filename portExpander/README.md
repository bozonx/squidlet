## Protocol

### Send to mk

* 1 byte length of func args
* 1 byte function number
* ... function args
* the next message is the same

### Read feedback

* 1 byte arguments length
* 1 byte feedback number
* ... feedback args
* the next message is the same

## Functions

0-9 system

* 0 isn't used
* 1 getBootNum() - get number of boot. It is between 0 and 255.
  If value is going to be greater than 255 it will be set to 0.
* 2 reboot system
* 3 set address - set address of current slave connection of I2C, modbus or one-wire.

10-19 Digital input and output

* 10 digitalOutputSetup(pinNum)
* 11 digitalOutputWrite(pinNum, 0 | 1)
* 12 digitalInputSetup(pinNum, register). Register is 0(none) and 1(pullup)
* 13 digitalReadForce(pinNum). Initiate feedback message.
??? return message
??? interrupt in/out

20-29 Analog, PWM

* 20 analogOutputSetup(pinNum)
* 21 analogOutputWrite(pinNum, value)
* 22 analogInputSetup(pinNum. filterParams)
??? return message.
* 24 pwmSetup(pinNum)
* 25 pwmSet(pinNum, impulseLength, pauseLength)

30-39 EPPROM, memory, spi

* ...

40-49 I2C master, I2C slave

* 40 i2cMasterSetup(sdaPin, slcPin, frequency)
* 41 i2cMasterWrite(sdaPin, address, ...data)
* 42 i2cMasterRead(sdaPin, address, length)
* 43 i2cMasterScan(sdaPin);
* 44 ??? return data
* 45 i2cSlaveSetup(address, sdaPin, slcPin, frequency)
* 46 i2cSlaveSetReadToBuffer(sdaPin, data) Set data to buffer
     which will be read by master
* 47??? data which sends master

50-59 modbus, serial

* 50 modbusMasterSetup(txPin, rxPin, transmitterPin, ...serialParams)
* 51 modbusMasterWrite(txPin, address, data)
* 52 modbusMasterRead(txPin, address, length)
* 53 ??? return data which has been read
... modbus slave
* .. serialSetup(txPin, rxPin, bod, ...params)
* .. serialWrite(txPin, data)
* ??? return message from rxPin

60-69 one-wire master, slave

70-79 bluetooth

80-89 WiFi

90-99 useless

100-120 custom functions
