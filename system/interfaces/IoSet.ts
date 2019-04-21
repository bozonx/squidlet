import {Primitives} from './Types';


export type IoMessageType = 'call' | 'result' | 'listenCb' | 'removeCbListener';

export interface CallMethodPayload {
  hostId: string;
  ioName: string;
  method: string;
  args: Primitives[];
}

export interface ResultPayload {
  ioName: string;
  method: string;
  error: string | undefined;
  result: Primitives;
}

export interface IoSetMessage {
  type: IoMessageType;
  payload: CallMethodPayload | ResultPayload;
}

export interface IoDefinition {
  [index: string]: string[];
}


export default interface IoSet {
  init(ioDefinitions: IoDefinition): Promise<void>;
  getInstance<T>(ioName: string): T;
  destroy(): void;

  // callMethod(ioName: string, methodName: string): Promise<any>;
  // addListener(ioName: string);
  // removeListener(ioName: string);

  //getInstance<T>(devName: string): T;
}
