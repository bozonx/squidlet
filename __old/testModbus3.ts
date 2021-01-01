// create a tcp modbus client
import {uint8ToNum} from '../../squidlet-lib/src/binaryHelpers';
import {IUserRequestResolve} from 'jsmodbus/dist/user-request';
import ModbusRTURequest from 'jsmodbus/dist/rtu-request';

const Modbus = require('jsmodbus');
const SerialPort = require('serialport');
const options = {
  baudRate: 9600,
  parity: 'none',
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



const oldWrite = socket.write.bind(socket);
socket.write = (
  data: string| number[] | Buffer,
  // TODO: use encoding ???
  callback?: (error: Error | null | undefined, bytesWritten: number) => void
): boolean => {

  console.log('write', data);

  const cbWrapper = (error: Error | null | undefined, bytesWritten: number): void => {
    console.log('wrappercb', error, bytesWritten);

    if (callback) callback(error, bytesWritten);
  };

  return oldWrite(data, cbWrapper);
};



socket.on('close', function () {
  console.log('close', arguments);
});

socket.on('open', function () {
  console.log('connected');
  const pinNumber: number = 12;
  const pinState: boolean = true;
  const pinSetupMessage: number[] = makePinSetupPackage(pinNumber);
  const pinWriteMessage: number[] = makePinWritePackage(pinNumber, pinState);

  // client.writeMultipleRegisters(0x00, pinSetupMessage)
  //   .then((data: any) => console.log('writing result ', data))
  //   .catch(handleErrors);
  //
  // setTimeout(() => {
  //   client.writeMultipleRegisters(0x00, pinWriteMessage)
  //     .then((data: any) => console.log('writing result ', data))
  //     .catch(handleErrors);
  // }, 100);

  setTimeout(() => {
    //client.readHoldingRegisters(0, 1)
    client.readInputRegisters(0, 4)
      .then(({metrics, request, response}:  IUserRequestResolve<ModbusRTURequest>) => {
        console.log('result values', (response as any).body.values);
      })
      .catch(handleErrors)
      .finally(() => socket.close());
  }, 200);

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
