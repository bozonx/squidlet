

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
