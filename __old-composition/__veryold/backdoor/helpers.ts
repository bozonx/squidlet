import {deserializeJson, serializeJson} from 'helpers/binaryHelpers';
import RemoteCallMessage from 'interfaces/RemoteCallMessage';
import {BackdoorMessage} from '../../entities/services/Backdoor/Backdoor';


export function decodeBackdoorMessage(binMsg: any): BackdoorMessage {
  if (!(binMsg instanceof Uint8Array)) {
    throw new Error(`Backdoor: data has be a Uint8Array`);
  }
  else if (!binMsg.length) {
    throw new Error(`Backdoor: income data is zero size`);
  }

  return deserializeJson(binMsg);
}

export function makeMessage(type: number, payload: RemoteCallMessage): Uint8Array {
  const message: BackdoorMessage = {
    type,
    payload,
  };

  return serializeJson(message);
}

export function validateMessage(message: any): string | undefined {
  if (typeof message !== 'object') {
    return `Backdoor message validation: Invalid message`;
  }
  else if (typeof message.type !== 'number') {
    return `Backdoor message validation: Invalid "type" param`;
  }

  return;
}
