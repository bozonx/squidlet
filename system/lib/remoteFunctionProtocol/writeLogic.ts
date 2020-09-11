import {uint8ToNum} from '../binaryHelpers';
import {MAX_FUNCTION_CALL_MESSAGE_LENGTH_BYTES} from './constants';


// TODO: test
export function makeCallFunctionMessage(funcNum: number, data: Uint8Array): Uint8Array {
  if (data.length + 2 > MAX_FUNCTION_CALL_MESSAGE_LENGTH_BYTES) {
    throw new Error(`Function's ${funcNum} data is too large`);
  }

  return new Uint8Array([
    data.length,
    funcNum,
    ...data,
  ]);
}


//////////////////////////

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
