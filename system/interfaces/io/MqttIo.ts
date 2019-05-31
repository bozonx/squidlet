import IoItem from '../IoItem';


export const Methods = [
  'isConnected',
  'publish',
  'subscribe',
  'onMessage',
  //'onMessageBin',
];


//export type MqttIoEvents = 'open' | 'close' | 'message' | 'error';
export enum MqttIoEvents {
  open,
  close,
  message,
  error
}

export interface MqttProps {
  protocol: string;
  host: string;
  port: string;
}

export default interface MqttIo extends IoItem {
  newConnection(params: MqttProps): Promise<string>;
  reConnect(connectionId: string, props: MqttProps): Promise<void>;

  onOpen(cb: (connectionId: string) => void): Promise<number>;
  onClose(cb: (connectionId: string) => void): Promise<number>;
  /**
   * Listen all the subscribed messages
   */
  onMessage(cb: (connectionId: string, topic: string, data?: string | Uint8Array) => void): Promise<number>;
  onError(cb: (connectionId: string, err: Error) => void): Promise<number>;

  removeEventListener(eventName: MqttIoEvents, handlerId: number): Promise<void>;

  close(connectionId: string, force?: boolean): Promise<void>;
  //isConnected(): Promise<boolean>;
  publish(connectionId: string, topic: string, data?: string | Uint8Array): Promise<void>;

  /**
   * Tell broker that you want to listen this topic.
   * And then use onMessage method
   */
  subscribe(connectionId: string, topic: string): Promise<void>;
}
