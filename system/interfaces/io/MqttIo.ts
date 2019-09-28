import IoItem from '../IoItem';


export const Methods = [
  'destroy',
  'newConnection',
  'reConnect',
  'end',
  'isConnected',
  'isDisconnecting',
  'isDisconnected',
  'isReconnecting',
  'onConnect',
  'onClose',
  'onMessage',
  'onError',
  'removeListener',
  'publish',
  'subscribe',
  'unsubscribe',
];


//export type MqttIoEvents = 'open' | 'close' | 'message' | 'error';
export enum MqttIoEvents {
  connect,
  close,
  message,
  error
}

export interface MqttOptions {
  username?: string;
  password?: string;
  resubscribe?: boolean;
}

export default interface MqttIo extends IoItem {
  destroy: () => Promise<void>;
  newConnection(url: string, options: MqttOptions): Promise<string>;
  reConnect(connectionId: string): Promise<void>;
  end(connectionId: string, force?: boolean): Promise<void>;
  isConnected(connectionId: string): Promise<boolean>;
  isDisconnecting(connectionId: string): Promise<boolean>;
  isDisconnected(connectionId: string): Promise<boolean>;
  isReconnecting(connectionId: string): Promise<boolean>;

  onConnect(cb: (connectionId: string) => void): Promise<number>;
  onClose(cb: (connectionId: string) => void): Promise<number>;
  /**
   * Listen all the subscribed messages
   */
  onMessage(cb: (connectionId: string, topic: string, data: string | Uint8Array) => void): Promise<number>;
  onError(cb: (connectionId: string, err: Error) => void): Promise<number>;
  removeListener(handlerId: number): Promise<void>;

  publish(connectionId: string, topic: string, data: string | Uint8Array): Promise<void>;
  /**
   * Tell broker that you want to listen this topic.
   * And then use onMessage method
   */
  subscribe(connectionId: string, topic: string): Promise<void>;
  unsubscribe(connectionId: string, topic: string): Promise<void>;
}
