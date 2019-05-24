import IoItem from '../IoItem';


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

export interface MqttConnection extends IoItem {
  isConnected(): Promise<boolean>;
  publish(topic: string, data?: string | Uint8Array): Promise<void>;

  /**
   * Tell broker that you want to listen this topic.
   * And then use onMessage method
   */
  subscribe(topic: string): Promise<void>;

  /**
   * Listen all the subscribed messages
   */
  onMessage(handler: (topic: string, data?: string | Uint8Array) => void): Promise<number>;
  //onMessageBin(): Promise<void>;
}

export default interface MqttIo extends IoItem {
  connect(params: MqttProps): MqttConnection;
}
