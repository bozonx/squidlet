// create a tcp modbus client
import {uint8ToNum} from './system/lib/binaryHelpers';

const Modbus = require('jsmodbus');
const SerialPort = require('serialport');
const options = {
  baudRate: 9600,
  parity: 'even',
  dataBits: 8,
  stopBits: 1,
};
const socket = new SerialPort('/dev/ttyUSB1', options);

const slaveAddress = 0x01;
const TRANSMITTER_PIN = 17;
const TRANSMITTER_SEND_STATE = true;
const TRANSMITTER_RECEIVE_STATE = false;

const client = new Modbus.client.RTU(socket, slaveAddress);


function makePinSetupPackage(pinNum: number): number[] {
  const digitalOutputSetupFunctionNum = 10;
  const dataWords: number[] = [uint8ToNum(new Uint8Array([
    pinNum,
    0,
  ]))];
  const lengthAndFuncWord: number = uint8ToNum(new Uint8Array([
    dataWords.length,
    digitalOutputSetupFunctionNum
  ]));

  return [lengthAndFuncWord, ...dataWords];
}

function makePinWritePackage(pinNum: number, state: boolean): number[] {
  const digitalOutputWriteFunctionNum = 11;
  const dataWords: number[] = [uint8ToNum(new Uint8Array([
    pinNum,
    (state) ? 1 : 0,
  ]))];
  const lengthAndFuncWord = uint8ToNum(new Uint8Array([
    dataWords.length,
    digitalOutputWriteFunctionNum
  ]));

  return [lengthAndFuncWord, ...dataWords];
}


// for reconnecting see node-net-reconnect npm module



// const oldWrite = socket.write.bind(socket);
// socket.write = (
//   data: string| number[] | Buffer,
//   // TODO: use encoding ???
//   callback?: (error: Error | null | undefined, bytesWritten: number) => void
// ): boolean => {
//
//   const cbWrapper = (error: Error | null | undefined, bytesWritten: number): void => {
//     gpiop.write(TRANSMITTER_PIN, TRANSMITTER_RECEIVE_STATE);
//
//     if (callback) callback(error, bytesWritten);
//   };
//
//   gpiop.write(TRANSMITTER_PIN, TRANSMITTER_SEND_STATE)
//     .then(() => {
//       const result = oldWrite(data, cbWrapper);
//
//       console.log(22222222, result);
//     })
//     .catch(console.error);
//
//   // TODO: поидее то неправлиьно, состояние то неизвестно
//   return true;
// };



socket.on('close', function () {
  console.log('close', arguments);
});

socket.on('open', function () {
  console.log('connected');
  const pinNumber: number = 12;
  const pinState: boolean = true;
  const pinSetupMessage: number[] = makePinSetupPackage(pinNumber);
  const pinWriteMessage: number[] = makePinWritePackage(pinNumber, pinState);

  client.writeMultipleRegisters(0x00, pinSetupMessage)
    //client.writeMultipleRegisters(0x00, [65110, 65120, 65130, 65140])
    //client.writeMultipleRegisters(0x06, [0x00, 0x01, 0x03, 0x00])
    .then((data: any) => console.log('writing result ', data))
    .catch(handleErrors);

  setTimeout(() => {
    client.writeMultipleRegisters(0x00, pinWriteMessage)
      //client.writeMultipleRegisters(0x00, [65110, 65120, 65130, 65140])
      //client.writeMultipleRegisters(0x06, [0x00, 0x01, 0x03, 0x00])
      .then((data: any) => console.log('writing result ', data))
      .catch(handleErrors);
  }, 500);

  // setTimeout(() => {
  //   //client.readHoldingRegisters(0x05, 1)
  //   client.readInputRegisters(0x03, 1)
  //     .then((data) => console.log('reading result ', data))
  //     .catch(handleErrors)
  //     .finally(() => socket.close());
  // }, 200)

});

socket.on('data', (data: Buffer) => {
  console.log(11111111, data);
});

socket.on('error', console.error);

function handleErrors(err: any) {
  if (Modbus.errors.isUserRequestError(err)) {
    switch (err.err) {
      case 'OutOfSync':
      case 'Protocol':
      case 'Timeout':
      case 'ManuallyCleared':
      case 'ModbusException':
      case 'Offline':
      case 'crcMismatch':
        console.log('Error Message: ' + err.message, 'Error' + 'Modbus Error Type: ' + err.err);
        break;
    }

  } else if (Modbus.errors.isInternalException(err)) {
    console.log('Error Message: ' + err.message, 'Error' + 'Error Name: ' + err.name, err.stack);
  } else {
    console.log('Unknown Error', err);
  }
}

//console.log(111, socket)

//socket.connect(options)
