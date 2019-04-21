import {Primitives} from './Types';


export type IoMessageType = 'call' | 'result' | 'listenCb' | 'removeCbListener';

export interface CallMethodPayload {
  hostId: string;
  method: string;
  args: Primitives[];
}

export interface IoSetMessage {
  type: IoMessageType;
  payload: CallMethodPayload;
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
