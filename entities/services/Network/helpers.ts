import {asciiToUint8Array, deserializeJson, serializeJson, uint8ArrayToAscii} from 'system/lib/serialize';
import {combine2numberToByte, concatUint8Arr, extract2NumbersFromByte} from 'system/lib/binaryHelpers';
import NetworkMessage from './interfaces/NetworkMessage';
import RemoteCallMessage from '../../../system/interfaces/RemoteCallMessage';


const METADATA_LENGTH = 2;

enum POSTIONS {
  messageType,
  lengths,
}


// TODO: test
export function serializeMessage(message: NetworkMessage): Uint8Array {
  const toLength: number = (message.to) ? message.to.length : 0;
  // TODO: может сделать упрощенную сериализацию чтобы были минимальные значения полей
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

// TODO: test
export function deserializeMessage(data: Uint8Array): NetworkMessage {
  const [toLength, fromLength] = extract2NumbersFromByte(data[POSTIONS.lengths]);
  const payloadStart: number = METADATA_LENGTH + toLength + fromLength;
  const from: string = uint8ArrayToAscii(data.slice(METADATA_LENGTH + toLength, payloadStart));
  const payload: RemoteCallMessage = deserializeJson(data.slice(payloadStart));
  let to: string | undefined;

  if (toLength) {
    to = uint8ArrayToAscii(data.slice(METADATA_LENGTH, toLength));
  }

  return {
    to,
    from,
    messageType: data[POSTIONS.messageType],
    payload,
  };
}
