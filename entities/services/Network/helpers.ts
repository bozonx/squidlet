import {asciiToUint8Array, serializeJson} from 'system/lib/serialize';
import {concatUint8Arr} from 'system/lib/binaryHelpers';
import NetworkMessage from './interfaces/NetworkMessage';


const METADATA_LENGTH = 2;


export function serializeMessage(message: NetworkMessage): Uint8Array {
  const toLength: number = (message.to) ? message.to.length : 0;
  // TODO: может сделать упрощенную сериализацию чтобы были минимальные значения полей
  const payload: Uint8Array = serializeJson(message.payload);
  // TODO: совместить 2 длины
  const lengthsByte: number = 0;
  //const fullLength: number = METADATA_LENGTH + toLength + message.from.length + payload.length;
  const metaData: Uint8Array = new Uint8Array(METADATA_LENGTH);

  metaData[0] = message.messageType;
  metaData[1] = lengthsByte;

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
  // TODO: add
}
