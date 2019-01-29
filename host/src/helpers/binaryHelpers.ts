import {padStart} from './lodashLike';
//import {TextDecoder, TextEncoder} from 'text-encoding';
import {ASCII_NUMERIC_OFFSET, BYTES_IN_WORD} from '../app/dict/constants';


/**
 * Convert hex like "ffff" to array of bytes [ 255, 255 ]
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

export function bytesToHexString(bytesArr: Uint8Array): string {
  let result = '';

  bytesArr.forEach((byte: number) => {
    result += hexNumToHexString(Number(byte));
  });

  return result;
}

export function byteToString(hexValue: number): string {

  // TODO: test

  // convert 4 to "00000100"
  return padStart( hexValue.toString(2), 8, '0' );
}

export function byteToBinArr(hexValue: number): boolean[] {

  // TODO: test

  // convert 4 to ""00000100""
  const binStr: string = byteToString(hexValue);
  // like ["1", "1", "1", "1", "1", "1", "1", "1"]
  const binSplitStr: string[] = binStr.split('');
  const result: boolean[] = new Array(8);

  for (let itemStr of binSplitStr) {
    result.push( Boolean( parseInt(itemStr) ) );
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

  // TODO: test

  if (value) {
    // set the bit
    return byte | 1 << position;
  }
  else {
    // clear the bit
    return byte & ~(1 << position);
  }
}

export function getBitFromByte(byte: number, position: number): boolean {
  if (position < 0 && position > 7) {
    throw new Error(`getBitFromByte: incorrect position "${position}" it has to be 0-7.`);
  }

  return (byte>>position) % 2 !== 0;
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
 * to hex. eg - "5A" -> 90. "5a" the same.
 * undefined -> 0
 */
export function hexStringToHexNum(hexString: string | number | undefined): number {
  if (typeof hexString === 'undefined') return 0;

  return parseInt(String(hexString), 16);
}

/**
 * e.g 65535 => "ffff". To decode use - hexStringToHexNum() or parseInt("ffff", 16)
 */
export function hexNumToHexString(hexNum: number): string {
  let hexString: string = hexNum.toString(16);
  if (hexString.length === 1) hexString = '0' + hexString;

  return hexString;
}

export function numToWord(num: number): string {
  let result: string = hexNumToHexString(num);
  if (result.length === 2) result = '00' + result;

  return result;
}

export function numToUint8Word(num: number): Uint8Array {
  const valueWord: string = numToWord(num);

  return hexToBytes(valueWord);
}

export function uint8WordToNum(word: Uint8Array): number {
  const hexStr: string = bytesToHexString(word);

  return hexStringToHexNum(hexStr);
}

/**
 * Make [255,0] from [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0]
 */
export function convertBitsToBytes(bits: (boolean | undefined)[], bitsCount: number): Uint8Array {
  // TODO: test

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

export function convertBytesToBits(bytes: Uint8Array): boolean[] {
  if (!bytes.length) return [];

  //const bitsLength: number = bytes.length * 8;
  //new Array<boolean>(bitsLength)
  let result: boolean[] = [];

  for (let index of bytes.keys()) {
    result = result.concat(byteToBinArr(bytes[index]));
  }

  return result;
}

export function getHexNumber(num: number): number {
  if (num < 0 || num > 9) {
    throw new Error(`getHexNumber: Incorrect number to convert "${num}"`);
  }

  return num + ASCII_NUMERIC_OFFSET;
}
