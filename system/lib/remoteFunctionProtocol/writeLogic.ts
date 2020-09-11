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

  // if (data.length + 1 > MAX_FUNCTION_CALL_MESSAGE_LENGTH_BYTES) {
  //   throw new Error(`Function's ${funcNum} data is too large`);
  // }
  //
  // const lengthAndFuncWord: number = uint8ToNum(new Uint8Array([
  //   data.length,
  //   funcNum
  // ]));
  //
  // return new Uint8Array([
  //   lengthAndFuncWord,
  //   ...data,
  // ]);
}
