import {deserializeJson, serializeJson} from 'system/helpers/binaryHelpers';
import {BackdoorMessage} from './Backdoor';


export function decodeBackdoorMessage(binMsg: Uint8Array): BackdoorMessage {
  if (!(binMsg instanceof Uint8Array)) {
    throw new Error(`Backdoor: data has be a Uint8Array`);
  }
  else if (!binMsg.length) {
    throw new Error(`Backdoor: income data is zero size`);
  }

  return deserializeJson(binMsg);
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

  return serializeJson(message);
}
