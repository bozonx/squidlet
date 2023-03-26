import {JsonTypes} from '../../../../squidlet-lib/src/interfaces/Types';


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
  result?: JsonTypes;
}

export interface CallMethodPayload {
  method: string;
  args: (JsonTypes | undefined)[];
}

export interface ResultMethodPayload extends ResultLikePayload {
  method: string;
}

export interface CallCbPayload {
  cbId: string;
  args: (JsonTypes | undefined)[];
}

export interface ResultCbPayload extends ResultLikePayload {
  cbId: string;
}

export default interface RemoteCallMessage {
  type: RemoteCallMessageType;
  payload?: CallMethodPayload | ResultMethodPayload | CallCbPayload | ResultCbPayload;
}
