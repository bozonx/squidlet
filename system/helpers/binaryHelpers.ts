import {padStart} from './lodashLike';
//import {TextDecoder, TextEncoder} from 'text-encoding';
import {ASCII_NUMERIC_OFFSET, BITS_IN_BYTE} from '../dict/constants';


const BIN_MARK = '!BIN!';
const BIN_LENGTH_SEP = ':';



// TODO: move to binary helpers
/**
 * Make a new Uint8Array without the first item
 */
export function withoutFirstItemUint8Arr(arr: Uint8Array): Uint8Array {
  if (!isUint8Array(arr)) {
    throw new Error(`collections.withoutFirstItemUint8Arr: array have to be an Uint8Array`);
  }

  const shift = 1;
  const result = new Uint8Array(arr.length - shift);

  for (let i = 0; i < arr.length; i++) {
    result[i] = arr[i + shift];
  }

  return result;
}

// TODO: move to binary helpers
/**
 * Make a new Uint8Array with the new item on the first position and other items is moved right
 */
export function addFirstItemUint8Arr(arr: Uint8Array, itemToAdd: number): Uint8Array {
  if (!isUint8Array(arr)) {
    throw new Error(`collections.withoutFirstItemUint8Arr: array have to be an Uint8Array`);
  }

  const itemsToAdd = 1;
  const result = new Uint8Array(arr.length + itemsToAdd);
  result[0] = itemToAdd;
  arr.forEach((item, index) => result[index + itemsToAdd] = item);

  return result;
}

// TODO: move to binary helpers
export function isUint8Array(value: any): boolean {
  if (typeof value !== 'object') return false;

  return value.constructor === Uint8Array;
}

/**
 * Converts hex like "ffff" to array of bytes [ 255, 255 ]
 */
export function hexStringToUint8Arr(hex: string): Uint8Array {
  if (hex.length < 2) throw new Error(`Incorrect length of hex data`);
  else if (hex.length / 2 !== Math.ceil(hex.length / 2)) {
    throw new Error(`Incorrect length of hex data. It has to be even`);
  }

  const result: Uint8Array = new Uint8Array(hex.length / 2);

  for (let i = 0; i < hex.length; i += 2) {
    const byte = hex[i] + hex[i + 1];
    result[i / 2] = parseInt(byte, 16);
  }

  return result;
}

/**
 * converts uint [ 255, 255 ] to 'ffff'
 */
export function uint8ArrToHexString(bytesArr: Uint8Array): string {
  let result = '';

  bytesArr.forEach((byte: number) => {
    result += int16ToHexString(Number(byte));
  });

  return result;
}

/**
 * e.g 65535 => "ffff". To decode use - hexStringToHexNum() or parseInt("ffff", 16)
 */
export function int16ToHexString(hexNum: number): string {
  if (hexNum < 0 || hexNum > 65535) {
    throw new Error(`int16ToHexString: Incorrect hexNum: ${hexNum}`);
  }

  let hexString: string = hexNum.toString(16);
  if (hexString.length === 1) hexString = '0' + hexString;

  return hexString;
}

/**
 * to hex. eg - "5A" -> 90. "5a" the same.
 * undefined -> 0
 */
export function hexStringToHexNum(hexString: string | number | undefined): number {
  if (typeof hexString === 'undefined') return 0;

  return parseInt(String(hexString), 16);
}

/**
 * Converts byte as a number (255) to binary string "11111111", (4 > "00000100").
 * Number are always 8.
 */
export function byteToString(hexValue: number): string {
  return padStart( hexValue.toString(2), 8, '0' );
}

/**
 * Converts byte as number (255) to binary array
 * [true, true, true, true, true, true, true, true], (4 > [false, false, false, false, false, true, false, false]).
 * Numbers are always 8.
 */
export function byteToBinArr(hexValue: number): boolean[] {
  // convert 4 to ""00000100""
  const binStr: string = byteToString(hexValue);
  // like ["1", "1", "1", "1", "1", "1", "1", "1"]
  const binSplitStr: string[] = binStr.split('');
  const result: boolean[] = new Array(BITS_IN_BYTE);

  for (let i = 0; i < BITS_IN_BYTE; i++) {
    result[i] = Boolean( parseInt(binSplitStr[i]) );
  }

  return result;
}

/**
 * Convert 65535 to "ffff", 1 to "0001".
 * Result is always 4 chars
 */
export function numToWord(num: number): string {
  let result: string = int16ToHexString(num);
  if (result.length === 2) result = '00' + result;

  return result;
}

/**
 * Converts 65535 > [ 255, 255 ], 1 > [ 0, 1 ]
 */
export function numToUint8Word(num: number): Uint8Array {
  const valueWord: string = numToWord(num);

  return hexStringToUint8Arr(valueWord);
}

/**
 * You have to pass a uint8Arr with 2, 4, or 8 length to convert:
 * [ 255, 255 ] > 65535,
 * [ 0, 1 ] > 1
 * [ 255, 255, 255, 255 ] >  4294967295
 */
export function uint8ToNum(uint8Arr: Uint8Array): number {

  // TODO: test 32 bit number

  const hexStr: string = uint8ArrToHexString(uint8Arr);

  return hexStringToHexNum(hexStr);
}

/**
 * Make hex string from 32 bit number (0 - 4294967295).
 * It always returns 8 characters.
 * 4294967295 > "ffffffff"
 * 0 > "00000000"
 */
