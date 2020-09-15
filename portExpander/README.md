

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
* 11 