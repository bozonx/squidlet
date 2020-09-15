// TODO: rename to MODBUS_SLAVE_DEFAULT_ADDRESS
// address of current device on modbus bus
#define SLAVE_ADDRESS 1
#define SERIAL_BAUD_RATE 9600

// max is 226
#define MAX_PACKAGE_LENGTH_BYTES 128
// TODO: rename to FUNCTIONS_COUNT
#define FUNCTIONS_NUM 120
// TODO: review
#define FEEDBACK_STACK_LENGTH 2
// TODO: review
#define FEEDBACK_PACKAGES_STACK_LENGTH 2
#define SEND_RECEIVE_SWITCH_PIN 13

//#define MODBUS_ADDRESS_EEPROM_CELL 0
//#define I2C_ADDRESS_EEPROM_CELL 0

// minus 2 bytes which are used for setting length of the next package
int const AVAILABLE_PACKAGE_LENGTH_BYTES = MAX_PACKAGE_LENGTH_BYTES - 2;
int const MAX_PACKAGE_LENGTH_WORDS = MAX_PACKAGE_LENGTH_BYTES / 2;
int const MAX_ARGS_LENGTH_BYTES = MAX_PACKAGE_LENGTH_BYTES - 2;
// length of payload excluding the first word which is length and function number
int const MAX_PAYLOAD_LENGTH_BYTES = MAX_PACKAGE_LENGTH_BYTES - 2;
int const MAX_PAYLOAD_LENGTH_WORDS = (MAX_PACKAGE_LENGTH_BYTES / 2) - 1;
