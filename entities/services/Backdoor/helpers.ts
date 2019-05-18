import {deserializeJson, serializeJson} from 'system/helpers/binaryHelpers';
import {BackdoorMessage} from './Backdoor';


export function decodeBackdoorMessage(binMsg: any): BackdoorMessage {
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

export function validateMessage(message: any): string | undefined {
  if (typeof message.type !== 'object') {
    return `Backdoor message validation: Invalid message`;
  }
  else if (typeof message.type !== 'number') {
    return `Backdoor message validation: Invalid "type" param`;
  }
  else if (typeof message.action !== 'number') {
    return `Backdoor message validation: Invalid "action" param`;
  }

  return;
}
