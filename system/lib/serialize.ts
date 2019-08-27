import {concatUint8Arr, int32ToUint8Arr, uint8ToNum} from './binaryHelpers';


const BIN_MARK = '!BIN!';
const BIN_LENGTH_SEP = ':';


declare const btoa: ((data: any) => any) | undefined;
declare const atob: ((data: any) => any) | undefined;


export function base64ToString(str: string): string {
  if (typeof btoa === 'undefined') {
    return Buffer.from(str).toString('base64');
  }

  return btoa(str);
}

export function stringToBase64(base64Str: string): string {
  if (typeof atob === 'undefined') {
    return Buffer.from(base64Str, 'base64').toString();
  }

  return atob(base64Str);
}

// see https://stackoverflow.com/questions/17191945/conversion-between-utf-8-arraybuffer-and-string
export function uint8ArrayToText(uintArray: Uint8Array): string {
  const encodedString = String.fromCharCode.apply(null, uintArray as any);

  return decodeURIComponent(escape(stringToBase64(encodedString)));

  // var uint8array = new TextEncoder("utf-8").encode("Plain Text");
  // var string = new TextDecoder().decode(uint8array);
  // console.log(uint8array ,string )
}

export function textToUint8Array(str: string): Uint8Array {
  const string = base64ToString(unescape(encodeURIComponent(str)));
  const charList = string.split('');
  const uintArray = [];

  for (let i = 0; i < charList.length; i++) {
    uintArray.push(charList[i].charCodeAt(0));
  }

  return new Uint8Array(uintArray);
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
  let binDataTail = new Uint8Array();

  // TODO: не поддерживается undefined
  const stringMsg: string = JSON.stringify(data, (key: string, value: any) => {
    if (value instanceof Uint8Array) {
      const start = binDataTail.length;
      const length = value.length;
      binDataTail = concatUint8Arr(binDataTail, value);

      return BIN_MARK + start + BIN_LENGTH_SEP + length;
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

/**
 * Convert previously serialized json which mights content binary data
 * to js object as it was before serialization.
 */
export function deserializeJson(serialized: Uint8Array | any) {
  if (!(serialized instanceof Uint8Array)) {
    throw new Error(`deserializeJson: serialized data has to be a Uint8Array`);
  }

  const binJsonLength: Uint8Array = serialized.slice(0, 4);
  const jsonLength: number = uint8ToNum(binJsonLength);
  // 4 is 4 bytes of length 32 bit number
  const jsonBin: Uint8Array = serialized.slice(4, 4 + jsonLength);
  const jsonString: string = uint8ArrayToText(jsonBin);
  const binaryTail: Uint8Array = serialized.slice(4 + jsonLength);

  // TODO: не поддерживается undefined

  return JSON.parse(jsonString, (key: string, value: any) => {
    if (typeof value === 'string' && value.indexOf(BIN_MARK) === 0) {
      const payload: string = value.split(BIN_MARK)[1];
      const splat: string[] = payload.split(BIN_LENGTH_SEP);
      const start = Number(splat[0]);
      const length = Number(splat[1]);

      return binaryTail.slice(start, start + length);
    }

    return value;
  });
}
