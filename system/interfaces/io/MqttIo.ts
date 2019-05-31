import IoItem from '../IoItem';
import {WebSocketClientProps} from './WebSocketClientIo';


export const Methods = [
  'isConnected',
  'publish',
  'subscribe',
  'onMessage',
  //'onMessageBin',
];



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



  close(connectionId: string, code: number, reason?: string): Promise<void>;
  //isConnected(): Promise<boolean>;
  publish(connectionId: string, topic: string, data?: string | Uint8Array): Promise<void>;

  /**
   * Tell broker that you want to listen this topic.
   * And then use onMessage method
   */
  subscribe(connectionId: string, topic: string): Promise<void>;
}
