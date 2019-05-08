import {textToUint8Array, uint8ArrayToText} from 'system/helpers/binaryHelpers';
import {isUint8Array, withoutFirstItemUint8Arr} from 'system/helpers/collections';
import {BackdoorMessage} from './Backdoor';


export function encodeJsonMessage(message: {[index: string]: any}): Uint8Array {

  // TODO: use serialize !!!! not BACKDOOR_DATA_TYPES

  const stringMsg: string = JSON.stringify(message);
  const uint8Msg: Uint8Array = textToUint8Array(stringMsg);
  const result = new Uint8Array(uint8Msg.length + 1);

  result[0] = BACKDOOR_DATA_TYPES.json;

  return result;
}

export function decodeJsonMessage(binMsg: Uint8Array): {[index: string]: any} {
  if (!isUint8Array(data)) {
    return this.env.log.error(`Backdoor: data has be a Uint8Array`);
  }
  else if (data.length <= 1) {
    return this.env.log.error(`Backdoor: income data is too small`);
  }

  if (!isUint8Array(binMsg) || !binMsg.length || binMsg[0] !== BACKDOOR_DATA_TYPES.json) {
    throw new Error(`Incorrect backdoor binary json message: "${JSON.stringify(binMsg)}"`);
  }

  const uint8Msg: Uint8Array = withoutFirstItemUint8Arr(binMsg);
  const stringMsg: string = uint8ArrayToText(uint8Msg);

  return JSON.parse(stringMsg);
}

export function makeMessage(action: number, category: string, topic?: string, data?: string): Uint8Array {
  const message: BackdoorMessage = {
    action,
    payload: {
      category,
      topic,
      data,
    }
  };

  return encodeJsonMessage(message);
}
