// address of current device on modbus bus
#define SLAVE_ADDRESS 1

// max is 226
#define MAX_PACKAGE_LENGTH_BYTES 128
#define FUNCTIONS_NUM 256
#define SEND_RECEIVE_SWITCH_PIN 13
// just default tx pin. Don't change it on arduino nano
#define TX_PIN 14
#define SERIAL_BAUD_RATE 9600
#define MODBUS_ADDRESS_EEPROM_CELL 0
#define I2C_ADDRESS_EEPROM_CELL 0

int const MAX_PACKAGE_LENGTH_WORDS = MAX_PACKAGE_LENGTH_BYTES / 2;
// length of payload excluding the first word which is length and function number
int const MAX_PAYLOAD_LENGTH_BYTES = MAX_PACKAGE_LENGTH_BYTES - 2;
int const MAX_PAYLOAD_LENGTH_WORDS = (MAX_PACKAGE_LENGTH_BYTES / 2) - 1;
