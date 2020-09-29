import {padStart} from './strings';
import {ASCII_NUMERIC_OFFSET, BITS_IN_BYTE} from './constants';


/**
 * Are uint8 arrays equal.
 * If one of them not Uint8Array then it returns false.
 */
export function isEqualUint8Array(first?: Uint8Array, second?: Uint8Array): boolean {
  if (!(first instanceof Uint8Array) || !(second instanceof Uint8Array)) return false;

  // TODO: research for more optimized method
  return first.toString() === second.toString();
}

/**
 * Better to use "keys" method which returned a iterator.
 * But it isn't supported on lowjs.
 */
export function uint8ArrayKeys(arr: Uint8Array): number[] {
  const result: number[] = [];

  for (let i = 0; i < arr.length; i++) result.push(i);

  return result;
}

/**
 * Make a new Uint8Array without the first item
 */
export function withoutFirstItemUint8Arr(arr: Uint8Array): Uint8Array {
  if (!(arr instanceof Uint8Array)) {
    throw new Error(`binaryHelpers.withoutFirstItemUint8Arr: array have to be an Uint8Array`);
  }

  const shift = 1;
  const result = new Uint8Array(arr.length - shift);

  for (let i = 0; i < arr.length; i++) {
    result[i] = arr[i + shift];
  }

  return result;
}

/**
 * Make a new Uint8Array with the new item on the first position and other items is moved right
 */
export function addFirstItemUint8Arr(arr: Uint8Array, itemToAdd: number): Uint8Array {
  if (!(arr instanceof Uint8Array)) {
    throw new Error(`binaryHelpers.withoutFirstItemUint8Arr: array have to be an Uint8Array`);
  }

  const itemsToAdd = 1;
  const result = new Uint8Array(arr.length + itemsToAdd);
  result[0] = itemToAdd;

  for (let i = 0; i < arr.length; i++) {
    result[i + itemsToAdd] = arr[i];
  }

  return result;
}

// TODO: test
// TODO: work only with ASCII strings
// TODO: зачем нужно если есть asciiToUint8Array ????
export function stringToUint8Array(str: string): Uint8Array {
  const result = new Uint8Array(str.length);

  for (let i = 0; i < str.length; i++) {
    result[i] = str.charCodeAt(i);
  }

  return result;
}

/**
 * Converts hex like "ffff" to array of bytes [ 255, 255 ]
 */
export function hexStringToUint8Arr(hex: string): Uint8Array {
  if (hex.length < 2) {
    throw new Error(`Incorrect length of hex data`);
  }
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

  for (let byte of bytesArr) {
    result += int16ToHexString(Number(byte));
  }

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
  // TODO: test and check this - number
  if (typeof hexString === 'number') return hexString;
  else if (typeof hexString === 'undefined' || hexString === '') return 0;

  return parseInt(String(hexString), 16);
}

// TODO: test
export function hexNumToString(hexNum?: number): string {
  if (typeof hexNum === 'undefined') return '0x00';
  else if (typeof hexNum !== 'number') throw new Error(`Incorrect type of hexNum`);

  const str: string = hexNum.toString(16);

  if (str.length === 1) {
    return `0x0${str}`;
  }

  return `0x${str}`;
}

// TODO: test
/**
 * Normalize hex string value
 * * "2f" => '0x2f'
 * * "f" => '0x0f'
 * * "0x2f" => '0x2f'
 */
export function normalizeHexString(value: string | number): string {
  if (typeof value === 'undefined' || typeof value === 'number') {
    return hexNumToString(value);
  }

  const toNum: number = parseInt(value, 16);

  if (Number.isNaN(toNum)) throw new Error(`Value is not number`);

  return hexNumToString(toNum);
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
  // TODO: test it with value 3329
  else if (result.length === 3) result = '0' + result;

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
  const hexStr: string = uint8ArrToHexString(uint8Arr);

  return hexStringToHexNum(hexStr);
}

// TODO: test
/**
 * Converts [65535, 0] => [255,255, 0, 0]
 */
export function uint16ToUint8(arr16: Uint16Array): Uint8Array {
  const result: number[] = [];

  for (let item of arr16) {
    const bytes: Uint8Array = numToUint8Word(item);

    result.push(bytes[0]);
    result.push(bytes[1]);
  }

  return new Uint8Array(result);
}

// TODO: test
/**
 * Converts [255,255, 0, 0] => [65535, 0]
 */
