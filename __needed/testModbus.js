// create an empty modbus client
var ModbusRTU = require("modbus-serial");
var client = new ModbusRTU();

// open connection to a serial port
client.connectRTUBuffered('/dev/ttyUSB0', {
  baudRate: 9600,
  parity: 'even',
  dataBits: 8,
  stopBits: 1,
}, () => {
  console.log('Connected')
  write();
  //read();
});

const deviceNum = 0x01;
const writeFunc = 0x06;
const readFunc = 0x03;

client.setID(deviceNum);

function write() {
  console.log('writing')
  // write the values 0, 0xffff to registers starting at address 5
  // on device number 1.
  //client.writeRegister(0x00, [0x01, 0x03, 0x00])
  client.writeRegister(0x06, [0x00, 0x01, 0x03, 0x00])
    .then((result) => {
      console.log('writing result ', result);
      read();
    })
    .catch((e) => console.error(e));
}

function read() {
  console.log('Reading')
  // read the 2 registers starting at address 5
  // on device number 1.
  //client.readHoldingRegisters(0, 4)
  //client.readInputRegisters(readFunc, 4)
  //client.readHoldingRegisters(readFunc, [0x00, 0x01, 0x00, 0x01])
  client.readHoldingRegisters(readFunc, 1)
  //client.readInputRegisters(readFunc, [0x00, 0x01, 0x00, 0x01])
    .then((result) => {
      console.log(result);
    })
    .catch((e) => console.error(e));
}
