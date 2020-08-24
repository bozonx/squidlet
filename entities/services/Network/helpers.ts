import {MAX_NUM_16_BIT} from 'system/constants';
import {deserializeStringArray, serializeStringArray} from 'system/lib/serialize';
import {NetworkMessage} from './Network';


/**
 * Bytes:
 * * 1 byte length of "to"
 * * 'to" data
 * * 1 byte length of "from"
 * * "from" data
 * * 1 byte length of "sender"
 * * "sender" data
 * * 1 byte length of "uri"
 * * uri data
 * * 1 byte TTL
 * * body
 * @param message
 */
export function encodeNetworkMessage(message: NetworkMessage): Uint8Array {

  // TODO: проверить если не указанны to,from,sender,uri
  // TODO: проверить ttl < 0
  // TODO: uri > 2

  if (typeof message.to !== 'string') {
    throw new Error(`message.to has to be a string`);
  }
  if (message.to.length > 255) {
    throw new Error(`Value of message.to is too long: ${message.to.length}`);
  }
  else if (typeof message.from !== 'string') {
    throw new Error(`message.from has to be a string`);
  }
  else if (message.from.length > 255) {
    throw new Error(`Value of message.from is too long: ${message.from.length}`);
  }
  else if (typeof message.sender !== 'string') {
    throw new Error(`message.sender has to be a string`);
  }
  else if (message.sender.length > 255) {
    throw new Error(`Value of message.sender is too long: ${message.sender.length}`);
  }
  else if (typeof message.uri !== 'string') {
    throw new Error(`message.uri has to be a string`);
  }
  else if (message.uri.length > 255) {
    throw new Error(`uri is too long: ${message.uri.length}`);
  }
  else if (typeof message.TTL !== 'number') {
    throw new Error(`message.TTL has to be a number`);
  }
  else if (message.TTL > 255) {
    throw new Error(`TTL is too long: ${message.TTL}`);
  }


  const result: Uint8Array = new Uint8Array([
    message.TTL,
    ...serializeStringArray([
      message.uri,
      message.to,
      message.from,
      message.sender,
    ]),
    ...message.payload,
  ]);

  if (result.length > MAX_NUM_16_BIT) {
    throw new Error(`message.payload is too long: ${message.payload.length}`);
  }

  return result;
}

/**
 * Bytes:
 * * 1 byte length of "to"
 * * 'to" data
 * * 1 byte length of "from"
 * * "from" data
 * * 1 byte length of "sender"
 * * "sender" data
 * * 1 byte TTL
 * * body
 * @param data
 */
export function decodeNetworkMessage(data: Uint8Array): NetworkMessage {
  // const toLength: number = data[1];
  // const toStartIndex: number = 2;
  // const toEndIndex: number = toLength + toStartIndex;
  // const fromLength: number = data[toEndIndex];
  // const fromStartIndex: number = toEndIndex + 1;
  // const fromEndIndex: number = fromLength + fromStartIndex;
  // const senderLength: number = data[fromEndIndex];
  // const senderStartIndex: number = fromEndIndex + 1;
  // const senderEndIndex: number = senderLength + senderStartIndex;

  const [parsedArr, lastIndex] = deserializeStringArray(data, 1, 4);

  return {
    TTL: data[0],
    uri: parsedArr[0],
    to: parsedArr[1],
    from: parsedArr[2],
    sender: parsedArr[3],
    // to: uint8ArrayToAscii(data.slice(toStartIndex, toEndIndex)),
    // from: uint8ArrayToAscii(data.slice(fromStartIndex, fromEndIndex)),
    // sender: uint8ArrayToAscii(data.slice(senderStartIndex, senderEndIndex)),
    payload: data.slice(lastIndex + 1),
  };
}

// export function serializeMessage(message: NetworkMessage): Uint8Array {
//   if (message.to && message.to.length > 16) {
//     throw new Error(`"to" field of network message is too long: ${message.to.length}`);
//   }
//   else if (message.from.length > 16) {
//     throw new Error(`"from" field of network message is too long: ${message.from.length}`);
//   }
//
//   const toLength: number = (message.to) ? message.to.length : 0;
//   const payload: Uint8Array = serializeJson(message.payload);
//   const lengthsByte: number = combine2numberToByte(toLength, message.from.length);
//
//   return concatUint8Arr(
//     // meta data
//     new Uint8Array([message.messageType, lengthsByte]),
//     // to hostId max 16 bytes
//     asciiToUint8Array(message.to || ''),
//     // from hostId max 16 bytes
//     asciiToUint8Array(message.from),
//     // encoded message
//     payload
//   );
// }

// export function deserializeMessage(data: Uint8Array): NetworkMessage {
//   const [toLength, fromLength] = extract2NumbersFromByte(data[POSITIONS.lengths]);
//   const payloadStart: number = METADATA_LENGTH + toLength + fromLength;
//   const from: string = uint8ArrayToAscii(data.slice(METADATA_LENGTH + toLength, payloadStart));
//   const payload: RemoteCallMessage = deserializeJson(data.slice(payloadStart));
//
//   const result: NetworkMessage = {
//     from,
//     messageType: data[POSITIONS.messageType],
//     payload,
//   };
//
//   if (toLength) {
//     result.to = uint8ArrayToAscii(data.slice(METADATA_LENGTH, METADATA_LENGTH + toLength));
//   }
//
//   return result;
// }
//
// /**
//  * Resolve:
//  * serial => SerialNetwork
//  * SerialNetwork => SerialNetwork
//  */
// export function resolveNetworkDriverName(shortName: string): string {
//   // TODO: add
// }
