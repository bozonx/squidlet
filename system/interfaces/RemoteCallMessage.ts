import {Primitives} from './Types';


export const REMOTE_CALL_MESSAGE_TYPES = [
  'callMethod',
  'methodResult',
  'cbCall',
  'cbResult',
  // 'init',
  // 'destroy',
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
  // 'init' |
  // 'destroy';

export interface ResultLikePayload {
  error: string | undefined;
  result: Primitives;
}

export interface CallMethodPayload {
  objectName: string;
  method: string;
  args: Primitives[];
}

export interface ResultMethodPayload extends ResultLikePayload {
  objectName: string;
  method: string;
}

export interface CallCbPayload {
  cbId: string;
  args: Primitives[];
}

export interface ResultCbPayload extends ResultLikePayload {
  cbId: string;
}

export default interface RemoteCallMessage {
  type: RemoteCallMessageType;
  payload?: CallMethodPayload | ResultMethodPayload | CallCbPayload | ResultCbPayload;
}
