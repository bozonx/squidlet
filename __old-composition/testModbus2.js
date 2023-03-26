// create a tcp modbus client
const Modbus = require('jsmodbus')
const SerialPort = require('serialport')
const options = {
  baudRate: 9600,
  parity: 'even',
  dataBits: 8,
  stopBits: 1,
}
const socket = new SerialPort("/dev/ttyUSB0", options)

const address = 0x01;

const client = new Modbus.client.RTU(socket, address)

// for reconnecting see node-net-reconnect npm module

socket.on('close', function () {
  console.log('close', arguments)
})

socket.on('open', function () {
  console.log('connected')

  // setTimeout(() => {
  //   client.writeMultipleRegisters(0x06, Buffer.from([0x00, 0x01, 0x03, 0x00]))
  //   //client.writeMultipleRegisters(0x06, [0x00, 0x01, 0x03, 0x00])
  //     .then((data) => console.log('writing result ', data))
  //     .catch(handleErrors);
  // }, 100)

  //client.readCoils(0, 13).then(function (resp) {

  //client.writeMultipleRegisters(0x03, [0x00, 0x01, 0x00, 0x01])

  setTimeout(() => {
    client.readHoldingRegisters(0x03, 1)
    //client.readInputRegisters(0x03, 1)
      .then((data) => console.log('reading result ', data))
      .catch(handleErrors)
      .finally(() => socket.close());
  }, 200)



  // resp will look like { response : [TCP|RTU]Response, request: [TCP|RTU]Request }
  // the data will be located in resp.response.body.coils: <Array>, resp.response.body.payload: <Buffer>

//     console.log(resp);
//
// }, console.error);


});

socket.on('data', (data) => {
  console.log('--- serial data', data)
})

socket.on('error', console.error)

function handleErrors(err) {
  if (Modbus.errors.isUserRequestError(err)) {
    switch (err.err) {
      case 'OutOfSync':
      case 'Protocol':
      case 'Timeout':
      case 'ManuallyCleared':
      case 'ModbusException':
      case 'Offline':
      case 'crcMismatch':
        console.log('Error Message: ' + err.message, 'Error' + 'Modbus Error Type: ' + err.err)
        break;
    }

  } else if (Modbus.errors.isInternalException(err)) {
    console.log('Error Message: ' + err.message, 'Error' + 'Error Name: ' + err.name, err.stack)
  } else {
    console.log('Unknown Error', err);
  }
}

//console.log(111, socket)

//socket.connect(options)
