import {uint8ToNum} from '../../../system/lib/binaryHelpers';

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

const pinSetupMessage: number[] = makePinSetupPackage(pinNumber);
const pinWriteMessage: number[] = makePinWritePackage(pinNumber, pinState);