export function uint8ToUint16(arr8: Uint8Array): Uint16Array {
  const result: number[] = [];

  for (let i = 0; i < arr8.length; i++) {
    if (i + 2 > arr8.length) {
      // the last odd byte
      result.push(uint8ToNum(new Uint8Array([arr8[i], 0])));

      break;
    }
    else {
      // on ordinary bytes
      result.push(uint8ToNum(new Uint8Array([arr8[i], arr8[i + 1]])));

      i++;
    }
  }

  return new Uint16Array(result);
}

/**
 * Make hex string from 32 bit number (0 - 4294967295).
 * It always returns 8 characters.
 * 4294967295 > "ffffffff"
 * 65535 > "0000ffff"
 * 0 > "00000000"
 */
export function int32ToHexString(int32: number): string {
  if (int32 < 0 || int32 > 4294967295) {
    throw new Error(`int32ToUint8Arr: Incorrect int32: ${4294967295}`);
  }

  // from "0" up to "ffffffff"
  const hexString = int32.toString(16);

  return padStart(hexString, 8, '0');
}

/**
 * It make uint8 array with 4 items.
 * 4294967295 > [255, 255, 255, 255]
 */
export function int32ToUint8Arr(int32: number): Uint8Array {
  const hexString = int32ToHexString(int32);

  return hexStringToUint8Arr(hexString);
}

/**
 * Converts [true,true,true,true,true,true,true,true,false,false,false,false,false,false,false,false] > [255,0]
 * To be sure that array of bits have strict length use helpers.makeSizedArray()
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
export function bytesToBits(bytes: Uint8Array | number[]): boolean[] {
  if (!bytes.length) return [];

  let result: boolean[] = [];

  for (let i = 0; i < bytes.length; i++) {
    result = result.concat(byteToBinArr(bytes[i]));
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
  if (position < 0 || position >= BITS_IN_BYTE) {
    throw new Error(`updateBitInByte: incorrect position "${position}" it has to be 0-7.`);
  }

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
  if (position < 0 || position >= BITS_IN_BYTE) {
    throw new Error(`getBitFromByte: incorrect position ${position} it has to be 0-7.`);
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

// TODO: ненужен поидее, можно использовать синтаксис ...
export function concatUint8Arr(...arrs: Uint8Array[]): Uint8Array {
  let offset: number = 0;
  const lengths: number = arrs.map((item) => item.length)
    .reduce((prev: number, cur: number) => prev + cur);
  const result = new Uint8Array(lengths);

  for (let uint8Arr of arrs) {
    result.set(uint8Arr, offset);
    offset += uint8Arr.length;
  }

  return result;
}

/**
 * Make 1 byte from 2 4-bit number.
 */
export function combine2numberToByte(one: number, two: number): number {
  const oneStr: string = padStart( one.toString(2), 4, '0' );
  const twoStr: string = padStart( two.toString(2), 4, '0' );
  const arr: string[] = (twoStr + oneStr).split('');

  return parseInt(arr.join(''), 2);
}

/**
 * Extract 2 4-bit numbers from byte which has been encoded by `combine2numberToByte`
 */
export function extract2NumbersFromByte(byte: number): [number, number] {
  const one: number = byte & 15;
  const two: number = byte >> 4;

  return [one, two];
}

// TODO: test
/**
 * Get number of octet.
 * Octet number starts from 0.
 * bitNum starts from 0
 * * bitNum = 0 returns 0
 * * bitNum = 7 returns 0
 * * bitNum = 8 returns 1
 * * bitNum = 25 returns 3
 */
export function getOctetNum(bitNum: number): number {
  return Math.floor(bitNum / 8);
}

// TODO: test
/**
 * How many octets needs for specified bits count.
 * Octet number starts from 1.
 * bitNum starts from 1.
 * * bitNum = 1 returns 1
 * * bitNum = 8 returns 1
 * * bitNum = 9 returns 2
 * * bitNum = 25 returns 4
 */
export function howManyOctets(bitCount: number): number {
  return Math.ceil(bitCount / 8);
}

// TODO: test
/**
 * Get bit number in one octet even bit number points to not the first octet
 * * bitNum = 0 returns 0
 * * bitNum = 7 returns 7
 * * bitNum = 8 returns 0
 * * bitNum = 9 returns 1
 * @param bitNum
 */
export function getBitNumInOctet(bitNum: number) {
  return bitNum - (Math.floor(bitNum / 8) * 8);
}

// export function isUint8Array(value: any): boolean {
//   if (typeof value !== 'object') return false;
//
//   return value.constructor === Uint8Array;
// }

