import {padStart} from './lodashLike';
//import {TextDecoder, TextEncoder} from 'text-encoding';
import {ASCII_NUMERIC_OFFSET, BITS_IN_BYTE} from '../dict/constants';


/**
 * Converts hex like "ffff" to array of bytes [ 255, 255 ]
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length < 2) throw new Error(`Incorrect length of hex data`);
  if (hex.length / 2 !== Math.ceil(hex.length / 2)) {
    throw new Error(`Incorrect length of hex data. It has to be even`);
  }

  const result: Uint8Array = new Uint8Array(hex.length / 2);

  for(let i = 0; i < hex.length; i += 2) {
    const byte = hex[i] + hex[i + 1];
    result[i / 2] = parseInt(byte, 16);
  }

  return result;
}

/**
 * converts uint [ 255, 255 ] to 'ffff'
 */
export function bytesToHexString(bytesArr: Uint8Array): string {
  let result = '';

  bytesArr.forEach((byte: number) => {
    result += hexNumToHexString(Number(byte));
  });

  return result;
}

/**
 * e.g 65535 => "ffff". To decode use - hexStringToHexNum() or parseInt("ffff", 16)
 */
export function hexNumToHexString(hexNum: number): string {
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
 * Converts byte as number (255) to binary string "11111111", (4 > "00000100").
 * Number are always 8.
 */
export function byteToString(hexValue: number): string {
  return padStart( hexValue.toString(2), 8, '0' );
}

/**
 * Converts byte as number (255) to binary array
 * [true, true, true, true, true, true, true, true], (4 > [false, false, false, false, false, true, false, false]).
 * Number are always 8.
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
  let result: string = hexNumToHexString(num);
  if (result.length === 2) result = '00' + result;

  return result;
}

/**
 * Converts 65535 > [ 255, 255 ], 1 > [ 0, 1 ]
 */
export function numToUint8Word(num: number): Uint8Array {
  const valueWord: string = numToWord(num);

  return hexToBytes(valueWord);
}

/**
 * Converts [ 255, 255 ] > 65535, [ 0, 1 ] > 1
 */
export function uint8WordToNum(word: Uint8Array): number {
  const hexStr: string = bytesToHexString(word);

  return hexStringToHexNum(hexStr);
}

/**
 * Converts [true,true,true,true,true,true,true,true,false,false,false,false,false,false,false,false] > [255,0]
 */
export function convertBitsToBytes(bits: (boolean | undefined)[], bitsCount: number): Uint8Array {

  // TODO: fix

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
export function convertBytesToBits(bytes: Uint8Array): boolean[] {

  // TODO: fix

  if (!bytes.length) return [];

  //const bitsLength: number = bytes.length * 8;
  //new Array<boolean>(bitsLength)
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
