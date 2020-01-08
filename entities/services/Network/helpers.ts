import {asciiToUint8Array, deserializeJson, serializeJson, uint8ArrayToAscii} from 'system/lib/serialize';
import {combine2numberToByte, concatUint8Arr, extract2NumbersFromByte} from 'system/lib/binaryHelpers';
import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import NetworkMessage from './interfaces/NetworkMessage';


const METADATA_LENGTH = 2;

enum POSITIONS {
  messageType,
  // one byte witch contains 4-bit lengths of "to" and "from" fields
  lengths,
}


export function serializeMessage(message: NetworkMessage): Uint8Array {
  if (message.to && message.to.length > 16) {
    throw new Error(`"to" field of network message is too long: ${message.to.length}`);
  }
  else if (message.from.length > 16) {
    throw new Error(`"from" field of network message is too long: ${message.from.length}`);
  }

  const toLength: number = (message.to) ? message.to.length : 0;
  const payload: Uint8Array = serializeJson(message.payload);
  const lengthsByte: number = combine2numberToByte(toLength, message.from.length);

  return concatUint8Arr(
    // meta data
    new Uint8Array([message.messageType, lengthsByte]),
    // to hostId max 16 bytes
    asciiToUint8Array(message.to || ''),
    // from hostId max 16 bytes
    asciiToUint8Array(message.from),
    // encoded message
    payload
  );
}

export function deserializeMessage(data: Uint8Array): NetworkMessage {
  const [toLength, fromLength] = extract2NumbersFromByte(data[POSITIONS.lengths]);
  const payloadStart: number = METADATA_LENGTH + toLength + fromLength;
  const from: string = uint8ArrayToAscii(data.slice(METADATA_LENGTH + toLength, payloadStart));
  const payload: RemoteCallMessage = deserializeJson(data.slice(payloadStart));

  const result: NetworkMessage = {
    from,
    messageType: data[POSITIONS.messageType],
    payload,
  };

  if (toLength) {
    result.to = uint8ArrayToAscii(data.slice(METADATA_LENGTH, METADATA_LENGTH + toLength));
  }

  return result;
}

/**
 * Resolve:
 * serial => SerialNetwork
 * SerialNetwork => SerialNetwork
 */
export function resolveNetworkDriverName(shortName: string): string {
  // TODO: add
}