export function int32ToHexString(int32: number): string {
  // TODO: test

  if (int32 < 0 || int32 > 4294967295) {
    throw new Error(`int32ToUint8Arr: Incorrect int32: ${4294967295}`);
  }

  // from "0" up to "ffffffff"
  const hexString = int32.toString(32);

  return padStart(hexString, 8, '0');
}

/**
 * It make uint8 array with 4 items.
 * 4294967295 > [255, 255, 255, 255]
 */
export function int32ToUint8Arr(int32: number): Uint8Array {

  // TODO: test

  const hexString = int32ToHexString(int32);

  return hexStringToUint8Arr(hexString);
}

/**
 * Converts [true,true,true,true,true,true,true,true,false,false,false,false,false,false,false,false] > [255,0]
 * To be sure that array of bits have strict length use helpers.setArrayDimension()
 */
export function bitsToBytes(bits: (boolean | undefined)[]): Uint8Array {
  const bitsCount: number = bits.length;
  const numOfBytes: number = Math.ceil(bitsCount / 8);
  const result: Uint8Array = new Uint8Array(numOfBytes);

  for (let i = 0; i < bitsCount; i++) {
    // number of byte from 0
    const byteNum: number = Math.floor(i / 8);
    //const positionInByte: number = (Math.floor(i / 8) * 8);
    const positionInByte: number = i - (byteNum * 8);

    result[byteNum] = updateBitInByte(result[byteNum], positionInByte, Boolean(bits[i]));
  }

  return result;
}

/**
 * Converts [255,0] > [true,true,true,true,true,true,true,true,false,false,false,false,false,false,false,false]
 */
export function bytesToBits(bytes: Uint8Array): boolean[] {
  if (!bytes.length) return [];

  let result: boolean[] = [];

  for (let index of bytes.keys()) {
    result = result.concat(byteToBinArr(bytes[index]));
  }

  return result;
}

/**
 * Update specific position in bitmask.
 * E.g updateBitInByte(0, 2, true) ===> 4 (00000100)
 * @param byte
 * @param position - from 0 to 7
 * @param value
 */
export function updateBitInByte(byte: number, position: number, value: boolean): number {

  // TODO: why position from the end???

  if (value) {
    // set the bit
    return byte | 1 << position;
  }
  else {
    // clear the bit
    return byte & ~(1 << position);
  }
}

/**
 * Get bit on specific position from byte (as number)
 */
export function getBitFromByte(byte: number, position: number): boolean {

  // TODO: why position from the end???

  if (position < 0 && position > 7) {
    throw new Error(`getBitFromByte: incorrect position "${position}" it has to be 0-7.`);
  }

  return (byte>>position) % 2 !== 0;
}

/**
 * convert simple number to ascii number. 1 > 49
 */
export function getAsciiNumber(num: number): number {
  if (num < 0 || num > 9) {
    throw new Error(`getAsciiNumber: Incorrect number to convert "${num}"`);
  }

  return num + ASCII_NUMERIC_OFFSET;
}

export function concatUint8Arr(...arrs: Uint8Array[]): Uint8Array {
  // TODO: test

  // var a = new Int8Array( [ 1, 2, 3 ] );
  // var b = new Int8Array( [ 4, 5, 6 ] );
  //
  // var c = new Int8Array(a.length + b.length);
  // c.set(a);
  // c.set(b, a.length);
}

// TODO: remake
export function uint8ArrayToText(arr: Uint8Array): string {
  return '123';
  //return new TextDecoder('utf-8').decode(arr);
}

// TODO: remake
export function textToUint8Array(str: string): Uint8Array {
  return new Uint8Array(0);
  //return new TextEncoder('utf-8').encode(str);
}

/**
 * Extract binary data from json and put in to a tail.
 * Result will be [
 *   4 bytes of json length,
 *   binary json,
 *   binary data from json
 * ]
 */
export function serializeJson(data: any): Uint8Array {
  // TODO: test

  let binDataTail = new Uint8Array();

  const stringMsg: string = JSON.stringify(data, (key: string, value: any) => {
    if (value instanceof Uint8Array) {
      const start = binDataTail.length - 1;
      const end = value.length;
      binDataTail = concatUint8Arr(binDataTail, value);

      return BIN_MARK + start + BIN_LENGTH_SEP + end;
    }

    return value;
  });

  const jsonBin: Uint8Array = textToUint8Array(stringMsg);
  // 4 bytes of json binary length
  const jsonLengthBin = int32ToUint8Arr(jsonBin.length);

  return concatUint8Arr(
    jsonLengthBin,
    jsonBin,
    binDataTail,
  );
}

export function deserializeJson(serialized: Uint8Array) {
  // TODO: test

  const binJsonLength: Uint8Array = serialized.slice(0, 3);
  const jsonLenght: number = uint8ToNum(binJsonLength);
  // 4 is 4 bytes of length 32 bit number
  const jsonBin: Uint8Array = serialized.slice(4, 4 + jsonLenght);
  const binaryTail: Uint8Array = serialized.slice(4 + jsonLenght);
  const jsonString: string = uint8ArrayToText(jsonBin);

  return JSON.parse(jsonString, (key: string, value: any) => {
    if (typeof value === 'string' && value.indexOf(BIN_MARK) === 0) {
      const startEnd: string = value.split(BIN_MARK)[1];
      const [startStr, endStr] = startEnd.split(BIN_LENGTH_SEP);

      return binaryTail.slice(Number(startStr), Number(endStr));
    }

    return value;
  });
}
