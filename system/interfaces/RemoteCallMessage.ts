import {Primitives} from './Types';


export const REMOTE_CALL_MESSAGE_TYPES = [
  'callMethod',
  'methodResult',
  'cbCall',
  'cbResult',
];

export type RemoteCallMessageType =
  // call method on remote host
  'callMethod' |
  // listen for method result
  'methodResult' |
  // listen for callback call
  'cbCall' |
  // return cb result
  'cbResult';

export interface ResultLikePayload {
  error: string | undefined;
  result: Primitives;
}

export interface CallMethodPayload {
  senderId: string;
  objectName: string;
  method: string;
  args: Primitives[];
}

export interface ResultMethodPayload extends ResultLikePayload {
  senderId: string;
  objectName: string;
  method: string;
}

export interface CallCbPayload {
  senderId: string;
  cbId: string;
  args: Primitives[];
}

export interface ResultCbPayload extends ResultLikePayload {
  senderId: string;
  cbId: string;
}

export default interface RemoteCallMessage {
  type: RemoteCallMessageType;
  payload: CallMethodPayload | ResultMethodPayload | CallCbPayload | ResultCbPayload;
}
