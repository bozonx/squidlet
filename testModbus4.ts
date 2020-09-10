// create a tcp modbus client
import {uint8ToNum} from './system/lib/binaryHelpers';
import ModBusMasterRtu from './platforms/nodejs/ios/ModBusMasterRtu';


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


async function start () {
  const master: ModBusMasterRtu = new ModBusMasterRtu();

  await master.configure({
    ports: {
      0: {
        dev: '/dev/ttyUSB1',
        baudRate: 9600,
        parity: 'none',
        databits: 8,
        stopbits: 1,
      },
    },
  });
  await master.init({
    log: {
      debug: console.log,
      info: console.log,
      warn: console.warn,
      error: console.error,
    }
  } as any);

  const slaveAddress = 0x01;
  const pinNumber: number = 12;
  const pinState: boolean = true;
  const pinSetupMessage: number[] = makePinSetupPackage(pinNumber);
  const pinWriteMessage: number[] = makePinWritePackage(pinNumber, pinState);


  const result: Uint16Array = await master.readInputRegisters(0, slaveAddress, 0,4);

  console.log(22222222, result);

  // client.writeMultipleRegisters(0x00, pinSetupMessage)
  //   .then((data: any) => console.log('writing result ', data))
  //   .catch(handleErrors);
  //
  // setTimeout(() => {
  //   client.writeMultipleRegisters(0x00, pinWriteMessage)
  //     .then((data: any) => console.log('writing result ', data))
  //     .catch(handleErrors);
  // }, 100);

  // setTimeout(() => {
  //   //client.readHoldingRegisters(0, 1)
  //   client.readInputRegisters(0, 4)
  //     .then((data: any) => console.log('reading result ', data))
  //     .catch(handleErrors)
  //     .finally(() => socket.close());
  // }, 200);

}

start()
  .catch(console.error);
