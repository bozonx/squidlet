import {Primitives} from '../../system/interfaces/Types';


export type RemoteCallMessageType = 'call' | 'result' | 'listenCb' | 'removeCbListener';

export interface CallMethodPayload {
  senderId: string;
  objectName: string;
  method: string;
  args: Primitives[];
}

export interface ResultPayload {
  objectName: string;
  method: string;
  error: string | undefined;
  result: Primitives;
}

export default interface RemoteCallMessage {
  type: RemoteCallMessageType;
  payload: CallMethodPayload | ResultPayload;
}
