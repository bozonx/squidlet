import {deserializeJson, serializeJson} from 'system/helpers/binaryHelpers';
import {BackdoorMessage} from './Backdoor';


// TODO: remove

export function decodeBackdoorMessage(binMsg: Uint8Array): BackdoorMessage {
  if (!(binMsg instanceof Uint8Array)) {
    throw new Error(`Backdoor: data has be a Uint8Array`);
  }
  else if (!binMsg.length) {
    throw new Error(`Backdoor: income data is zero size`);
  }

  return deserializeJson(binMsg);
}

export function makeMessage(type: number, action: number, payload?: any, requestId?: string): Uint8Array {
  const message: BackdoorMessage = {
    type,
    action,
    requestId,
    payload,
  };

  return serializeJson(message);
}
