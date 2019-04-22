import {Primitives} from '../../system/interfaces/Types';


export type RemoteCallMessageType = 'callMethod' | 'methodResult' | 'cbCall' | 'cbResult';

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

export interface CbCallPayload {
  cbId: string;
  error: string | undefined;
  args: Primitives[];
}

export interface CbResultPayload {
  senderId: string;
  cbId: string;
  error: string | undefined;
  result: Primitives;
}

export default interface RemoteCallMessage {
  type: RemoteCallMessageType;
  payload: CallMethodPayload | ResultPayload | CbCallPayload | CbResultPayload;
}
